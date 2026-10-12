import type { Edits } from './world';

export type Slot = { id: number; count: number } | null;
export type GameMode = 'survival' | 'creative';

export interface SaveData {
  name: string;
  seed: number;
  mode: GameMode;
  created: number;
  lastPlayed: number;
  edits: Edits;
  player?: { x: number; y: number; z: number; yaw: number; pitch: number; health: number; flying: boolean };
  inv?: Slot[];
  time?: number;
}

export interface Settings { renderDist: number; sensitivity: number; fov: number; }

const PREFIX = 'webcraft_world_';

export function listWorlds(): SaveData[] {
  const out: SaveData[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)!;
    if (k.startsWith(PREFIX)) {
      try { out.push(JSON.parse(localStorage.getItem(k)!)); } catch { /* ignore */ }
    }
  }
  return out.sort((a, b) => b.lastPlayed - a.lastPlayed);
}

export function saveWorld(d: SaveData) {
  try { localStorage.setItem(PREFIX + d.name, JSON.stringify(d)); } catch (e) { console.warn('Save failed', e); }
}

export function deleteWorld(name: string) { localStorage.removeItem(PREFIX + name); }

export function loadSettings(): Settings {
  try {
    const s = JSON.parse(localStorage.getItem('webcraft_settings') || '{}');
    return { renderDist: s.renderDist ?? 5, sensitivity: s.sensitivity ?? 1, fov: s.fov ?? 75 };
  } catch { return { renderDist: 5, sensitivity: 1, fov: 75 }; }
}
export function saveSettings(s: Settings) { localStorage.setItem('webcraft_settings', JSON.stringify(s)); }
