
type Listener = () => void;

class SettingsServiceImpl {
  private listeners: Listener[] = [];
  private _wallpaper = 'carbon';
  private _nodeAlias = 'Pi-Alpha-Node';
  private _torEnabled = false;

  constructor() {
    this.init();
  }

  private async init() {
    if (window.electron) {
      const w = await window.electron.storeGet('wallpaper');
      if (w) this._wallpaper = w;
      const a = await window.electron.storeGet('nodeAlias');
      if (a) this._nodeAlias = a;
      const t = await window.electron.storeGet('torEnabled');
      if (t !== undefined) this._torEnabled = t;
      this.emit();
    }
  }

  subscribe(listener: Listener) {
    this.listeners.push(listener);
    return () => { this.listeners = this.listeners.filter(l => l !== listener); };
  }

  private emit() { this.listeners.forEach(l => l()); }

  get wallpaper() { return this._wallpaper; }
  setWallpaper(w: string) { 
    this._wallpaper = w; 
    if (window.electron) window.electron.storeSet('wallpaper', w);
    this.emit(); 
  }

  get nodeAlias() { return this._nodeAlias; }
  setNodeAlias(a: string) { 
    this._nodeAlias = a; 
    if (window.electron) window.electron.storeSet('nodeAlias', a);
    this.emit(); 
  }

  get torEnabled() { return this._torEnabled; }
  setTorEnabled(e: boolean) { 
    this._torEnabled = e; 
    if (window.electron) window.electron.storeSet('torEnabled', e);
    this.emit(); 
  }
}

export const settingsService = new SettingsServiceImpl();
