import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import AdmZip from 'adm-zip';

const baseDir = process.cwd();

// 1. Create electron directory
const electronDir = path.join(baseDir, 'electron');
if (!fs.existsSync(electronDir)) {
  fs.mkdirSync(electronDir, { recursive: true });
}

// 2. Create scripts directory
const scriptsDir = path.join(baseDir, 'scripts');
if (!fs.existsSync(scriptsDir)) {
  fs.mkdirSync(scriptsDir, { recursive: true });
}

// 3. Write electron/main.ts
const mainTsContent = `import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { exec } from 'child_process';
import Store from 'electron-store';
import si from 'systeminformation';
import osUtils from 'os-utils';
import * as pty from 'node-pty';

const store = new Store();

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  const isKiosk = store.get('kioskMode', false) as boolean;

  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    fullscreen: true,
    frame: false,
    resizable: false,
    kiosk: isKiosk,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const isDev = !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC Handlers
ipcMain.handle('get-system-info', async () => {
  const cpu = await si.cpu();
  const mem = await si.mem();
  const osInfo = await si.osInfo();
  return { cpu, mem, osInfo };
});

ipcMain.handle('get-hardware-metrics', async () => {
  return new Promise((resolve) => {
    osUtils.cpuUsage((v) => {
      resolve({
        cpuUsage: v,
        totalMem: osUtils.totalmem(),
        freeMem: osUtils.freemem(),
        sysUptime: osUtils.sysUptime(),
      });
    });
  });
});

ipcMain.handle('read-dir', async (_, dirPath) => {
  try {
    const files = fs.readdirSync(dirPath, { withFileTypes: true });
    return files.map(f => ({ name: f.name, isDirectory: f.isDirectory() }));
  } catch (e: any) {
    return { error: e.message };
  }
});

ipcMain.handle('check-minima', async () => {
  try {
    const status = execSync('systemctl is-active minima').toString().trim();
    return { installed: true, status };
  } catch (e) {
    return { installed: false, status: 'inactive' };
  }
});

// PTY Terminal
let ptyProcess: pty.IPty | null = null;

ipcMain.on('terminal-start', (event) => {
  const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
  ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-color',
    cols: 80,
    rows: 30,
    cwd: process.env.HOME,
    env: process.env as any
  });

  ptyProcess.onData((data) => {
    event.sender.send('terminal-data', data);
  });
});

ipcMain.on('terminal-input', (_, data) => {
  if (ptyProcess) ptyProcess.write(data);
});

// Store
ipcMain.handle('store-get', (_, key) => store.get(key));
ipcMain.handle('store-set', (_, key, val) => store.set(key, val));
`;

fs.writeFileSync(path.join(electronDir, 'main.ts'), mainTsContent);

// 4. Write electron/preload.ts
const preloadTsContent = `import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  getHardwareMetrics: () => ipcRenderer.invoke('get-hardware-metrics'),
  readDir: (dirPath: string) => ipcRenderer.invoke('read-dir', dirPath),
  checkMinima: () => ipcRenderer.invoke('check-minima'),
  storeGet: (key: string) => ipcRenderer.invoke('store-get', key),
  storeSet: (key: string, val: any) => ipcRenderer.invoke('store-set', key, val),
  terminalStart: () => ipcRenderer.send('terminal-start'),
  terminalInput: (data: string) => ipcRenderer.send('terminal-input', data),
  onTerminalData: (callback: (data: string) => void) => {
    ipcRenderer.on('terminal-data', (_, data) => callback(data));
  }
});
`;

fs.writeFileSync(path.join(electronDir, 'preload.ts'), preloadTsContent);

// 5. Write electron/tsconfig.json
const electronTsConfig = `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "outDir": "../dist-electron",
    "rootDir": ".",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["."]
}`;

fs.writeFileSync(path.join(electronDir, 'tsconfig.json'), electronTsConfig);

// 6. Write scripts/install-pinet-desktop.sh
const installScript = `#!/bin/bash
set -e

echo "Installing PiNetOS Desktop Environment..."

# Install dependencies
sudo apt-get update
sudo apt-get install -y nodejs npm build-essential

# Build Electron app
npm install
npm run build
npm run electron:build

# Configure autostart
mkdir -p ~/.config/autostart
cat <<EOF > ~/.config/autostart/pinetos.desktop
[Desktop Entry]
Type=Application
Exec=/opt/PiNetOS/PiNetOS-Desktop.AppImage --no-sandbox
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
Name=PiNetOS
Comment=Start PiNetOS Desktop
EOF

echo "PiNetOS Desktop installed and configured for autostart."
`;

fs.writeFileSync(path.join(scriptsDir, 'install-pinet-desktop.sh'), installScript);
fs.chmodSync(path.join(scriptsDir, 'install-pinet-desktop.sh'), '755');

// 7. Update package.json
const packageJsonPath = path.join(baseDir, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

packageJson.main = 'dist-electron/main.js';
packageJson.scripts = {
  ...packageJson.scripts,
  "electron:dev": 'concurrently "npm run dev" "wait-on http://localhost:3000 && tsc -p electron && electron ."',
  "electron:build": "tsc -p electron && electron-builder"
};

packageJson.build = {
  "appId": "com.pinetos.desktop",
  "productName": "PiNetOS-Desktop",
  "directories": {
    "output": "dist-electron-build"
  },
  "files": [
    "dist/**/*",
    "dist-electron/**/*"
  ],
  "linux": {
    "target": ["AppImage", "tar.gz"],
    "category": "System"
  },
  "win": {
    "target": "nsis"
  },
  "mac": {
    "target": "dmg"
  }
};

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

// 8. Create typings for window.electron
const typesPath = path.join(baseDir, 'src/electron.d.ts');
const typesDir = path.dirname(typesPath);
if (!fs.existsSync(typesDir)) {
  fs.mkdirSync(typesDir, { recursive: true });
}

const typesContent = `export interface IElectronAPI {
  getSystemInfo: () => Promise<any>;
  getHardwareMetrics: () => Promise<any>;
  readDir: (dirPath: string) => Promise<any>;
  checkMinima: () => Promise<any>;
  storeGet: (key: string) => Promise<any>;
  storeSet: (key: string, val: any) => Promise<void>;
  terminalStart: () => void;
  terminalInput: (data: string) => void;
  onTerminalData: (callback: (data: string) => void) => void;
}

declare global {
  interface Window {
    electron?: IElectronAPI;
  }
}
`;

fs.writeFileSync(typesPath, typesContent);

// 9. Zip the project
const zip = new AdmZip();
const filesToZip = fs.readdirSync(baseDir);
for (const file of filesToZip) {
  if (['node_modules', '.git', 'dist', 'dist-electron', 'dist-electron-build', 'PiNetOS-Enterprise.zip', 'PiNetOS-Electron-Desktop.zip'].includes(file)) continue;
  const fullPath = path.join(baseDir, file);
  if (fs.statSync(fullPath).isDirectory()) {
    zip.addLocalFolder(fullPath, file);
  } else {
    zip.addLocalFile(fullPath);
  }
}

zip.writeZip(path.join(baseDir, 'PiNetOS-Electron-Desktop.zip'));
console.log('Successfully created PiNetOS-Electron-Desktop.zip');
