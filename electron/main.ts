import { app, BrowserWindow, ipcMain } from 'electron';
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
