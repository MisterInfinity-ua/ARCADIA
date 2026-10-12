import { mulberry32 } from './noise';

export const ATLAS_COLS = 8;
export const ATLAS_ROWS = 5;
export const TS = 16;

export const B = {
  AIR: 0, GRASS: 1, DIRT: 2, STONE: 3, COBBLE: 4, SAND: 5, LOG: 6, LEAVES: 7, PLANKS: 8, GLASS: 9,
  WATER: 10, BEDROCK: 11, COAL: 12, IRON: 13, GOLD: 14, DIAMOND: 15, SNOWGRASS: 16, BRICK: 17,
  GRAVEL: 18, TABLE: 19, CACTUS: 20, WOOL: 21, TNT: 22, BOOKSHELF: 23, OBSIDIAN: 24, GLOWSTONE: 25,
  REDWOOL: 26, ROSE: 27, DANDELION: 28, TALLGRASS: 29, SANDSTONE: 30, ICE: 31, SNOW: 32,
} as const;

export const ITEM = { PORKCHOP: 100, MUTTON: 101, FLESH: 102 } as const;

export interface BlockDef {
  name: string;
  tiles: [number, number, number]; // top, bottom, side
  solid: boolean;
  transparent: boolean;
  cutout: boolean;
  liquid: boolean;
  plant: boolean;
  hardness: number;
  drop: number; // -1 = self, 0 = nothing
}

function def(name: string, tiles: number | [number, number, number], o: Partial<BlockDef> = {}): BlockDef {
  return {
    name,
    tiles: typeof tiles === 'number' ? [tiles, tiles, tiles] : tiles,
    solid: true, transparent: false, cutout: false, liquid: false, plant: false, hardness: 1, drop: -1,
    ...o,
  };
}

export const BLOCKS: BlockDef[] = [];
BLOCKS[B.AIR] = def('Air', 0, { solid: false, transparent: true });
BLOCKS[B.GRASS] = def('Grass Block', [0, 2, 1], { hardness: 0.6, drop: B.DIRT });
BLOCKS[B.DIRT] = def('Dirt', 2, { hardness: 0.5 });
BLOCKS[B.STONE] = def('Stone', 3, { hardness: 1.5, drop: B.COBBLE });
BLOCKS[B.COBBLE] = def('Cobblestone', 4, { hardness: 1.8 });
BLOCKS[B.SAND] = def('Sand', 5, { hardness: 0.5 });
BLOCKS[B.LOG] = def('Oak Log', [7, 7, 6], { hardness: 1.2 });
BLOCKS[B.LEAVES] = def('Oak Leaves', 8, { hardness: 0.2, transparent: true, cutout: true, drop: 0 });
BLOCKS[B.PLANKS] = def('Oak Planks', 9, { hardness: 1 });
BLOCKS[B.GLASS] = def('Glass', 10, { hardness: 0.3, transparent: true, cutout: true, drop: 0 });
BLOCKS[B.WATER] = def('Water', 11, { solid: false, transparent: true, liquid: true, hardness: -1 });
BLOCKS[B.BEDROCK] = def('Bedrock', 12, { hardness: -1 });
BLOCKS[B.COAL] = def('Coal Ore', 13, { hardness: 2 });
BLOCKS[B.IRON] = def('Iron Ore', 14, { hardness: 2.5 });
BLOCKS[B.GOLD] = def('Gold Ore', 15, { hardness: 2.5 });
BLOCKS[B.DIAMOND] = def('Diamond Ore', 16, { hardness: 3 });
BLOCKS[B.SNOWGRASS] = def('Snowy Grass', [17, 2, 18], { hardness: 0.6, drop: B.DIRT });
BLOCKS[B.BRICK] = def('Bricks', 19, { hardness: 2 });
BLOCKS[B.GRAVEL] = def('Gravel', 20, { hardness: 0.6 });
BLOCKS[B.TABLE] = def('Crafting Table', [21, 9, 22], { hardness: 1.2 });
BLOCKS[B.CACTUS] = def('Cactus', [24, 24, 23], { hardness: 0.4 });
BLOCKS[B.WOOL] = def('White Wool', 25, { hardness: 0.6 });
BLOCKS[B.TNT] = def('TNT', [27, 27, 26], { hardness: 0.1 });
BLOCKS[B.BOOKSHELF] = def('Bookshelf', [9, 9, 28], { hardness: 1 });
BLOCKS[B.OBSIDIAN] = def('Obsidian', 29, { hardness: 6 });
BLOCKS[B.GLOWSTONE] = def('Glowstone', 30, { hardness: 0.4 });
BLOCKS[B.REDWOOL] = def('Red Wool', 31, { hardness: 0.6 });
BLOCKS[B.ROSE] = def('Rose', 32, { solid: false, transparent: true, cutout: true, plant: true, hardness: 0 });
BLOCKS[B.DANDELION] = def('Dandelion', 33, { solid: false, transparent: true, cutout: true, plant: true, hardness: 0 });
BLOCKS[B.TALLGRASS] = def('Tall Grass', 34, { solid: false, transparent: true, cutout: true, plant: true, hardness: 0, drop: 0 });
BLOCKS[B.SANDSTONE] = def('Sandstone', [35, 35, 35], { hardness: 1.2 });
BLOCKS[B.ICE] = def('Ice', 36, { hardness: 0.5, drop: 0 });
BLOCKS[B.SNOW] = def('Snow Block', 17, { hardness: 0.4 });

export const BLOCK_COUNT = BLOCKS.length;

// Fast lookup tables
export const SOLID = new Uint8Array(256);
export const TRANSP = new Uint8Array(256);
export const PLANT = new Uint8Array(256);
export const LIQUID = new Uint8Array(256);
export const CUTOUT = new Uint8Array(256);
export const OCCLUDE = new Uint8Array(256); // for AO & sky shading
BLOCKS.forEach((b, i) => {
  SOLID[i] = b.solid ? 1 : 0;
  TRANSP[i] = b.transparent ? 1 : 0;
  PLANT[i] = b.plant ? 1 : 0;
  LIQUID[i] = b.liquid ? 1 : 0;
  CUTOUT[i] = b.cutout ? 1 : 0;
  OCCLUDE[i] = i !== 0 && !b.plant && !b.liquid && i !== B.GLASS ? 1 : 0;
});

export interface ItemDef { name: string; food: number; color: string; }
export const ITEMS: Record<number, ItemDef> = {
  [ITEM.PORKCHOP]: { name: 'Raw Porkchop', food: 4, color: '#f19b9b' },
  [ITEM.MUTTON]: { name: 'Raw Mutton', food: 4, color: '#d9534f' },
  [ITEM.FLESH]: { name: 'Rotten Flesh', food: 2, color: '#8a6d3b' },
};

export const isItem = (id: number) => id >= 100;
export const getName = (id: number) => (isItem(id) ? ITEMS[id]?.name ?? 'Item' : BLOCKS[id]?.name ?? '?');

// Creative palette (placeable blocks)
export const PALETTE: number[] = [
  B.GRASS, B.DIRT, B.STONE, B.COBBLE, B.SAND, B.GRAVEL, B.LOG, B.PLANKS, B.LEAVES, B.GLASS,
  B.BRICK, B.SANDSTONE, B.TABLE, B.BOOKSHELF, B.WOOL, B.REDWOOL, B.SNOW, B.SNOWGRASS, B.ICE,
  B.CACTUS, B.OBSIDIAN, B.GLOWSTONE, B.TNT, B.COAL, B.IRON, B.GOLD, B.DIAMOND, B.BEDROCK,
  B.ROSE, B.DANDELION, B.TALLGRASS, ITEM.PORKCHOP, ITEM.MUTTON,
];

export interface Recipe { out: number; count: number; needs: [number, number][]; table?: boolean; }
export const RECIPES: Recipe[] = [
  { out: B.PLANKS, count: 4, needs: [[B.LOG, 1]] },
  { out: B.TABLE, count: 1, needs: [[B.PLANKS, 4]] },
  { out: B.GLASS, count: 1, needs: [[B.SAND, 1], [B.COAL, 1]] },
  { out: B.STONE, count: 4, needs: [[B.COBBLE, 4], [B.COAL, 1]] },
  { out: B.SANDSTONE, count: 1, needs: [[B.SAND, 4]] },
  { out: B.BRICK, count: 2, needs: [[B.DIRT, 2], [B.SAND, 2]], table: true },
  { out: B.BOOKSHELF, count: 1, needs: [[B.PLANKS, 6], [B.LEAVES, 3]], table: true },
  { out: B.TNT, count: 1, needs: [[B.SAND, 4], [B.GRAVEL, 5]], table: true },
  { out: B.WOOL, count: 1, needs: [[B.TALLGRASS, 4]], table: true },
  { out: B.REDWOOL, count: 1, needs: [[B.WOOL, 1], [B.ROSE, 1]], table: true },
  { out: B.SNOW, count: 1, needs: [[B.SNOWGRASS, 1]] },
  { out: B.GLOWSTONE, count: 1, needs: [[B.GOLD, 1], [B.COAL, 2]], table: true },
  { out: B.OBSIDIAN, count: 1, needs: [[B.DIAMOND, 1], [B.STONE, 4]], table: true },
];

// ---------------- Procedural texture atlas -------------------
type RGB = number[];
const clamp = (v: number) => Math.max(0, Math.min(255, v | 0));

function paintTile(t: number, set: (x: number, y: number, c: RGB, a?: number) => void, r: () => number) {
  const sh = (b: RGB, amt: number) => { const k = (r() - 0.5) * amt; return [b[0] + k, b[1] + k, b[2] + k]; };
  const mul = (c: RGB, m: number) => [c[0] * m, c[1] * m, c[2] * m];
  const each = (f: (x: number, y: number) => void) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) f(x, y); };
  const dirt = () => each((x, y) => { let c = sh([134, 96, 67], 36); if (r() < 0.1) c = mul(c, 0.72); set(x, y, c); });
  const stone = () => each((x, y) => { let c = sh([125, 125, 125], 22); if (r() < 0.08) c = mul(c, 0.8); set(x, y, c); });
  const planks = () => each((x, y) => {
    let c = sh([162, 130, 78], 16);
    const row = Math.floor(y / 4);
    if (y % 4 === 3) c = mul(c, 0.68);
    if (x === (row * 5 + 3) % 16) c = mul(c, 0.8);
    set(x, y, c);
  });
  const ore = (col: RGB) => {
    stone();
    for (let k = 0; k < 5; k++) {
      const cx = 2 + r() * 12, cy = 2 + r() * 12;
      each((x, y) => { const d = Math.hypot(x - cx, y - cy); if (d < 1.1 + r() * 0.7) set(x, y, sh(col, 30)); });
    }
  };
  const circle = (cx: number, cy: number, rad: number, c: RGB) =>
    each((x, y) => { if (Math.hypot(x + 0.5 - cx, y + 0.5 - cy) < rad) set(x, y, sh(c, 20)); });
  const clear = () => each((x, y) => set(x, y, [0, 0, 0], 0));

  switch (t) {
    case 0: each((x, y) => set(x, y, sh([95, 159, 53], 40))); break;
    case 1: {
      dirt();
      for (let x = 0; x < 16; x++) {
        const d = 3 + (r() < 0.5 ? 1 : 0) + (r() < 0.25 ? 1 : 0);
        for (let y = 0; y < d; y++) set(x, y, sh([90, 150, 50], 36));
      }
      break;
    }
    case 2: dirt(); break;
    case 3: stone(); break;
    case 4: {
      const pts = Array.from({ length: 9 }, () => [r() * 16, r() * 16, 0.75 + r() * 0.35]);
      each((x, y) => {
        let d1 = 99, d2 = 99, id = 0;
        pts.forEach((p, i) => {
          for (const ox of [-16, 0, 16]) for (const oy of [-16, 0, 16]) {
            const d = Math.hypot(x - p[0] - ox, y - p[1] - oy);
            if (d < d1) { d2 = d1; d1 = d; id = i; } else if (d < d2) d2 = d;
          }
        });
        let c = sh(mul([130, 130, 130], pts[id][2]), 18);
        if (d2 - d1 < 1.3) c = [70, 70, 70];
        set(x, y, c);
      });
      break;
    }
    case 5: each((x, y) => set(x, y, sh([219, 207, 163], 20))); break;
    case 6: each((x, y) => { let c = sh([104, 82, 50], 20); if (x % 4 === 0 || (x % 4 === 2 && r() < 0.4)) c = mul(c, 0.72); set(x, y, c); }); break;
    case 7: each((x, y) => {
      const d = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5));
      if (d > 6.5) set(x, y, sh([104, 82, 50], 20));
      else set(x, y, sh(Math.floor(d) % 2 ? [176, 142, 87] : [150, 118, 70], 12));
    }); break;
    case 8: each((x, y) => { if (r() < 0.16) set(x, y, [0, 0, 0], 0); else set(x, y, sh([58, 120, 38], 50)); }); break;
    case 9: planks(); break;
    case 10: each((x, y) => {
      if (x === 0 || y === 0 || x === 15 || y === 15) set(x, y, [215, 235, 240]);
      else if ((x - y === 4 && x > 5 && x < 11) || (x - y === 6 && x > 8 && x < 12)) set(x, y, [255, 255, 255], 220);
      else set(x, y, [0, 0, 0], 0);
    }); break;
    case 11: each((x, y) => set(x, y, sh([48, 92, 210 + Math.sin((x + y) * 0.8) * 12], 22))); break;
    case 12: each((x, y) => { const v = r() < 0.5 ? 50 + r() * 30 : 110 + r() * 50; set(x, y, [v, v, v]); }); break;
    case 13: ore([28, 28, 28]); break;
    case 14: ore([216, 175, 147]); break;
    case 15: ore([250, 222, 60]); break;
    case 16: ore([90, 232, 222]); break;
    case 17: each((x, y) => set(x, y, sh([240, 248, 252], 12))); break;
    case 18: {
      dirt();
      for (let x = 0; x < 16; x++) { const d = 3 + (r() < 0.5 ? 1 : 0) + (r() < 0.3 ? 1 : 0); for (let y = 0; y < d; y++) set(x, y, sh([240, 248, 252], 12)); }
      break;
    }
    case 19: each((x, y) => {
      const row = Math.floor(y / 4);
      const mortar = y % 4 === 3 || x % 8 === (row % 2 ? 4 : 0);
      set(x, y, mortar ? sh([180, 175, 165], 10) : sh([152, 72, 55], 26));
    }); break;
    case 20: {
      const cols = [[130, 125, 120], [100, 95, 90], [155, 145, 135], [88, 80, 75]];
      each((x, y) => set(x, y, sh(cols[Math.floor(r() * 4)], 16)));
      break;
    }
    case 21: planks(); each((x, y) => { if (x === 0 || y === 0 || x === 15 || y === 15 || x === 7 || y === 7) set(x, y, sh([100, 70, 40], 10)); }); break;
    case 22: {
      planks();
      each((x, y) => {
        if (y < 3) set(x, y, sh([110, 80, 45], 10));
        if (x >= 3 && x <= 5 && y >= 5 && y <= 12) set(x, y, y < 8 ? [140, 140, 140] : [110, 80, 45]);
        if (x >= 10 && x <= 12 && y >= 5 && y <= 12) set(x, y, y < 7 ? [170, 170, 170] : [110, 80, 45]);
      });
      break;
    }
    case 23: each((x, y) => { let c = sh([85, 135, 45], 15); if (x % 4 === 1) c = mul(c, 0.78); if (r() < 0.05) c = [210, 225, 160]; set(x, y, c); }); break;
    case 24: each((x, y) => { const d = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5)); set(x, y, sh(d > 6 ? [70, 115, 40] : d < 2 ? [150, 190, 90] : [100, 150, 55], 12)); }); break;
    case 25: each((x, y) => set(x, y, sh([234, 234, 234], 14))); break;
    case 26: {
      const T = ['111', '010', '010', '010', '010'], N = ['101', '111', '111', '101', '101'];
      each((x, y) => {
        if (y < 4 || y >= 12) { let c = sh([205, 50, 40], 20); if (x % 4 === 0) c = mul(c, 0.8); set(x, y, c); }
        else set(x, y, sh([232, 232, 232], 8));
      });
      [[T, 2], [N, 6], [T, 11]].forEach(([g, ox]) => {
        (g as string[]).forEach((row, yy) => row.split('').forEach((ch, xx) => { if (ch === '1') set((ox as number) + xx, 6 + yy, [30, 30, 30]); }));
      });
      break;
    }
    case 27: each((x, y) => { const c = x >= 5 && x <= 10 && y >= 5 && y <= 10 ? sh([80, 80, 80], 10) : sh([205, 50, 40], 20); set(x, y, c); }); break;
    case 28: {
      planks();
      const bookCols = [[150, 40, 40], [40, 80, 150], [50, 120, 50], [140, 110, 40], [100, 50, 120]];
      for (const [y0, y1] of [[1, 7], [9, 15]]) {
        let x = 1;
        while (x < 15) {
          const w = 1 + Math.floor(r() * 2);
          const c = bookCols[Math.floor(r() * bookCols.length)];
          const top = y0 + Math.floor(r() * 2);
          for (let xx = x; xx < Math.min(15, x + w); xx++) for (let y = top; y < y1; y++) set(xx, y, sh(c, 20));
          x += w + (r() < 0.3 ? 1 : 0);
        }
      }
      break;
    }
    case 29: each((x, y) => set(x, y, r() < 0.1 ? [75, 45, 110] : sh([22, 16, 34], 12))); break;
    case 30: {
      const cols = [[250, 210, 110], [215, 155, 60], [255, 240, 170]];
      each((x, y) => set(x, y, sh(cols[Math.floor(r() * 3)], 20)));
      break;
    }
    case 31: each((x, y) => set(x, y, sh([172, 40, 40], 16))); break;
    case 32: clear();
      for (let y = 7; y < 16; y++) { set(7, y, [50, 120, 40]); set(8, y, [60, 135, 45]); }
      set(6, 11, [60, 140, 45]); set(5, 10, [60, 140, 45]); set(9, 12, [60, 140, 45]); set(10, 11, [60, 140, 45]);
      circle(8, 5, 3.2, [200, 30, 30]); set(7, 4, [120, 10, 10]); set(8, 5, [150, 20, 20]);
      break;
    case 33: clear();
      for (let y = 9; y < 16; y++) set(7, y, [60, 135, 45]);
      set(6, 12, [60, 140, 45]); set(8, 13, [60, 140, 45]);
      circle(7.5, 7, 2.6, [250, 220, 40]); set(7, 6, [230, 160, 20]);
      break;
    case 34: clear();
      for (let b = 0; b < 8; b++) {
        const bx = 1 + Math.floor(r() * 14), hgt = 6 + Math.floor(r() * 9), lean = (r() - 0.5) * 0.5;
        for (let i = 0; i < hgt; i++) {
          const x = Math.round(bx + i * lean), y = 15 - i;
          if (x >= 0 && x < 16) set(x, y, sh([85, 155, 50], 40));
        }
      }
      break;
    case 35: each((x, y) => { let c = sh([216, 203, 155], 12); if (y % 5 === 4 || y === 0) c = mul(c, 0.86); set(x, y, c); }); break;
    case 36: each((x, y) => set(x, y, (x + y * 2) % 9 === 0 && r() < 0.7 ? [220, 235, 255] : sh([150, 185, 250], 18))); break;
    default: each((x, y) => set(x, y, (x + y) % 2 ? [255, 0, 255] : [0, 0, 0]));
  }
}

let atlasCache: { canvas: HTMLCanvasElement; avg: RGB[] } | null = null;

export function getAtlas() {
  if (atlasCache) return atlasCache;
  const canvas = document.createElement('canvas');
  canvas.width = ATLAS_COLS * TS;
  canvas.height = ATLAS_ROWS * TS;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(canvas.width, canvas.height);
  const avg: RGB[] = [];
  for (let t = 0; t < ATLAS_COLS * ATLAS_ROWS; t++) {
    const ox = (t % ATLAS_COLS) * TS, oy = Math.floor(t / ATLAS_COLS) * TS;
    const r = mulberry32(t * 9973 + 17);
    let sr = 0, sg = 0, sb = 0, n = 0;
    const set = (x: number, y: number, c: RGB, a = 255) => {
      const i = ((oy + y) * canvas.width + ox + x) * 4;
      img.data[i] = clamp(c[0]); img.data[i + 1] = clamp(c[1]); img.data[i + 2] = clamp(c[2]); img.data[i + 3] = a;
    };
    paintTile(t, set, r);
    for (let y = 0; y < TS; y++) for (let x = 0; x < TS; x++) {
      const i = ((oy + y) * canvas.width + ox + x) * 4;
      if (img.data[i + 3] > 100) { sr += img.data[i]; sg += img.data[i + 1]; sb += img.data[i + 2]; n++; }
    }
    avg[t] = n ? [sr / n, sg / n, sb / n] : [128, 128, 128];
  }
  ctx.putImageData(img, 0, 0);
  atlasCache = { canvas, avg };
  return atlasCache;
}

export function tileUV(t: number): [number, number, number, number] {
  const col = t % ATLAS_COLS, row = Math.floor(t / ATLAS_COLS);
  const e = 0.0008;
  return [col / ATLAS_COLS + e, 1 - (row + 1) / ATLAS_ROWS + e, (col + 1) / ATLAS_COLS - e, 1 - row / ATLAS_ROWS - e];
}

const iconCache = new Map<number, string>();
export function getIcon(id: number): string {
  if (iconCache.has(id)) return iconCache.get(id)!;
  const c = document.createElement('canvas');
  c.width = 32; c.height = 32;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  if (isItem(id)) {
    const it = ITEMS[id];
    ctx.fillStyle = '#00000000';
    ctx.fillStyle = it.color;
    ctx.beginPath(); ctx.ellipse(16, 17, 11, 8, -0.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffffaa';
    ctx.beginPath(); ctx.ellipse(11, 13, 4, 2.5, -0.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#eee';
    ctx.fillRect(24, 22, 5, 3);
  } else {
    const { canvas } = getAtlas();
    const b = BLOCKS[id];
    const tile = (t: number) => [(t % ATLAS_COLS) * TS, Math.floor(t / ATLAS_COLS) * TS];
    if (b.plant) {
      const [sx, sy] = tile(b.tiles[2]);
      ctx.drawImage(canvas, sx, sy, 16, 16, 0, 0, 32, 32);
    } else {
      const faces: [number, number[], number][] = [
        [b.tiles[0], [1, 0.5, -1, 0.5, 16, 0], 0],
        [b.tiles[2], [1, 0.5, 0, 1, 0, 8], 0.25],
        [b.tiles[2], [1, -0.5, 0, 1, 16, 16], 0.45],
      ];
      for (const [t, m, dark] of faces) {
        const [sx, sy] = tile(t);
        ctx.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]);
        ctx.drawImage(canvas, sx, sy, 16, 16, 0, 0, 16, 16);
        if (dark > 0) { ctx.fillStyle = `rgba(0,0,0,${dark})`; ctx.fillRect(0, 0, 16, 16); }
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
  }
  const url = c.toDataURL();
  iconCache.set(id, url);
  return url;
}
