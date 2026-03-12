
import { NodeStats } from '../types';

type Listener = () => void;

class MinimaServiceImpl {
  private listeners: Listener[] = [];
  private _balance = 1250.45;
  private _blockHeight = 1245091;
  private _transactions: any[] = [];
  private _stats: NodeStats = {
    blockHeight: 1245091,
    peers: 14,
    status: 'Synced',
    uptime: '14d 05h 22m',
    version: '1.0.35'
  };

  constructor() {
    // Poll for real updates from backend
    this.fetchUpdates();
    setInterval(() => this.fetchUpdates(), 5000);
  }

  private async fetchUpdates() {
    try {
      const response = await fetch('/api/minima/status');
      if (response.ok) {
        const data = await response.json();
        this._balance = data.balance;
        this._blockHeight = data.blockHeight;
        this._transactions = data.transactions;
        this._stats = {
          ...this._stats,
          blockHeight: data.blockHeight,
          peers: data.peers,
          status: data.status
        };
        this.emit();
      }
    } catch (e) {
      console.error("Failed to fetch minima updates:", e);
    }
  }

  subscribe(listener: Listener) {
    this.listeners.push(listener);
    return () => { this.listeners = this.listeners.filter(l => l !== listener); };
  }

  private emit() { this.listeners.forEach(l => l()); }

  get balance() { return this._balance; }
  get transactions() { return this._transactions; }
  get stats() { return this._stats; }

  async burn(amount: number, description: string) {
    try {
      await fetch('/api/minima/cmd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: `burn amount:${amount} desc:${description}` })
      });
      this.fetchUpdates();
    } catch (e) {
      console.error("Failed to burn:", e);
    }
  }

  async send(to: string, amount: number) {
    try {
      const response = await fetch('/api/minima/cmd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: `send to:${to} amount:${amount}` })
      });
      const result = await response.json();
      this.fetchUpdates();
      return result.status;
    } catch (e) {
      console.error("Failed to send:", e);
      return false;
    }
  }

  async cmd(command: string): Promise<any> {
    try {
      const response = await fetch('/api/minima/cmd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command })
      });
      return await response.json();
    } catch (e) {
      return { status: false, error: e };
    }
  }

  async initiateM402Stream(rate: number): Promise<string> {
    const sessionId = `M402-${Math.random().toString(36).substr(2, 9)}`;
    await this.cmd(`m402 create session:${sessionId} rate:${rate} target:cluster_pool`);
    return sessionId;
  }

  async stopM402Stream(sessionId: string): Promise<void> {
    await this.cmd(`m402 close session:${sessionId}`);
  }

  async sendMaximaMessage(to: string, application: string, data: any): Promise<boolean> {
    const jsonStr = JSON.stringify(data);
    const command = `maxima send to:${to} application:${application} data:${jsonStr}`;
    const result = await this.cmd(command);
    return result.status;
  }
}

export const minimaService = new MinimaServiceImpl();
export const MinimaService = minimaService; // Export as singleton instance but keep compatibility
