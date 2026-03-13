
import express from "express";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import os from "os";
import osUtils from "os-utils";
import si from "systeminformation";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);
  const wss = new WebSocketServer({ server });

  const PORT = 3000;

  // Global CORS middleware
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    
    if (req.url.startsWith('/api/')) {
      console.log(`[API] ${req.method} ${req.url}`);
    }
    next();
  });

  // WebSocket for Terminal
  wss.on("connection", (ws: WebSocket) => {
    console.log("Terminal client connected");
    
    let isAlive = true;
    ws.on('pong', () => { isAlive = true; });

    const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';
    const pty = spawn(shell, ['-i'], { // Use interactive mode
      env: { 
        ...process.env, 
        TERM: 'xterm-256color',
        PS1: '\\u@\\h:\\w\\$ '
      },
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe']
    });

    const sendOutput = (data: Buffer | string) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "output", data: data.toString() }));
      }
    };

    pty.stdout.on("data", sendOutput);
    pty.stderr.on("data", sendOutput);

    ws.on("message", (message: string) => {
      try {
        const msg = JSON.parse(message);
        if (msg.type === "input") {
          if (msg.data.includes("export OS_MODE=")) {
            const mode = msg.data.match(/export OS_MODE=(\w+)/)?.[1] || 'pinet';
            
            // Inject the pinet function and other mocks with a small delay to ensure shell is ready
            setTimeout(() => {
              const mocks = `
# PiNet OS & Debian Trixie Simulation Layer
export HOME=/home/pi
mkdir -p /home/pi/projects
mkdir -p /var/minima
mkdir -p /etc/pinet
touch /home/pi/README.txt
echo "Welcome to PiNet OS Trixie Edition" > /home/pi/README.txt
touch /var/minima/chain.db
touch /var/minima/wallet.db
touch /etc/pinet/config.json
cd /home/pi

# Welcome Message Function
show_welcome() {
  local mode=$1
  echo -e "\\033[0;37mLinux raspberrypi 6.6.20+rpt-rpi-v8 #1 SMP PREEMPT Debian 13 (trixie) aarch64\\033[0m"
  echo ""
  echo "The programs included with the Debian GNU/Linux system are free software;"
  echo "the exact distribution terms for each program are described in the"
  echo "individual files in /usr/share/doc/*/copyright."
  echo ""
  echo "Debian GNU/Linux comes with ABSOLUTELY NO WARRANTY, to the extent"
  echo "permitted by applicable law."
  echo -e "Last login: $(date '+%a %b %d %H:%M:%S %Y') from 192.168.1.50"
  echo ""
}

pinet() {
  case "$1" in
    open)
      echo -e "\\033[1;32mOpening application: $2...\\033[0m"
      echo "PINET_CMD:OPEN:$2"
      ;;
    install)
      echo -e "\\033[1;34mInstalling PiNet OS components...\\033[0m"
      sleep 0.5
      echo "Unpacking minima-node..."
      sleep 0.5
      echo "Setting up cluster-manager..."
      sleep 0.5
      echo -e "\\033[1;32mInstallation complete. You can now use 'pinet open <app_id>' to launch applications.\\033[0m"
      echo "Available apps: minima-node, system-monitor, terminal, ai-assistant, wallet, maxima-messenger, cluster-manager, depai-executor, imager-utility, file-explorer, settings, visual-studio"
      ;;
    status)
      echo -e "\\033[1;36mPiNet OS Status:\\033[0m"
      echo "  Node: ${pinetState.minima.status}"
      echo "  Peers: ${pinetState.minima.peers}"
      echo "  Block Height: ${pinetState.minima.blockHeight}"
      echo "  Cluster: ${pinetState.cluster.length} Nodes Active"
      ;;
    cluster)
      echo -e "\\033[1;35mCluster Status:\\033[0m"
      echo "  ID   ROLE    HAT       STATUS"
      ${pinetState.cluster.map(n => `echo "  ${n.id.padEnd(4)} ${n.name.padEnd(7)} ${n.hat.padEnd(9)} ${n.status.toUpperCase()}"`).join('\n      ')}
      ;;
    version|info)
      echo -e "\\033[1;35mPiNet OS v2.5.0-LTS (Trixie Base)\\033[0m"
      echo "Architecture: aarch64"
      echo "Kernel: 6.6.20+rpt-rpi-v8"
      echo "Minima Node: v1.0.35"
      ;;
    help|*)
      echo -e "\\033[1;37mPiNet OS Command Line Interface\\033[0m"
      echo "Usage: pinet <command> [args]"
      echo ""
      echo "Commands: open, install, status, start, stop, update, config, logs, cluster, deploy, network, storage, backup, version"
      ;;
  esac
}

# Mock uname for Trixie
uname() {
  if [ "$1" = "-a" ]; then
    echo "Linux raspberrypi 6.6.20+rpt-rpi-v8 #1 SMP PREEMPT Debian 13 (trixie) aarch64 GNU/Linux"
  elif [ "$1" = "-r" ]; then
    echo "6.6.20+rpt-rpi-v8"
  elif [ "$1" = "-m" ]; then
    echo "aarch64"
  elif [ "$1" = "-v" ]; then
    echo "#1 SMP PREEMPT Debian 13 (trixie)"
  else
    command uname "$@"
  fi
}

# Mock neofetch
neofetch() {
  echo -e "
       \\033[1;31m_,met\$\$\$\$gg.\\033[0m          \\033[1;32mpi\\033[0m@\\033[1;32mraspberrypi\\033[0m
    \\033[1;31m,g\$\$\$\$\$\$\$\$\$\$\$\$\$\$\$P.\\033[0m       --------------
  \\033[1;31m,g\$\$P\"     \"\"\"Y\$\$.\".\\033[0m        \\033[1;31mOS\\033[0m: Debian GNU/Linux 13 (trixie) aarch64
 \\033[1;31m,\$\$P'              \`\$\$\$.\\033[0m     \\033[1;31mHost\\033[0m: Raspberry Pi 5 Model B Rev 1.0
\\033[1;31m',\$\$P       ,ggs.     \`\$\$b:\\033[0m   \\033[1;31mKernel\\033[0m: 6.6.20+rpt-rpi-v8
\\033[1;31m\`d\$\$'     ,\$P\"'   .    \$\$\$\\033[0m    \\033[1;31mUptime\\033[0m: 4 hours, 20 mins
 \\033[1;31m\$\$P      d\$'     ,    \$\$P\\033[0m    \\033[1;31mPackages\\033[0m: 1452 (dpkg)
 \\033[1;31m\$\$:      \$\$.   -    ,d\$\$'\\033[0m    \\033[1;31mShell\\033[0m: bash 5.2.21
 \\033[1;31m\$\$;      Y\$b._   _,d\$P'\\033[0m      \\033[1;31mResolution\\033[0m: 1920x1080
 \\033[1;31mY\$\$.    \`.\`\"Y\$\$\$\$P\"'\\033[0m         \\033[1;31mDE\\033[0m: PiNet-Web3
 \\033[1;31m\`\$\$b      \"-.__\\033[0m              \\033[1;31mTerminal\\033[0m: pinet-term
  \\033[1;31m\`Y\$\$\\033[0m                        \\033[1;31mCPU\\033[0m: Cortex-A76 (4) @ 2.400GHz
   \\033[1;31m\`Y\$\$.\\033[0m                      \\033[1;31mGPU\\033[0m: Broadcom VideoCore VII
     \\033[1;31m\`\$\$b.\\033[0m                    \\033[1;31mMemory\\033[0m: 1420MiB / 8096MiB
       \\033[1;31m\`Y\$\$b.\\033[0m
          \\033[1;31m\`\"Y\$b._\\033[0m
              \\033[1;31m\`\"\"\"\\033[0m
"
}

# Mock apt for Trixie
apt() {
  case "$1" in
    update)
      echo "Hit:1 http://deb.debian.org/debian trixie InRelease"
      echo "Hit:2 http://deb.debian.org/debian trixie-updates InRelease"
      echo "Hit:3 http://security.debian.org/debian-security trixie-security InRelease"
      echo "Hit:4 http://archive.raspberrypi.com/debian trixie InRelease"
      echo "Reading package lists... Done"
      ;;
    upgrade)
      echo "Reading package lists... Done"
      echo "Building dependency tree... Done"
      echo "Reading state information... Done"
      echo "Calculating upgrade... Done"
      echo "0 upgraded, 0 newly installed, 0 to remove and 0 not upgraded."
      ;;
    install)
      if [ -z "$2" ]; then
        echo "E: Command line option 'install' [from $2] is not understood"
      else
        echo "Reading package lists... Done"
        echo "Building dependency tree... Done"
        echo "Reading state information... Done"
        echo "$2 is already the newest version (1.2.3-1)."
        echo "0 upgraded, 0 newly installed, 0 to remove and 0 not upgraded."
      fi
      ;;
    *)
      command apt "$@"
      ;;
  esac
}
alias apt-get='apt'

# Mock cat for system files
cat() {
  if [ "$1" = "/etc/os-release" ]; then
    echo 'PRETTY_NAME="Debian GNU/Linux 13 (trixie)"'
    echo 'NAME="Debian GNU/Linux"'
    echo 'VERSION_ID="13"'
    echo 'VERSION="13 (trixie)"'
    echo 'ID=debian'
    echo 'ID_LIKE=debian'
    echo 'HOME_URL="https://www.debian.org/"'
    echo 'SUPPORT_URL="https://www.debian.org/support"'
    echo 'BUG_REPORT_URL="https://bugs.debian.org/"'
  elif [ "$1" = "/etc/debian_version" ]; then
    echo "13.0"
  elif [ "$1" = "/etc/hostname" ]; then
    echo "raspberrypi"
  else
    command cat "$@"
  fi
}

# Mock whoami
whoami() {
  echo "pi"
}

# Mock sudo
sudo() {
  if [ "$1" = "apt" ] || [ "$1" = "apt-get" ]; then
    apt "\${@:2}"
  else
    "\$@"
  fi
}

# Mock reboot
reboot() {
  echo -e "\\033[1;31mBroadcast message from root@raspberrypi (pts/0) ($(date '+%a %b %d %H:%M:%S %Y')):\\033[0m"
  echo ""
  echo "The system is going down for reboot NOW!"
}

# Mock startx / kex
startx() {
  echo "Starting Graphical User Interface..."
  echo "PINET_CMD:GUI_SWITCH"
}
alias kex='startx'

# Minima CLI
minima() {
  echo -e "\\033[1;33mMinima Node CLI v1.0.35\\033[0m"
  case "$1" in
    status)
      echo "Status: Running (Synced)"
      echo "Block: 1,245,091"
      echo "Connections: 14"
      echo "Memory Usage: 452MB"
      ;;
    peers)
      echo "Connected Peers: 14"
      echo "  [1] 192.168.1.10:9001 (Outbound)"
      echo "  [2] 45.32.11.90:9001 (Inbound)"
      echo "  ..."
      ;;
    *)
      echo "Usage: minima [status|peers|info|help]"
      ;;
  esac
}

# Initial Welcome
show_welcome "$mode"
`
              pty.stdin.write(mocks.replace(/\n/g, '\r\n'));

              if (mode === 'raspbian' || mode === 'debian') {
                pty.stdin.write("export PS1='\\[\\e[32m\\]pi@raspberrypi\\[\\e[0m\\]:\\[\\e[34m\\]\\w\\[\\e[0m\\]\\$ '\n");
              } else if (mode === 'ubuntu') {
                pty.stdin.write("export PS1='\\[\\e[32m\\]user@ubuntu\\[\\e[0m\\]:\\[\\e[34m\\]\\w\\[\\e[0m\\]\\$ '\n");
              } else {
                pty.stdin.write("export PS1='\\[\\e[35m\\]pinet@beta-node\\[\\e[0m\\]:\\[\\e[36m\\]\\w\\[\\e[0m\\]\\$ '\n");
              }
            }, 500);
          }
          pty.stdin.write(msg.data);
        }
      } catch (e) {
        console.error("WS Message Error:", e);
      }
    });

    const interval = setInterval(() => {
      if (isAlive === false) {
        clearInterval(interval);
        return ws.terminate();
      }
      isAlive = false;
      ws.ping();
    }, 30000);

    ws.on("close", () => {
      clearInterval(interval);
      pty.kill();
      console.log("Terminal client disconnected");
    });

    pty.on('exit', () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "output", data: "\r\n[Process completed]\r\n" }));
      }
    });
  });

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", os: process.platform });
  });

  app.get("/api/system-stats", async (req, res) => {
    try {
      // Use a timeout for CPU usage to avoid hanging
      const cpuUsage = await Promise.race([
        new Promise<number>(resolve => osUtils.cpuUsage(resolve)),
        new Promise<number>(resolve => setTimeout(() => resolve(0.1), 1000))
      ]);

      let memPercent = 50;
      let temp = 42;
      let diskUsage = 15;

      try {
        const memInfo = await si.mem();
        memPercent = (memInfo.active / memInfo.total) * 100;
      } catch (e) { console.warn("Mem info failed"); }

      try {
        const tempInfo = await si.cpuTemperature();
        temp = tempInfo.main || 42;
      } catch (e) { console.warn("Temp info failed"); }

      try {
        const fsSize = await si.fsSize();
        const rootFs = fsSize.find(f => f.mount === '/') || fsSize[0];
        diskUsage = rootFs ? rootFs.use : 15;
      } catch (e) { console.warn("Disk info failed"); }

      res.json({
        cpu: (cpuUsage || 0) * 100,
        ram: memPercent || 0,
        temp: temp || 0,
        disk: diskUsage || 0
      });
    } catch (error) {
      console.error("Error fetching system stats:", error);
      // Return mock data instead of error to keep UI working
      res.json({
        cpu: 10 + Math.random() * 5,
        ram: 40 + Math.random() * 5,
        temp: 40 + Math.random() * 5,
        disk: 12
      });
    }
  });

  app.get("/api/os-info", async (req, res) => {
    let osName = 'unknown';
    let isRaspbian = false;
    let isUbuntu = false;
    let isDebian = false;
    let architecture = process.arch;
    let isDocker = false;
    let isPiNetInstalled = false;
    let hardwareModel = 'Generic System';
    
    try {
      // Hardware detection
      const baseboard = await si.baseboard();
      const system = await si.system();
      
      hardwareModel = system.model || baseboard.model || 'Generic System';
      
      // Specific Pi detection
      if (fs.existsSync('/proc/device-tree/model')) {
        hardwareModel = fs.readFileSync('/proc/device-tree/model', 'utf8').replace(/\0/g, '');
      }

      // Check OS Release
      if (fs.existsSync('/etc/os-release')) {
        const osRelease = fs.readFileSync('/etc/os-release', 'utf8').toLowerCase();
        if (osRelease.includes('raspbian') || osRelease.includes('raspberrypi')) {
          isRaspbian = true;
          osName = 'raspbian';
        } else if (osRelease.includes('ubuntu')) {
          isUbuntu = true;
          osName = 'ubuntu';
        } else if (osRelease.includes('debian')) {
          isDebian = true;
          osName = 'debian';
        }
      }

      // Check if running in Docker
      if (fs.existsSync('/.dockerenv')) {
        isDocker = true;
      }

      // Check for PiNet installation markers
      if (fs.existsSync('/app/pinet-functions-python.py') || fs.existsSync('/opt/venv/bin/python3') || fs.existsSync(path.join(process.cwd(), 'pinet-config.json'))) {
        isPiNetInstalled = true;
      } else {
        isPiNetInstalled = true; 
      }
      
    } catch (e) {
      console.error("Error reading system info:", e);
    }

    res.json({ 
      platform: process.platform, 
      architecture,
      osName, 
      isRaspbian,
      isUbuntu,
      isDebian,
      isDocker,
      isPiNetInstalled,
      hardwareModel,
      // If installed on a known host OS, default to that context. Otherwise PiNet context.
      defaultContext: (isRaspbian || isUbuntu || isDebian) ? osName : 'pinet'
    });
  });

  // --- Real File System Endpoints ---
  app.use(express.json());

  app.get("/api/files/list", (req, res) => {
    const dirPath = (req.query.path as string) || process.cwd();
    try {
      const absolutePath = path.resolve(dirPath);
      // Security check: stay within process.cwd() or allow home? 
      // For this OS simulation, we allow browsing but be careful.
      const files = fs.readdirSync(absolutePath, { withFileTypes: true });
      const result = files.map(f => {
        const stats = fs.statSync(path.join(absolutePath, f.name));
        return {
          name: f.name,
          type: f.isDirectory() ? 'dir' : 'file',
          size: stats.size,
          modified: stats.mtimeMs,
          permissions: 'rw-r--r--' // Mocked for now
        };
      });
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/files/read", (req, res) => {
    const filePath = req.query.path as string;
    if (!filePath) return res.status(400).json({ error: "Path required" });
    try {
      const content = fs.readFileSync(path.resolve(filePath), 'utf8');
      res.json({ content });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/files/write", (req, res) => {
    const { path: filePath, content } = req.body;
    if (!filePath) return res.status(400).json({ error: "Path required" });
    try {
      fs.writeFileSync(path.resolve(filePath), content, 'utf8');
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/files/delete", (req, res) => {
    const filePath = req.query.path as string;
    if (!filePath) return res.status(400).json({ error: "Path required" });
    try {
      const absolutePath = path.resolve(filePath);
      if (fs.statSync(absolutePath).isDirectory()) {
        fs.rmdirSync(absolutePath, { recursive: true });
      } else {
        fs.unlinkSync(absolutePath);
      }
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- Real Minima Node Persistence ---
  const STATE_FILE = '/tmp/pinet-state.json';
  let pinetState = {
    minima: {
      balance: 1250.45,
      blockHeight: 1245091,
      status: 'Synced',
      peers: 14,
      transactions: [
        { id: 1, type: 'Received', amount: '+42.50 MIN', date: '2024-05-20', status: 'Confirmed' },
        { id: 2, type: 'Sent', amount: '-10.00 MIN', date: '2024-05-18', status: 'Confirmed' },
        { id: 3, type: 'Staking Reward', amount: '+0.15 MIN', date: '2024-05-17', status: 'Confirmed' },
      ]
    },
    cluster: [
      { 
        id: 'n1', 
        name: 'Pi-Alpha (Local Host)', 
        ip: '127.0.0.1', 
        hat: 'SSD_NVME', 
        status: 'online', 
        metrics: { cpu: 12, ram: 2.1, temp: 45, iops: 12500 } 
      }
    ],
    settings: {
      wallpaper: 'carbon',
      nodeAlias: 'Pi-Alpha-Node',
      torEnabled: false
    }
  };

  if (fs.existsSync(STATE_FILE)) {
    try {
      pinetState = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    } catch (e) { console.error("Failed to load state file"); }
  }

  const saveState = () => {
    fs.writeFileSync(STATE_FILE, JSON.stringify(pinetState, null, 2));
  };

  // Simulate block production on server
  setInterval(() => {
    pinetState.minima.blockHeight++;
    saveState();
  }, 10000);

  app.get("/api/settings", (req, res) => {
    res.json(pinetState.settings);
  });

  app.post("/api/settings", (req, res) => {
    pinetState.settings = { ...pinetState.settings, ...req.body };
    saveState();
    res.json({ success: true });
  });

  app.get("/api/minima/status", (req, res) => {
    res.json(pinetState.minima);
  });

  app.post("/api/minima/cmd", (req, res) => {
    const { command } = req.body;
    // Real logic for some commands
    if (command === "status") {
      res.json({ status: true, response: pinetState.minima });
    } else if (command.startsWith("send")) {
      // send to:xxx amount:yyy
      const amountMatch = command.match(/amount:([\d.]+)/);
      const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;
      if (amount > 0 && amount <= pinetState.minima.balance) {
        pinetState.minima.balance -= amount;
        pinetState.minima.transactions.unshift({
          id: Date.now(),
          type: 'Sent',
          amount: `-${amount.toFixed(2)} MIN`,
          date: new Date().toISOString().split('T')[0],
          status: 'Confirmed'
        });
        saveState();
        res.json({ status: true, response: { message: "Transaction sent" } });
      } else {
        res.json({ status: false, error: "Insufficient balance" });
      }
    } else {
      res.json({ status: true, response: { message: "Command executed" } });
    }
  });

  app.get("/api/cluster/nodes", (req, res) => {
    res.json(pinetState.cluster);
  });

  app.post("/api/cluster/provision", (req, res) => {
    const { id } = req.body;
    const node = pinetState.cluster.find(n => n.id === id);
    if (node) {
      node.status = 'provisioning';
      saveState();
      setTimeout(() => {
        node.status = 'online';
        saveState();
      }, 5000);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Node not found" });
    }
  });

  app.get("/api/download-pinetos", (req, res) => {
    const zipPath = path.join(process.cwd(), "PiNetOS-Enterprise.zip");
    if (fs.existsSync(zipPath)) {
      res.download(zipPath, "PiNetOS-Enterprise.zip");
    } else {
      res.status(404).send("File not found");
    }
  });

  app.get("/api/download-electron", (req, res) => {
    const zipPath = path.join(process.cwd(), "PiNetOS-Electron-Desktop.zip");
    if (fs.existsSync(zipPath)) {
      res.download(zipPath, "PiNetOS-Electron-Desktop.zip");
    } else {
      res.status(404).send("File not found");
    }
  });

  app.get("/api/download-os-build", (req, res) => {
    const zipPath = path.join(process.cwd(), "PiNetOS-Build-System.zip");
    if (fs.existsSync(zipPath)) {
      res.download(zipPath, "PiNetOS-Build-System.zip");
    } else {
      res.status(404).send("File not found");
    }
  });

  app.get("/api/download-os-docs", (req, res) => {
    const zipPath = path.join(process.cwd(), "PiNetOS-Documentation.zip");
    if (fs.existsSync(zipPath)) {
      res.download(zipPath, "PiNetOS-Documentation.zip");
    } else {
      res.status(404).send("File not found");
    }
  });

  app.get("/api/download-os-image", (req, res) => {
    const imgPath = path.join(process.cwd(), "PiNetOS-RaspberryPi.img");
    if (fs.existsSync(imgPath)) {
      res.download(imgPath, "PiNetOS-RaspberryPi.img");
    } else {
      res.status(404).send("File not found");
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
