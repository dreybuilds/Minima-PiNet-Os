
import React, { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { motion } from 'motion/react';

interface TerminalAppProps {
  osMode?: 'pinet' | 'raspbian';
  onOpenApp?: (appId: string) => void;
}

const TerminalApp: React.FC<TerminalAppProps> = ({ osMode = 'pinet', onOpenApp }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = () => {
    if (socketRef.current?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      if (xtermRef.current) {
        xtermRef.current.write('\x1b[1;32mConnected to host shell.\x1b[0m\r\n');
        socket.send(JSON.stringify({ type: 'input', data: `export OS_MODE=${osMode}\nclear\n` }));
      }
    };

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'output' && xtermRef.current) {
          if (msg.data.includes('PINET_CMD:OPEN:')) {
            const match = msg.data.match(/PINET_CMD:OPEN:([a-zA-Z0-9-]+)/);
            if (match && match[1] && onOpenApp) {
              onOpenApp(match[1]);
            }
          } else {
            xtermRef.current.write(msg.data);
          }
        }
      } catch (e) {
        if (xtermRef.current) xtermRef.current.write(event.data);
      }
    };

    socket.onclose = () => {
      if (xtermRef.current) {
        xtermRef.current.write('\r\n\x1b[1;31mConnection lost. Retrying...\x1b[0m\r\n');
      }
      reconnectTimeoutRef.current = setTimeout(connect, 3000);
    };
  };

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize xterm.js
    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: 'block',
      fontSize: 14,
      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
      lineHeight: 1.2,
      theme: {
        background: 'transparent',
        foreground: '#e2e8f0',
        cursor: '#f43f5e', // Rose 500
        cursorAccent: '#000000',
        selectionBackground: 'rgba(244, 63, 94, 0.3)',
        black: '#0f172a',
        red: '#f43f5e',
        green: '#10b981',
        yellow: '#f59e0b',
        blue: '#3b82f6',
        magenta: '#d946ef',
        cyan: '#06b6d4',
        white: '#f8fafc',
      },
      allowTransparency: true,
      scrollback: 5000,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    
    const tryFit = () => {
      try {
        if (terminalRef.current && terminalRef.current.clientWidth > 0 && terminalRef.current.clientHeight > 0) {
          fitAddon.fit();
        }
      } catch (e) {
        console.warn('xterm fit failed', e);
      }
    };

    // Initial fit with a small delay to ensure container is ready
    const fitTimeout = setTimeout(tryFit, 100);

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    connect();

    term.onData((data) => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: 'input', data }));
      }
    });

    const handleResize = () => {
      tryFit();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(fitTimeout);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      socketRef.current?.close();
      term.dispose();
    };
  }, [osMode]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full h-full glass-dark rounded-b-lg overflow-hidden p-4"
    >
      <div ref={terminalRef} className="w-full h-full" />
    </motion.div>
  );
};

export default TerminalApp;
