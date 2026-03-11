
import express from "express";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);
  const wss = new WebSocketServer({ server });

  const PORT = 3000;

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
            const mode = msg.data.match(/export OS_MODE=(\w+)/)?.[1];
            
            // Inject the pinet function
            const pinetFunc = `
pinet() {
  if [ "$1" = "open" ]; then
    echo -e "\\033[1;32mOpening application: $2...\\033[0m"
    echo "PINET_CMD:OPEN:$2"
  elif [ "$1" = "install" ]; then
    echo -e "\\033[1;34mInstalling PiNet OS components...\\033[0m"
    sleep 1
    echo "Unpacking minima-node..."
    sleep 1
    echo "Setting up cluster-manager..."
    sleep 1
    echo -e "\\033[1;32mInstallation complete. You can now use 'pinet open <app_id>' to launch applications.\\033[0m"
    echo "Available apps: minima-node, system-monitor, terminal, ai-assistant, wallet, maxima-messenger, cluster-manager, depai-executor, imager-utility, file-explorer, settings, visual-studio"
  else
    echo "Switching to PiNet context..."
    export OS_MODE=pinet
  fi
}
`;
            pty.stdin.write(pinetFunc.replace(/\n/g, '\r\n'));

            if (mode === 'raspbian') {
              pty.stdin.write("export PS1='\\[\\e[32m\\]pi@raspberrypi\\[\\e[0m\\]:\\[\\e[34m\\]\\w\\[\\e[0m\\]\\$ '\n");
            } else {
              pty.stdin.write("export PS1='\\[\\e[35m\\]pinet@beta-node\\[\\e[0m\\]:\\[\\e[36m\\]\\w\\[\\e[0m\\]\\$ '\n");
              pty.stdin.write("alias raspbian='echo \"Switching to Raspbian context...\" && export OS_MODE=raspbian'\n");
            }
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
