import { Noise, hash2, hash3 } from './noise';
import { B, BLOCKS, OCCLUDE, PLANT, LIQUID, CUTOUT, TRANSP, tileUV } from './blocks';

export const CS = 16;
export const CH = 96;
export const SEA = 30;

export const cidx = (x: number, y: number, z: number) => (y * CS + z) * CS + x;

export class Chunk {
  data = new Uint8Array(CS * CS * CH);
  hm = new Int16Array(CS * CS);
  dirty = true;
  meshes: any[] = [];
  constructor(public cx: number, public cz: number) {}
  computeColumn(x: number, z: number) {
    let y = CH - 1;
    while (y >= 0 && !OCCLUDE[this.data[cidx(x, y, z)]]) y--;
    this.hm[z * CS + x] = y;
  }
}

export type Edits = Record<string, Record<string, number>>;

export class World {
  chunks = new Map<string, Chunk>();
  n1: Noise; n2: Noise; n3: Noise; n4: Noise; cave1: Noise; cave2: Noise;
  constructor(public seed: number, public edits: Edits) {
    this.n1 = new Noise(seed);
    this.n2 = new Noise(seed + 1);
    this.n3 = new Noise(seed + 2);
    this.n4 = new Noise(seed + 3);
    this.cave1 = new Noise(seed + 4);
    this.cave2 = new Noise(seed + 5);
  }

  static key(cx: number, cz: number) { return cx + ',' + cz; }

  getChunk(cx: number, cz: number) { return this.chunks.get(World.key(cx, cz)); }

  getBlock(x: number, y: number, z: number): number {
    if (y < 0) return B.BEDROCK;
    if (y >= CH) return 0;
    const cx = Math.floor(x / CS), cz = Math.floor(z / CS);
    const c = this.chunks.get(World.key(cx, cz));
    if (!c) return 0;
    return c.data[cidx(x - cx * CS, y, z - cz * CS)];
  }

  topAt(x: number, z: number) {
    const cx = Math.floor(x / CS), cz = Math.floor(z / CS);
    const c = this.chunks.get(World.key(cx, cz));
    if (!c) return -1;
    return c.hm[(z - cz * CS) * CS + (x - cx * CS)];
  }

  /** Sets a block; returns chunks that need remeshing */
  setBlock(x: number, y: number, z: number, id: number): Chunk[] {
    if (y < 0 || y >= CH) return [];
    const cx = Math.floor(x / CS), cz = Math.floor(z / CS);
    const k = World.key(cx, cz);
    const c = this.chunks.get(k);
    if (!c) return [];
    const lx = x - cx * CS, lz = z - cz * CS;
    const i = cidx(lx, y, lz);
    c.data[i] = id;
    (this.edits[k] ||= {})[i] = id;
    c.computeColumn(lx, lz);
    const out = [c];
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
      if (!dx && !dz) continue;
      if ((dx === -1 && lx !== 0) || (dx === 1 && lx !== CS - 1)) continue;
      if ((dz === -1 && lz !== 0) || (dz === 1 && lz !== CS - 1)) continue;
      const n = this.getChunk(cx + dx, cz + dz);
      if (n) out.push(n);
    }
    return out;
  }

  heightAt(x: number, z: number) {
    const cont = this.n1.fbm2(x * 0.0035, z * 0.0035, 4);
    const hills = this.n2.fbm2(x * 0.012, z * 0.012, 4);
    const m = Math.max(0, this.n3.noise2D(x * 0.0045, z * 0.0045) - 0.1);
    const h = SEA + 3 + cont * 16 + hills * 6 + m * m * 70;
    return Math.max(4, Math.min(CH - 12, Math.floor(h)));
  }

  tempAt(x: number, z: number) {
    return this.n4.fbm2(x * 0.0022 + 100, z * 0.0022, 2);
  }

  biomeName(x: number, z: number) {
    const t = this.tempAt(x, z), h = this.heightAt(x, z);
    if (h <= SEA) return 'Ocean';
    if (h > 62) return 'Mountains';
    if (t > 0.3) return 'Desert';
    if (t < -0.3) return 'Snowy Plains';
    const f = (this.n2.noise2D(x * 0.01 + 50, z * 0.01) + 1) / 2;
    return f > 0.6 ? 'Forest' : 'Plains';
  }

  generate(c: Chunk) {
    const d = c.data, seed = this.seed;
    const ox = c.cx * CS, oz = c.cz * CS;
    for (let z = 0; z < CS; z++) for (let x = 0; x < CS; x++) {
      const wx = ox + x, wz = oz + z;
      const h = this.heightAt(wx, wz);
      const temp = this.tempAt(wx, wz);
      const desert = temp > 0.3, cold = temp < -0.3;
      const beachy = h <= SEA + 1;
      for (let y = 0; y < CH; y++) {
        let id = 0;
        if (y === 0) id = B.BEDROCK;
        else if (y < 4 && hash3(wx, y, wz, seed) < (4 - y) * 0.22) id = B.BEDROCK;
        else if (y <= h) {
          if (y < h - 3) id = B.STONE;
          else if (y < h) id = desert || beachy ? B.SAND : h > 62 ? B.STONE : B.DIRT;
          else {
            if (h < SEA - 1) id = hash2(wx, wz, seed + 3) < 0.35 ? B.GRAVEL : B.SAND;
            else if (beachy || desert) id = B.SAND;
            else if (h > 72) id = B.SNOW;
            else if (h > 62) id = B.STONE;
            else if (cold) id = B.SNOWGRASS;
            else id = B.GRASS;
          }
          if (desert && y < h - 3 && y >= h - 7) id = B.SANDSTONE;
          // caves
          if (y > 1 && id !== B.BEDROCK && (y < h - 4 || (h > SEA + 3 && y > SEA))) {
            const a = this.cave1.noise3D(wx * 0.045, y * 0.075, wz * 0.045);
            const b = this.cave2.noise3D(wx * 0.045, y * 0.075, wz * 0.045);
            if (a * a + b * b < 0.011) id = 0;
          }
          if (id === B.STONE) {
            const r = hash3(wx, y, wz, seed + 99);
            if (r < 0.012) id = B.COAL;
            else if (r < 0.019 && y < 52) id = B.IRON;
            else if (r < 0.0215 && y < 30) id = B.GOLD;
            else if (r < 0.0235 && y < 16) id = B.DIAMOND;
          }
        } else if (y <= SEA) id = cold && y === SEA ? B.ICE : B.WATER;
        d[cidx(x, y, z)] = id;
      }
      // plants
      if (h + 1 < CH) {
        const top = d[cidx(x, h, z)];
        const r = hash2(wx, wz, seed + 7);
        if (top === B.GRASS) {
          if (r < 0.1) d[cidx(x, h + 1, z)] = B.TALLGRASS;
          else if (r < 0.108) d[cidx(x, h + 1, z)] = B.ROSE;
          else if (r < 0.116) d[cidx(x, h + 1, z)] = B.DANDELION;
        } else if (top === B.SAND && desert && !beachy && r < 0.006) {
          const ch = 1 + Math.floor(hash2(wx, wz, seed + 8) * 3);
          for (let i = 1; i <= ch; i++) d[cidx(x, h + i, z)] = B.CACTUS;
        }
      }
    }
    // trees (may overlap chunk borders)
    for (let wz = oz - 3; wz < oz + CS + 3; wz++) for (let wx = ox - 3; wx < ox + CS + 3; wx++) {
      const r = hash2(wx, wz, seed + 13);
      if (r > 0.07) continue;
      const f = (this.n2.noise2D(wx * 0.01 + 50, wz * 0.01) + 1) / 2;
      const dens = 0.003 + f * f * f * 0.07;
      if (r > dens) continue;
      const h = this.heightAt(wx, wz);
      if (h <= SEA + 1 || h > 62) continue;
      if (this.tempAt(wx, wz) > 0.3) continue;
      this.placeTree(c, wx, h, wz, hash2(wx, wz, seed + 14));
    }
    // player edits
    const e = this.edits[World.key(c.cx, c.cz)];
    if (e) for (const k in e) d[+k] = e[k];
    for (let z = 0; z < CS; z++) for (let x = 0; x < CS; x++) c.computeColumn(x, z);
    c.dirty = true;
  }

  placeTree(c: Chunk, wx: number, h: number, wz: number, r2: number) {
    const ox = c.cx * CS, oz = c.cz * CS;
    const set = (x: number, y: number, z: number, id: number, force: boolean) => {
      const lx = x - ox, lz = z - oz;
      if (lx < 0 || lx >= CS || lz < 0 || lz >= CS || y < 0 || y >= CH) return;
      const i = cidx(lx, y, lz);
      const cur = c.data[i];
      if (force || cur === 0 || PLANT[cur]) c.data[i] = id;
    };
    const th = 4 + Math.floor(r2 * 3);
    const base = h + 1;
    set(wx, h, wz, B.DIRT, true);
    for (let ly = base + th - 3; ly <= base + th; ly++) {
      const rad = ly >= base + th - 1 ? 1 : 2;
      for (let dx = -rad; dx <= rad; dx++) for (let dz = -rad; dz <= rad; dz++) {
        const corner = Math.abs(dx) === rad && Math.abs(dz) === rad;
        if (corner && (ly === base + th || hash3(wx + dx, ly, wz + dz, this.seed) < 0.5)) continue;
        set(wx + dx, ly, wz + dz, B.LEAVES, false);
      }
    }
    for (let i = 0; i < th; i++) set(wx, base + i, wz, B.LOG, true);
  }
}

// ---------------- Meshing -----------------
export interface MeshData { pos: Float32Array; uv: Float32Array; col: Float32Array; idx: Uint32Array; }

class Buf {
  pos: number[] = []; uv: number[] = []; col: number[] = []; idx: number[] = []; n = 0;
  out(): MeshData | null {
    if (!this.n) return null;
    return { pos: new Float32Array(this.pos), uv: new Float32Array(this.uv), col: new Float32Array(this.col), idx: new Uint32Array(this.idx) };
  }
}

const FACES = [
  { n: [1, 0, 0], c: [[1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1]], s: 0.8, t: 2 },
  { n: [-1, 0, 0], c: [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]], s: 0.8, t: 2 },
  { n: [0, 1, 0], c: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]], s: 1, t: 0 },
  { n: [0, -1, 0], c: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]], s: 0.55, t: 1 },
  { n: [0, 0, 1], c: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]], s: 0.9, t: 2 },
  { n: [0, 0, -1], c: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]], s: 0.9, t: 2 },
];
const UVS = [[0, 0], [1, 0], [1, 1], [0, 1]];
const AO_CURVE = [0.5, 0.68, 0.84, 1];

export function buildChunkMesh(world: World, chunk: Chunk) {
  const { data } = chunk;
  const ox = chunk.cx * CS, oz = chunk.cz * CS;
  const get = (x: number, y: number, z: number) => {
    if (y < 0) return B.BEDROCK;
    if (y >= CH) return 0;
    if (x >= 0 && x < CS && z >= 0 && z < CS) return data[(y * CS + z) * CS + x];
    return world.getBlock(ox + x, y, oz + z);
  };
  const top = (x: number, z: number) => {
    if (x >= 0 && x < CS && z >= 0 && z < CS) return chunk.hm[z * CS + x];
    return world.topAt(ox + x, oz + z);
  };
  const opaque = new Buf(), cutout = new Buf(), water = new Buf();
  const ao = [0, 0, 0, 0];
  const p = [0, 0, 0];

  for (let y = 0; y < CH; y++) for (let z = 0; z < CS; z++) for (let x = 0; x < CS; x++) {
    const id = data[(y * CS + z) * CS + x];
    if (!id) continue;
    const def = BLOCKS[id];
    if (PLANT[id]) {
      const [u0, v0, u1, v1] = tileUV(def.tiles[2]);
      const sky = y > top(x, z) ? 1 : 0.55;
      const cv = sky * sky;
      const quads = [[0.15, 0.15, 0.85, 0.85], [0.85, 0.15, 0.15, 0.85]];
      for (const q of quads) {
        const b = cutout.n;
        cutout.pos.push(x + q[0], y, z + q[1], x + q[2], y, z + q[3], x + q[2], y + 0.9, z + q[3], x + q[0], y + 0.9, z + q[1]);
        cutout.uv.push(u0, v0, u1, v0, u1, v1, u0, v1);
        for (let k = 0; k < 4; k++) cutout.col.push(cv, cv, cv);
        cutout.idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
        cutout.n += 4;
      }
      continue;
    }
    const isWater = LIQUID[id] === 1;
    const buf = isWater ? water : CUTOUT[id] ? cutout : opaque;
    const waterTop = isWater && get(x, y + 1, z) !== B.WATER ? 0.88 : 1;
    for (let f = 0; f < 6; f++) {
      const F = FACES[f];
      const nx = x + F.n[0], ny = y + F.n[1], nz = z + F.n[2];
      const nb = get(nx, ny, nz);
      if (nb) {
        if (PLANT[nb]) { /* visible */ }
        else if (TRANSP[nb]) {
          if (nb === id && id !== B.LEAVES) continue;
          if (isWater && !LIQUID[nb] && nb !== 0 && !CUTOUT[nb]) continue;
        } else continue;
      }
      const sky = ny > top(nx, nz) ? 1 : 0.5;
      const [u0, v0, u1, v1] = tileUV(def.tiles[F.t]);
      // AO
      const axis = F.n[0] ? 0 : F.n[1] ? 1 : 2;
      const ua = axis === 0 ? 1 : 0, va = axis === 2 ? 1 : 2;
      for (let k = 0; k < 4; k++) {
        if (isWater) { ao[k] = 3; continue; }
        const c = F.c[k];
        const su = c[ua] ? 1 : -1, sv = c[va] ? 1 : -1;
        p[0] = nx; p[1] = ny; p[2] = nz;
        p[ua] += su;
        const s1 = OCCLUDE[get(p[0], p[1], p[2])];
        p[va] += sv;
        const cc = OCCLUDE[get(p[0], p[1], p[2])];
        p[ua] -= su;
        const s2 = OCCLUDE[get(p[0], p[1], p[2])];
        ao[k] = s1 && s2 ? 0 : 3 - (s1 + s2 + cc);
      }
      const b = buf.n;
      for (let k = 0; k < 4; k++) {
        const c = F.c[k];
        buf.pos.push(x + c[0], y + (c[1] ? waterTop : 0), z + c[2]);
        buf.uv.push(u0 + UVS[k][0] * (u1 - u0), v0 + UVS[k][1] * (v1 - v0));
        const l = F.s * AO_CURVE[ao[k]] * sky;
        const lv = l * l;
        buf.col.push(lv, lv, lv);
      }
      if (ao[0] + ao[2] >= ao[1] + ao[3]) buf.idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
      else buf.idx.push(b + 1, b + 2, b + 3, b + 1, b + 3, b);
      buf.n += 4;
    }
  }
  return { opaque: opaque.out(), cutout: cutout.out(), water: water.out() };
}
