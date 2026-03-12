
import { ClusterNode } from '../types';

type Listener = () => void;

class ClusterServiceImpl {
  private listeners: Listener[] = [];
  private _nodes: ClusterNode[] = [];

  constructor() {
    // Poll for real updates from backend
    this.fetchUpdates();
    setInterval(() => this.fetchUpdates(), 5000);
  }

  private async fetchUpdates() {
    try {
      const response = await fetch('/api/cluster/nodes');
      if (response.ok) {
        this._nodes = await response.json();
        this.emit();
      }
    } catch (e) {
      console.error("Failed to fetch cluster updates:", e);
    }
  }

  subscribe(listener: Listener) {
    this.listeners.push(listener);
    return () => { this.listeners = this.listeners.filter(l => l !== listener); };
  }

  private emit() { this.listeners.forEach(l => l()); }

  get nodes() { return this._nodes; }

  async provisionNode(id: string) {
    try {
      await fetch('/api/cluster/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      this.fetchUpdates();
    } catch (e) {
      console.error("Failed to provision node:", e);
    }
  }
}

export const clusterService = new ClusterServiceImpl();
