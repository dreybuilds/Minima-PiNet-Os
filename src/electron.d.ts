export interface IElectronAPI {
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
