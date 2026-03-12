import { contextBridge, ipcRenderer } from 'electron';

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
