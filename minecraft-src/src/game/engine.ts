import { mcAudio } from "./audio";
import * as THREE from 'three';
import { World, Chunk, CS, CH, SEA, buildChunkMesh } from './world';
import type { MeshData } from './world';
import { B, BLOCKS, SOLID, PLANT, LIQUID, getAtlas, tileUV, isItem, ITEMS, ITEM, RECIPES, getName } from './blocks';
import type { Recipe } from './blocks';
import type { SaveData, Slot, GameMode, Settings } from './storage';
import { saveWorld } from './storage';

export interface UIState {
  inv: Slot[];
  held: Slot;
  selected: number;
  health: number;
  mode: GameMode;
  paused: boolean;
  invOpen: boolean;
  atTable: boolean;
  dead: boolean;
  deathMsg: string;
  loading: number;
  debug: string | null;
  underwater: boolean;
  hurtAt: number;
  flying: boolean;
  timeOfDay: number;
}

type Hit = { x: number; y: number; z: number; nx: number; ny: number; nz: number; id: number; dist: number };
type MobType = 'pig' | 'sheep' | 'zombie';

const HW = 0.3, PH = 1.8;
const EMPTY = new Set<string>();

function overlaps(world: World, p: THREE.Vector3, hw: number, h: number) {
  const x0 = Math.floor(p.x - hw), x1 = Math.floor(p.x + hw);
  const y0 = Math.floor(p.y), y1 = Math.floor(p.y + h);
  const z0 = Math.floor(p.z - hw), z1 = Math.floor(p.z + hw);
  for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
    if (SOLID[world.getBlock(x, y, z)]) return true;
  }
  return false;
}

function collideMove(world: World, pos: THREE.Vector3, vel: THREE.Vector3, hw: number, h: number, dt: number) {
  const res = { onGround: false, hitX: false, hitZ: false };
  let dx = vel.x * dt, dy = vel.y * dt, dz = vel.z * dt;
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dz)) / 0.3));
  dx /= steps; dy /= steps; dz /= steps;
  for (let s = 0; s < steps; s++) {
    if (dy) {
      pos.y += dy;
      if (overlaps(world, pos, hw, h)) {
        if (dy < 0) { pos.y = Math.floor(pos.y) + 1; res.onGround = true; }
        else pos.y = Math.floor(pos.y + h) - h - 0.001;
        vel.y = 0; dy = 0;
      }
    }
    if (dx) {
      pos.x += dx;
      if (overlaps(world, pos, hw, h)) {
        pos.x = dx > 0 ? Math.floor(pos.x + hw) - hw - 0.001 : Math.floor(pos.x - hw) + 1 + hw + 0.001;
        vel.x = 0; dx = 0; res.hitX = true;
      }
    }
    if (dz) {
      pos.z += dz;
      if (overlaps(world, pos, hw, h)) {
        pos.z = dz > 0 ? Math.floor(pos.z + hw) - hw - 0.001 : Math.floor(pos.z - hw) + 1 + hw + 0.001;
        vel.z = 0; dz = 0; res.hitZ = true;
      }
    }
  }
  return res;
}

function rayAABB(o: THREE.Vector3, d: THREE.Vector3, min: number[], max: number[]) {
  let tmin = -Infinity, tmax = Infinity;
  const oa = [o.x, o.y, o.z], da = [d.x, d.y, d.z];
  for (let i = 0; i < 3; i++) {
    if (Math.abs(da[i]) < 1e-9) { if (oa[i] < min[i] || oa[i] > max[i]) return -1; continue; }
    let t1 = (min[i] - oa[i]) / da[i], t2 = (max[i] - oa[i]) / da[i];
    if (t1 > t2) [t1, t2] = [t2, t1];
    tmin = Math.max(tmin, t1); tmax = Math.min(tmax, t2);
    if (tmin > tmax) return -1;
  }
  return tmin >= 0 ? tmin : tmax >= 0 ? 0 : -1;
}

function makeBlockGeo(id: number): THREE.BufferGeometry {
  const def = BLOCKS[id];
  if (def.plant) {
    const g = new THREE.PlaneGeometry(1, 1);
    const [u0, v0, u1, v1] = tileUV(def.tiles[2]);
    const uv = g.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, u0 + uv.getX(i) * (u1 - u0), v0 + uv.getY(i) * (v1 - v0));
    g.setAttribute('color', new THREE.Float32BufferAttribute(new Array(uv.count * 3).fill(1), 3));
    return g;
  }
  const g = new THREE.BoxGeometry(1, 1, 1);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  const shade = [0.8, 0.8, 1, 0.55, 0.9, 0.9];
  const cols: number[] = [];
  for (let f = 0; f < 6; f++) {
    const t = f === 2 ? def.tiles[0] : f === 3 ? def.tiles[1] : def.tiles[2];
    const [u0, v0, u1, v1] = tileUV(t);
    for (let k = 0; k < 4; k++) {
      const i = f * 4 + k;
      uv.setXY(i, u0 + uv.getX(i) * (u1 - u0), v0 + uv.getY(i) * (v1 - v0));
      const s = shade[f] * shade[f];
      cols.push(s, s, s);
    }
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  return g;
}

class Mob {
  group = new THREE.Group();
  legs: THREE.Object3D[] = [];
  mats: THREE.MeshLambertMaterial[] = [];
  pos = new THREE.Vector3();
  vel = new THREE.Vector3();
  yaw = Math.random() * Math.PI * 2;
  health: number;
  hw: number;
  h: number;
  walk = 0;
  hurt = 0;
  timer = 0;
  moving = false;
  onGround = false;
  attackCd = 0;
  constructor(public type: MobType) {
    const box = (w: number, h: number, d: number, color: number, x: number, y: number, z: number, parent: THREE.Object3D) => {
      const mat = new THREE.MeshLambertMaterial({ color });
      this.mats.push(mat);
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      m.position.set(x, y, z);
      parent.add(m);
      return m;
    };
    const leg = (w: number, h: number, color: number, x: number, y: number, z: number) => {
      const piv = new THREE.Group();
      piv.position.set(x, y, z);
      box(w, h, w, color, 0, -h / 2, 0, piv);
      this.group.add(piv);
      this.legs.push(piv);
    };
    if (type === 'zombie') {
      this.health = 12; this.hw = 0.3; this.h = 1.9;
      leg(0.25, 0.75, 0x2a3f8f, -0.13, 0.75, 0);
      leg(0.25, 0.75, 0x2a3f8f, 0.13, 0.75, 0);
      box(0.5, 0.75, 0.26, 0x2fa8a8, 0, 1.125, 0, this.group);
      box(0.5, 0.5, 0.5, 0x5a9a48, 0, 1.75, 0, this.group);
      box(0.1, 0.06, 0.02, 0x111111, -0.12, 1.78, -0.255, this.group);
      box(0.1, 0.06, 0.02, 0x111111, 0.12, 1.78, -0.255, this.group);
      for (const sx of [-0.375, 0.375]) {
        const arm = new THREE.Group();
        arm.position.set(sx, 1.42, 0);
        box(0.24, 0.72, 0.24, 0x5a9a48, 0, -0.3, 0, arm);
        arm.rotation.x = Math.PI / 2;
        this.group.add(arm);
      }
    } else if (type === 'pig') {
      this.health = 10; this.hw = 0.45; this.h = 0.9;
      for (const [x, z] of [[-0.18, -0.3], [0.18, -0.3], [-0.18, 0.3], [0.18, 0.3]]) leg(0.2, 0.35, 0xe89090, x, 0.35, z);
      box(0.62, 0.5, 0.95, 0xf0a0a0, 0, 0.58, 0, this.group);
      box(0.5, 0.5, 0.5, 0xf0a0a0, 0, 0.75, -0.62, this.group);
      box(0.26, 0.16, 0.06, 0xd87878, 0, 0.68, -0.89, this.group);
      box(0.08, 0.08, 0.02, 0x111111, -0.13, 0.82, -0.875, this.group);
      box(0.08, 0.08, 0.02, 0x111111, 0.13, 0.82, -0.875, this.group);
    } else {
      this.health = 8; this.hw = 0.45; this.h = 1.2;
      for (const [x, z] of [[-0.2, -0.32], [0.2, -0.32], [-0.2, 0.32], [0.2, 0.32]]) leg(0.2, 0.45, 0xd9c7b0, x, 0.45, z);
      box(0.72, 0.62, 1.05, 0xf2f2f2, 0, 0.78, 0, this.group);
      box(0.42, 0.42, 0.5, 0xd9c7b0, 0, 1.0, -0.66, this.group);
      box(0.46, 0.2, 0.3, 0xf2f2f2, 0, 1.2, -0.58, this.group);
      box(0.07, 0.07, 0.02, 0x111111, -0.12, 1.04, -0.915, this.group);
      box(0.07, 0.07, 0.02, 0x111111, 0.12, 1.04, -0.915, this.group);
    }
  }
  dispose() {
    this.group.traverse((o) => { if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).geometry.dispose(); });
    this.mats.forEach((m) => m.dispose());
  }
}

export class Game {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera: THREE.PerspectiveCamera;
  world: World;
  tex: THREE.CanvasTexture;
  matOpaque: THREE.MeshBasicMaterial;
  matCutout: THREE.MeshBasicMaterial;
  matWater: THREE.MeshBasicMaterial;
  matHand: THREE.MeshBasicMaterial;

  pos = new THREE.Vector3();
  vel = new THREE.Vector3();
  spawn = new THREE.Vector3();
  yaw = 0;
  pitch = 0;
  onGround = false;
  flying = false;
  sprinting = false;
  inWater = false;
  headInWater = false;
  health = 20;
  fallStart = 0;
  mode: GameMode;
  inv: Slot[] = new Array(36).fill(null);
  held: Slot = null;
  selected = 0;

  paused = false;
  invOpen = false;
  atTable = false;
  dead = false;
  deathMsg = '';
  loading = true;
  loadProgress = 0;
  debugOn = false;
  hurtAt = 0;

  keys = new Set<string>();
  leftDown = false;
  rightDown = false;
  locked = false;
  lastSpace = 0;
  lastW = 0;
  breakKey: string | null = null;
  breakProgress = 0;
  actionCd = 0;
  placeCd = 0;
  target: Hit | null = null;
  swing = 0;
  bob = 0;

  time = 0.05;
  daylight = 1;
  mobs: Mob[] = [];
  spawnTimer = 0;
  particles: { m: THREE.Mesh; v: THREE.Vector3; life: number }[] = [];
  particleGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
  particleMats = new Map<number, THREE.MeshBasicMaterial>();
  tnts: { x: number; y: number; z: number; t: number; mesh: THREE.Mesh; flash: THREE.Mesh }[] = [];

  highlight: THREE.LineSegments;
  breakBox: THREE.Mesh;
  hand: THREE.Mesh;
  handId = -2;
  sun: THREE.Mesh;
  moon: THREE.Mesh;
  stars: THREE.Points;
  clouds: THREE.Mesh;
  cloudTex: THREE.CanvasTexture;
  ambient: THREE.AmbientLight;
  dirLight: THREE.DirectionalLight;

  rd: number;
  genOffsets: [number, number][] = [];
  meshOffsets: [number, number][] = [];
  raf = 0;
  lastT = 0;
  fps = 60;
  frames = 0;
  fpsT = 0;
  emitT = 0;
  saveT = 0;
  unloadT = 0;
  sens: number;
  base: SaveData;

  constructor(public canvas: HTMLCanvasElement, save: SaveData, settings: Settings, public onUI: (s: UIState) => void) {
    this.base = save;
    this.mode = save.mode;
    this.rd = settings.renderDist;
    this.sens = settings.sensitivity;
    this.world = new World(save.seed, save.edits || {});

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.camera = new THREE.PerspectiveCamera(settings.fov, window.innerWidth / window.innerHeight, 0.05, 700);
    this.camera.rotation.order = 'YXZ';
    this.scene.add(this.camera);
    this.scene.fog = new THREE.Fog(0x87ceeb, this.rd * CS * 0.55, this.rd * CS * 0.95);

    this.tex = new THREE.CanvasTexture(getAtlas().canvas);
    this.tex.magFilter = THREE.NearestFilter;
    this.tex.minFilter = THREE.NearestFilter;
    this.tex.generateMipmaps = false;
    this.tex.colorSpace = THREE.SRGBColorSpace;
    this.matOpaque = new THREE.MeshBasicMaterial({ map: this.tex, vertexColors: true });
    this.matCutout = new THREE.MeshBasicMaterial({ map: this.tex, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide });
    this.matWater = new THREE.MeshBasicMaterial({ map: this.tex, vertexColors: true, transparent: true, opacity: 0.72, depthWrite: false, side: THREE.DoubleSide });
    this.matHand = new THREE.MeshBasicMaterial({ map: this.tex, vertexColors: true, alphaTest: 0.5, depthTest: false, fog: false, side: THREE.DoubleSide });

    this.ambient = new THREE.AmbientLight(0xffffff, 1);
    this.dirLight = new THREE.DirectionalLight(0xffffff, 1);
    this.scene.add(this.ambient, this.dirLight, this.dirLight.target);

    this.highlight = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(1.004, 1.004, 1.004)),
      new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.6 })
    );
    this.highlight.visible = false;
    this.scene.add(this.highlight);
    this.breakBox = new THREE.Mesh(new THREE.BoxGeometry(1.01, 1.01, 1.01), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0, depthWrite: false }));
    this.breakBox.visible = false;
    this.scene.add(this.breakBox);

    this.hand = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.6), this.matHand);
    this.hand.renderOrder = 1000;
    this.camera.add(this.hand);

    // Sky objects
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xfff4a0, fog: false });
    this.sun = new THREE.Mesh(new THREE.PlaneGeometry(45, 45), sunMat);
    this.moon = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.MeshBasicMaterial({ color: 0xe8ecff, fog: false }));
    this.scene.add(this.sun, this.moon);
    const sp: number[] = [];
    for (let i = 0; i < 700; i++) {
      const v = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize().multiplyScalar(450);
      sp.push(v.x, v.y, v.z);
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
    this.stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 2, sizeAttenuation: false, fog: false, transparent: true }));
    this.scene.add(this.stars);
    const cc = document.createElement('canvas');
    cc.width = cc.height = 128;
    const cctx = cc.getContext('2d')!;
    let s = save.seed;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 260; i++) {
      const x = Math.floor(rnd() * 128), y = Math.floor(rnd() * 128);
      const w = 2 + Math.floor(rnd() * 8), h = 2 + Math.floor(rnd() * 6);
      cctx.fillStyle = '#fff';
      if (rnd() < 0.5) cctx.fillRect(x, y, w, h);
    }
    this.cloudTex = new THREE.CanvasTexture(cc);
    this.cloudTex.magFilter = THREE.NearestFilter;
    this.cloudTex.wrapS = this.cloudTex.wrapT = THREE.RepeatWrapping;
    this.clouds = new THREE.Mesh(
      new THREE.PlaneGeometry(1536, 1536),
      new THREE.MeshBasicMaterial({ map: this.cloudTex, transparent: true, opacity: 0.8, fog: false, depthWrite: false, side: THREE.DoubleSide })
    );
    this.clouds.rotation.x = -Math.PI / 2;
    this.scene.add(this.clouds);

    this.computeOffsets();

    // Player state
    if (save.player) {
      this.pos.set(save.player.x, save.player.y, save.player.z);
      this.yaw = save.player.yaw;
      this.pitch = save.player.pitch;
      this.health = save.player.health;
      this.flying = save.player.flying && this.mode === 'creative';
    }
    this.findSpawn();
    if (!save.player) this.pos.copy(this.spawn);
    if (save.inv) this.inv = save.inv.slice(0, 36).concat(new Array(Math.max(0, 36 - save.inv.length)).fill(null));
    else if (this.mode === 'creative') {
      [B.GRASS, B.DIRT, B.STONE, B.COBBLE, B.PLANKS, B.LOG, B.GLASS, B.BRICK, B.TNT].forEach((id, i) => (this.inv[i] = { id, count: 64 }));
    }
    if (save.time !== undefined) this.time = save.time;

    this.bind();
    this.lastT = performance.now();
    this.raf = requestAnimationFrame(this.loop);
    this.emit();
  }

  // ---------------------------------------------------------------- setup
  computeOffsets() {
    const g: [number, number, number][] = [], m: [number, number, number][] = [];
    const R = this.rd + 1;
    for (let dx = -R; dx <= R; dx++) for (let dz = -R; dz <= R; dz++) {
      const d = dx * dx + dz * dz;
      if (d <= R * R + 1) g.push([dx, dz, d]);
      if (d <= this.rd * this.rd + 1) m.push([dx, dz, d]);
    }
    g.sort((a, b) => a[2] - b[2]);
    m.sort((a, b) => a[2] - b[2]);
    this.genOffsets = g.map((a) => [a[0], a[1]]);
    this.meshOffsets = m.map((a) => [a[0], a[1]]);
  }

  findSpawn() {
    for (let r = 0; r < 800; r += 8) {
      for (let a = 0; a < 8; a++) {
        const x = Math.round(Math.cos(a * 0.785) * r) + 0.5, z = Math.round(Math.sin(a * 0.785) * r) + 0.5;
        const h = this.world.heightAt(Math.floor(x), Math.floor(z));
        if (h > SEA + 1 && h < 60) { this.spawn.set(x, h + 1.5, z); return; }
      }
    }
    this.spawn.set(0.5, 70, 0.5);
  }

  bind() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('wheel', this.onWheel, { passive: false });
    window.addEventListener('resize', this.onResize);
    window.addEventListener('contextmenu', this.onContext);
    document.addEventListener('pointerlockchange', this.onLockChange);
    this.canvas.addEventListener('click', this.onCanvasClick);
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    this.save();
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('wheel', this.onWheel);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('contextmenu', this.onContext);
    document.removeEventListener('pointerlockchange', this.onLockChange);
    this.canvas.removeEventListener('click', this.onCanvasClick);
    if (document.pointerLockElement) document.exitPointerLock();
    this.world.chunks.forEach((c) => c.meshes.forEach((m: THREE.Mesh) => m.geometry.dispose()));
    this.mobs.forEach((m) => m.dispose());
    this.renderer.dispose();
  }

  save() {
    const data: SaveData = {
      ...this.base,
      mode: this.mode,
      edits: this.world.edits,
      lastPlayed: Date.now(),
      player: { x: this.pos.x, y: this.pos.y, z: this.pos.z, yaw: this.yaw, pitch: this.pitch, health: this.dead ? 20 : this.health, flying: this.flying },
      inv: this.inv,
      time: this.time,
    };
    if (this.dead) data.player = undefined;
    saveWorld(data);
  }

  // ---------------------------------------------------------------- input
  lock() {
    try {
      const p = this.canvas.requestPointerLock() as unknown as Promise<void> | undefined;
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } catch { /* ignore */ }
  }

  onCanvasClick = () => {
    if (!this.locked && !this.paused && !this.invOpen && !this.dead && !this.loading) this.lock();
  };
  onContext = (e: Event) => e.preventDefault();
  onResize = () => {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  };
  onLockChange = () => {
    this.locked = document.pointerLockElement === this.canvas;
    if (!this.locked) {
      this.keys.clear();
      this.leftDown = this.rightDown = false;
      if (!this.invOpen && !this.dead && !this.loading) {
        this.paused = true;
        this.save();
      }
    }
    this.emit();
  };
  onKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'F3') { e.preventDefault(); this.debugOn = !this.debugOn; this.emit(); return; }
    if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
    if (this.paused || this.dead || this.loading) return;
    if (e.code === 'KeyE') {
      if (this.invOpen) this.closeInventory(); else this.openInventory(false);
      return;
    }
    if (this.invOpen) { if (e.code === 'Escape') this.closeInventory(); return; }
    if (!this.locked) return;
    if (e.code === 'Space' || e.code === 'Tab') e.preventDefault();
    if (!e.repeat) {
      const now = performance.now();
      if (e.code === 'Space') {
        if (this.mode === 'creative' && now - this.lastSpace < 300) { this.flying = !this.flying; this.vel.y = 0; this.emit(); }
        this.lastSpace = now;
      }
      if (e.code === 'KeyW') {
        if (now - this.lastW < 280) this.sprinting = true;
        this.lastW = now;
      }
      if (e.code === 'KeyQ' && this.mode === 'survival') { this.consumeSelected(); this.emit(); }
    }
    if (e.code === 'ControlLeft') this.sprinting = true;
    if (e.code.startsWith('Digit')) {
      const n = parseInt(e.code.slice(5));
      if (n >= 1 && n <= 9) { this.selected = n - 1; this.emit(); }
    }
    this.keys.add(e.code);
  };
  onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.code);
    if (e.code === 'KeyW') this.sprinting = false;
  };
  onMouseMove = (e: MouseEvent) => {
    if (!this.locked) return;
    const s = 0.0022 * this.sens;
    this.yaw -= e.movementX * s;
    this.pitch -= e.movementY * s;
    this.pitch = Math.max(-Math.PI / 2 + 0.001, Math.min(Math.PI / 2 - 0.001, this.pitch));
  };
  onWheel = (e: WheelEvent) => {
    if (!this.locked) return;
    e.preventDefault();
    this.selected = (this.selected + (e.deltaY > 0 ? 1 : -1) + 9) % 9;
    this.emit();
  };
  onMouseDown = (e: MouseEvent) => {
    if (!this.locked || this.paused || this.invOpen || this.dead) return;
    if (e.button === 0) {
      this.leftDown = true;
      this.swing = 1;
      if (this.tryAttack()) { this.actionCd = 0.35; return; }
      this.actionCd = 0;
    } else if (e.button === 2) {
      this.rightDown = true;
      this.use();
      this.placeCd = 0.28;
    } else if (e.button === 1) {
      e.preventDefault();
      if (this.target && this.mode === 'creative') {
        const id = this.target.id;
        const found = this.inv.findIndex((s, i) => i < 9 && s?.id === id);
        if (found >= 0) this.selected = found;
        else this.inv[this.selected] = { id, count: 64 };
        this.emit();
      }
    }
  };
  onMouseUp = (e: MouseEvent) => {
    if (e.button === 0) { this.leftDown = false; this.breakKey = null; this.breakProgress = 0; }
    if (e.button === 2) this.rightDown = false;
  };

  // ---------------------------------------------------------------- public API for UI
  resume() { this.paused = false; this.emit(); this.lock(); }
  setMode(m: GameMode) { this.mode = m; if (m === 'survival') this.flying = false; this.emit(); }
  setTime(t: number) { this.time = t; }
  setSelected(i: number) { this.selected = i; this.emit(); }
  respawn() {
    this.dead = false;
    this.health = 20;
    this.pos.copy(this.spawn);
    this.vel.set(0, 0, 0);
    this.fallStart = this.pos.y;
    this.emit();
    this.lock();
  }
  openInventory(table: boolean) {
    this.invOpen = true;
    this.atTable = table;
    this.keys.clear();
    this.leftDown = this.rightDown = false;
    if (document.pointerLockElement) document.exitPointerLock();
    this.emit();
  }
  closeInventory() {
    if (this.held) { this.addItem(this.held.id, this.held.count); this.held = null; }
    this.invOpen = false;
    this.emit();
    this.lock();
  }
  clickSlot(i: number, right: boolean) {
    const s = this.inv[i];
    const h = this.held;
    if (right) {
      if (!h && s) {
        const take = Math.ceil(s.count / 2);
        this.held = { id: s.id, count: take };
        this.inv[i] = s.count - take > 0 ? { id: s.id, count: s.count - take } : null;
      } else if (h && (!s || (s.id === h.id && s.count < 64))) {
        this.inv[i] = { id: h.id, count: (s?.count ?? 0) + 1 };
        this.held = h.count > 1 ? { id: h.id, count: h.count - 1 } : null;
      }
    } else {
      if (h && s && s.id === h.id) {
        const total = s.count + h.count;
        this.inv[i] = { id: s.id, count: Math.min(64, total) };
        this.held = total > 64 ? { id: s.id, count: total - 64 } : null;
      } else {
        this.inv[i] = h ? { ...h } : null;
        this.held = s ? { ...s } : null;
      }
    }
    this.emit();
  }
  clickPalette(id: number) {
    if (this.held && this.held.id !== id) { this.held = null; }
    else this.held = { id, count: isItem(id) ? 16 : 64 };
    this.emit();
  }
  trashHeld() { this.held = null; this.emit(); }
  countOf(id: number) { return this.inv.reduce((a, s) => a + (s && s.id === id ? s.count : 0), 0); }
  canCraft(r: Recipe) { return (!r.table || this.atTable) && r.needs.every(([id, n]) => this.countOf(id) >= n); }
  craft(r: Recipe) {
    if (!this.canCraft(r)) return;
    for (const [id, n] of r.needs) this.removeItems(id, n);
    const left = this.addItem(r.out, r.count);
    if (left > 0) this.held = { id: r.out, count: left };
    this.emit();
  }
  removeItems(id: number, n: number) {
    for (let i = 35; i >= 0 && n > 0; i--) {
      const s = this.inv[i];
      if (s && s.id === id) {
        const t = Math.min(n, s.count);
        s.count -= t; n -= t;
        if (s.count <= 0) this.inv[i] = null;
      }
    }
  }
  addItem(id: number, count: number) {
    for (let i = 0; i < 36 && count > 0; i++) {
      const s = this.inv[i];
      if (s && s.id === id && s.count < 64) { const t = Math.min(64 - s.count, count); s.count += t; count -= t; }
    }
    for (let i = 0; i < 36 && count > 0; i++) {
      if (!this.inv[i]) { const t = Math.min(64, count); this.inv[i] = { id, count: t }; count -= t; }
    }
    return count;
  }
  consumeSelected() {
    const s = this.inv[this.selected];
    if (!s) return;
    s.count--;
    if (s.count <= 0) this.inv[this.selected] = null;
  }

  emit() {
    this.onUI({
      inv: this.inv.map((s) => (s ? { ...s } : null)),
      held: this.held ? { ...this.held } : null,
      selected: this.selected,
      health: this.health,
      mode: this.mode,
      paused: this.paused,
      invOpen: this.invOpen,
      atTable: this.atTable,
      dead: this.dead,
      deathMsg: this.deathMsg,
      loading: this.loading ? this.loadProgress : 1,
      debug: this.debugOn ? this.debugText() : null,
      underwater: this.headInWater,
      hurtAt: this.hurtAt,
      flying: this.flying,
      timeOfDay: this.time,
    });
  }

  debugText() {
    const p = this.pos;
    const dirs = ['North (-Z)', 'West (-X)', 'South (+Z)', 'East (+X)'];
    const a = ((this.yaw % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const facing = dirs[Math.round(a / (Math.PI / 2)) % 4];
    const hrs = Math.floor(((this.time % 1) * 24 + 6) % 24);
    return [
      `WebCraft 1.0 (${this.fps} fps)`,
      `XYZ: ${p.x.toFixed(2)} / ${p.y.toFixed(2)} / ${p.z.toFixed(2)}`,
      `Chunk: ${Math.floor(p.x / CS)}, ${Math.floor(p.z / CS)}  (${this.world.chunks.size} loaded)`,
      `Facing: ${facing}`,
      `Biome: ${this.world.biomeName(Math.floor(p.x), Math.floor(p.z))}`,
      `Time: ${hrs}:00  Day light: ${(this.daylight * 100) | 0}%`,
      `Mobs: ${this.mobs.length}  Seed: ${this.base.seed}`,
      this.target ? `Looking at: ${getName(this.target.id)} (${this.target.x}, ${this.target.y}, ${this.target.z})` : 'Looking at: -',
    ].join('\n');
  }

  // ---------------------------------------------------------------- loop
  loop = (t: number) => {
    this.raf = requestAnimationFrame(this.loop);
    const dt = Math.min(0.05, (t - this.lastT) / 1000);
    this.lastT = t;
    this.frames++;
    this.fpsT += dt;
    if (this.fpsT >= 1) { this.fps = this.frames; this.frames = 0; this.fpsT = 0; }
    this.update(dt);
    this.renderer.render(this.scene, this.camera);
  };

  update(dt: number) {
    this.updateChunks();
    if (this.loading) {
      const pcx = Math.floor(this.pos.x / CS), pcz = Math.floor(this.pos.z / CS);
      let ready = 0, total = 0;
      const maxD = this.rd * this.rd + 1;
      for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
        if (dx * dx + dz * dz > maxD) continue;
        total++;
        const c = this.world.getChunk(pcx + dx, pcz + dz);
        if (c && !c.dirty) ready++;
      }
      const nextProgress = total > 0 ? ready / total : 1;
      const changed = nextProgress !== this.loadProgress;
      this.loadProgress = nextProgress;
      if (ready >= total) {
        this.loading = false;
        // make sure we are not stuck inside terrain
        while (overlaps(this.world, this.pos, HW, PH) && this.pos.y < CH) this.pos.y += 1;
        this.fallStart = this.pos.y;
        this.emitT = 0;
        this.emit();
      } else if (changed) {
        this.emit();
      }
      this.updateCamera(dt);
      this.updateSky();
      return;
    }
    const active = !this.paused && !this.dead;
    if (active) {
      this.updatePlayer(dt, !this.invOpen && this.locked);
      this.updateMobs(dt);
      this.updateTNT(dt);
      this.time += dt / 600;
    }
    this.updateParticles(dt);
    this.updateCamera(dt);
    this.updateSky();
    this.updateHand(dt);

    this.emitT += dt;
    if (this.emitT > 0.25) {
      this.emitT = 0;
      if (this.debugOn) this.emit();
    }
    this.saveT += dt;
    if (this.saveT > 30) { this.saveT = 0; this.save(); }
  }

  updateChunks() {
    const pcx = Math.floor(this.pos.x / CS), pcz = Math.floor(this.pos.z / CS);
    let gen = 0;
    const maxGen = this.loading ? 12 : 2;
    for (const [dx, dz] of this.genOffsets) {
      if (gen >= maxGen) break;
      const cx = pcx + dx, cz = pcz + dz;
      const k = World.key(cx, cz);
      if (!this.world.chunks.has(k)) {
        const c = new Chunk(cx, cz);
        this.world.generate(c);
        this.world.chunks.set(k, c);
        gen++;
      }
    }
    let built = 0;
    const maxBuild = this.loading ? 12 : 3;
    for (const [dx, dz] of this.meshOffsets) {
      if (built >= maxBuild) break;
      const cx = pcx + dx, cz = pcz + dz;
      const c = this.world.getChunk(cx, cz);
      if (c && c.dirty && this.neighborsReady(cx, cz)) { this.buildMesh(c); built++; }
    }
    this.unloadT++;
    if (this.unloadT > 120) {
      this.unloadT = 0;
      const lim = this.rd + 3;
      for (const [k, c] of this.world.chunks) {
        if (Math.abs(c.cx - pcx) > lim || Math.abs(c.cz - pcz) > lim) {
          this.clearMeshes(c);
          this.world.chunks.delete(k);
        }
      }
    }
  }

  neighborsReady(cx: number, cz: number) {
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (!this.world.chunks.has(World.key(cx + dx, cz + dz))) return false;
    return true;
  }

  clearMeshes(c: Chunk) {
    for (const m of c.meshes as THREE.Mesh[]) { this.scene.remove(m); m.geometry.dispose(); }
    c.meshes = [];
  }

  buildMesh(c: Chunk) {
    this.clearMeshes(c);
    const md = buildChunkMesh(this.world, c);
    const add = (d: MeshData | null, mat: THREE.Material, order: number) => {
      if (!d) return;
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(d.pos, 3));
      g.setAttribute('uv', new THREE.BufferAttribute(d.uv, 2));
      g.setAttribute('color', new THREE.BufferAttribute(d.col, 3));
      g.setIndex(new THREE.BufferAttribute(d.idx, 1));
      g.computeBoundingSphere();
      const m = new THREE.Mesh(g, mat);
      m.position.set(c.cx * CS, 0, c.cz * CS);
      m.renderOrder = order;
      m.matrixAutoUpdate = false;
      m.updateMatrix();
      this.scene.add(m);
      c.meshes.push(m);
    };
    add(md.opaque, this.matOpaque, 0);
    add(md.cutout, this.matCutout, 1);
    add(md.water, this.matWater, 2);
    c.dirty = false;
  }

  setBlocks(list: [number, number, number, number][]) {
    const dirty = new Set<Chunk>();
    for (const [x, y, z, id] of list) this.world.setBlock(x, y, z, id).forEach((c) => dirty.add(c));
    dirty.forEach((c) => { if (this.neighborsReady(c.cx, c.cz)) this.buildMesh(c); else c.dirty = true; });
  }

  // ---------------------------------------------------------------- player
  eyePos() {
    const sneak = this.keys.has('ShiftLeft') && !this.flying;
    return new THREE.Vector3(this.pos.x, this.pos.y + (sneak ? 1.47 : 1.62), this.pos.z);
  }

  updatePlayer(dt: number, input: boolean) {
    const k = input ? this.keys : EMPTY;
    const w = this.world;
    let fx = 0, fz = 0;
    if (k.has('KeyW')) fz += 1;
    if (k.has('KeyS')) fz -= 1;
    if (k.has('KeyA')) fx -= 1;
    if (k.has('KeyD')) fx += 1;
    if (fz <= 0) this.sprinting = false;
    const sinY = Math.sin(this.yaw), cosY = Math.cos(this.yaw);
    let wx = -sinY * fz + cosY * fx, wz = -cosY * fz - sinY * fx;
    const len = Math.hypot(wx, wz);
    if (len > 0) { wx /= len; wz /= len; }
    const sneak = k.has('ShiftLeft');
    const jump = k.has('Space');

    this.inWater = LIQUID[w.getBlock(Math.floor(this.pos.x), Math.floor(this.pos.y + 0.4), Math.floor(this.pos.z))] === 1;
    const eye = this.eyePos();
    const hw = LIQUID[w.getBlock(Math.floor(eye.x), Math.floor(eye.y), Math.floor(eye.z))] === 1;
    if (hw !== this.headInWater) { this.headInWater = hw; this.emit(); }

    const chunkLoaded = !!w.getChunk(Math.floor(this.pos.x / CS), Math.floor(this.pos.z / CS));

    if (this.flying) {
      const sp = this.sprinting ? 22 : 11;
      const f = 1 - Math.exp(-dt * 10);
      this.vel.x += (wx * sp - this.vel.x) * f;
      this.vel.z += (wz * sp - this.vel.z) * f;
      this.vel.y += (((jump ? 1 : 0) - (sneak ? 1 : 0)) * 9 - this.vel.y) * f;
    } else {
      const sp = this.inWater ? 2.8 : sneak ? 1.4 : this.sprinting ? 5.8 : 4.3;
      const f = this.onGround ? 1 - Math.exp(-dt * 18) : 1 - Math.exp(-dt * (this.inWater ? 6 : 3.5));
      this.vel.x += (wx * sp - this.vel.x) * f;
      this.vel.z += (wz * sp - this.vel.z) * f;
      if (this.inWater) {
        this.vel.y -= 10 * dt;
        this.vel.y = Math.max(this.vel.y, -3.5);
        if (jump) this.vel.y = Math.min(this.vel.y + 30 * dt, 3.4);
      } else {
        this.vel.y -= 30 * dt;
        this.vel.y = Math.max(this.vel.y, -55);
        if (jump && this.onGround) this.vel.y = 8.8;
      }
    }
    if (!chunkLoaded) this.vel.set(0, 0, 0);

    // sneak: don't walk off edges
    if (sneak && this.onGround && !this.flying) {
      const test = this.pos.clone();
      test.x += this.vel.x * dt; test.y -= 0.1;
      if (!overlaps(w, test, HW, 0.05)) this.vel.x = 0;
      test.copy(this.pos); test.z += this.vel.z * dt; test.y -= 0.1;
      if (!overlaps(w, test, HW, 0.05)) this.vel.z = 0;
    }

    const res = collideMove(w, this.pos, this.vel, HW, PH, dt);
    if (this.flying && res.onGround) this.flying = false;

    if (this.flying || this.inWater) this.fallStart = this.pos.y;
    else if (res.onGround) {
      const fall = this.fallStart - this.pos.y;
      if (fall > 3.5) this.damage(Math.floor(fall - 3), 'fell from a high place');
      this.fallStart = this.pos.y;
    } else this.fallStart = Math.max(this.fallStart, this.pos.y);
    this.onGround = res.onGround;

    if (Math.hypot(this.vel.x, this.vel.z) > 0.5 && this.onGround) this.bob += dt * (this.sprinting ? 13 : 10);

    // cactus
    if (this.mode === 'survival') {
      for (const [ox, oz] of [[HW + 0.05, 0], [-HW - 0.05, 0], [0, HW + 0.05], [0, -HW - 0.05]]) {
        if (w.getBlock(Math.floor(this.pos.x + ox), Math.floor(this.pos.y + 0.5), Math.floor(this.pos.z + oz)) === B.CACTUS) {
          if (performance.now() - this.hurtAt > 600) this.damage(1, 'was pricked to death');
          break;
        }
      }
    }

    if (this.pos.y < -30) {
      if (this.mode === 'creative') { this.pos.y = CH + 5; this.vel.set(0, 0, 0); this.flying = true; }
      else this.damage(100, 'fell out of the world');
    }

    // interaction
    this.actionCd -= dt;
    this.placeCd -= dt;
    this.swing = Math.max(0, this.swing - dt * 4);
    if (!input) { this.target = null; this.highlight.visible = false; this.breakBox.visible = false; return; }
    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);
    this.target = this.raycast(eye, dir, this.mode === 'creative' ? 6 : 5);
    const t = this.target;
    if (t) {
      this.highlight.visible = true;
      this.highlight.position.set(t.x + 0.5, t.y + 0.5, t.z + 0.5);
    } else this.highlight.visible = false;

    if (this.leftDown && t && this.actionCd <= 0) {
      if (this.mode === 'creative') {
        this.breakBlock(t);
        this.actionCd = 0.22;
        this.swing = 1;
      } else {
        const key = `${t.x},${t.y},${t.z}`;
        if (key !== this.breakKey) { this.breakKey = key; this.breakProgress = 0; }
        const hard = BLOCKS[t.id].hardness;
        if (hard >= 0) {
          this.breakProgress += dt / Math.max(0.05, hard * 1.5);
          if (this.swing < 0.3) this.swing = 1;
          if (this.breakProgress >= 1) {
            this.breakBlock(t);
            this.breakProgress = 0;
            this.breakKey = null;
            this.actionCd = 0.15;
          }
        }
      }
    } else if (!this.leftDown || !t) { this.breakProgress = 0; this.breakKey = null; }
    if (this.breakProgress > 0 && t) {
      this.breakBox.visible = true;
      this.breakBox.position.set(t.x + 0.5, t.y + 0.5, t.z + 0.5);
      (this.breakBox.material as THREE.MeshBasicMaterial).opacity = this.breakProgress * 0.6;
    } else this.breakBox.visible = false;

    if (this.rightDown && this.placeCd <= 0) { this.use(); this.placeCd = 0.25; }
  }

  raycast(o: THREE.Vector3, d: THREE.Vector3, max: number): Hit | null {
    let x = Math.floor(o.x), y = Math.floor(o.y), z = Math.floor(o.z);
    const sx = d.x > 0 ? 1 : -1, sy = d.y > 0 ? 1 : -1, sz = d.z > 0 ? 1 : -1;
    const tdx = d.x ? Math.abs(1 / d.x) : Infinity, tdy = d.y ? Math.abs(1 / d.y) : Infinity, tdz = d.z ? Math.abs(1 / d.z) : Infinity;
    let tmx = d.x ? (d.x > 0 ? x + 1 - o.x : o.x - x) * tdx : Infinity;
    let tmy = d.y ? (d.y > 0 ? y + 1 - o.y : o.y - y) * tdy : Infinity;
    let tmz = d.z ? (d.z > 0 ? z + 1 - o.z : o.z - z) * tdz : Infinity;
    let nx = 0, ny = 0, nz = 0, t = 0;
    while (t <= max) {
      const id = this.world.getBlock(x, y, z);
      if (id && !LIQUID[id]) return { x, y, z, nx, ny, nz, id, dist: t };
      if (tmx < tmy && tmx < tmz) { x += sx; t = tmx; tmx += tdx; nx = -sx; ny = 0; nz = 0; }
      else if (tmy < tmz) { y += sy; t = tmy; tmy += tdy; nx = 0; ny = -sy; nz = 0; }
      else { z += sz; t = tmz; tmz += tdz; nx = 0; ny = 0; nz = -sz; }
    }
    return null;
  }

  tryAttack() {
    const eye = this.eyePos();
    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);
    let best: Mob | null = null, bt = 3.5;
    for (const m of this.mobs) {
      const t = rayAABB(eye, dir, [m.pos.x - m.hw, m.pos.y, m.pos.z - m.hw], [m.pos.x + m.hw, m.pos.y + m.h, m.pos.z + m.hw]);
      if (t >= 0 && t < bt) { bt = t; best = m; }
    }
    if (!best) return false;
    const blk = this.raycast(eye, dir, 5);
    if (blk && blk.dist < bt) return false;
    this.hurtMob(best, this.mode === 'creative' ? 5 : 3, dir);
    return true;
  }

  hurtMob(m: Mob, dmg: number, dir: THREE.Vector3) {
    m.health -= dmg;
    m.hurt = 0.35;
    mcAudio.playHurt();
    m.vel.x += dir.x * 7;
    m.vel.z += dir.z * 7;
    m.vel.y = 5;
    if (m.type !== 'zombie') { m.moving = true; m.timer = 3; m.yaw = Math.atan2(dir.x, dir.z) + Math.PI; }
  }

  damage(n: number, msg: string) {
    if (this.mode === 'creative' || this.dead || n <= 0) return;
    this.health = Math.max(0, this.health - n);
    mcAudio.playHurt();
    this.hurtAt = performance.now();
    if (this.health <= 0) {
      this.dead = true;
      this.deathMsg = msg;
      this.leftDown = this.rightDown = false;
      if (document.pointerLockElement) document.exitPointerLock();
    }
    this.emit();
  }

  breakBlock(t: Hit) {
    const id = t.id;
    if (BLOCKS[id].hardness < 0 && this.mode === 'survival') return;
    if (id === B.TNT) { this.setBlocks([[t.x, t.y, t.z, 0]]); this.primeTNT(t.x, t.y, t.z, 3); return; }
    const list: [number, number, number, number][] = [[t.x, t.y, t.z, 0]];
    const above = this.world.getBlock(t.x, t.y + 1, t.z);
    if (PLANT[above]) list.push([t.x, t.y + 1, t.z, 0]);
    this.setBlocks(list);
    mcAudio.playExplosion();
    this.spawnParticles(t.x + 0.5, t.y + 0.5, t.z + 0.5, id, 14);
    mcAudio.playBreak();
    if (this.mode === 'survival') {
      const d = BLOCKS[id].drop === -1 ? id : BLOCKS[id].drop;
      if (d > 0) this.addItem(d, 1);
      if (PLANT[above] && BLOCKS[above].drop === -1) this.addItem(above, 1);
      this.emit();
    }
  }

  use() {
    this.swing = 1;
    const t = this.target;
    const slot = this.inv[this.selected];
    if (t && t.id === B.TABLE && !this.keys.has('ShiftLeft')) { this.openInventory(true); return; }
    if (slot && isItem(slot.id)) {
      if (this.mode === 'survival' && this.health < 20) {
        this.health = Math.min(20, this.health + ITEMS[slot.id].food);
        this.consumeSelected();
        mcAudio.playPop();
        this.emit();
      }
      return;
    }
    if (!slot || !t) return;
    let tx = t.x + t.nx, ty = t.y + t.ny, tz = t.z + t.nz;
    if (PLANT[t.id]) { tx = t.x; ty = t.y; tz = t.z; }
    if (ty < 0 || ty >= CH) return;
    const cur = this.world.getBlock(tx, ty, tz);
    if (cur && !PLANT[cur] && !LIQUID[cur]) return;
    const id = slot.id;
    if (SOLID[id]) {
      const inter = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number) =>
        x0 < tx + 1 && x1 > tx && y0 < ty + 1 && y1 > ty && z0 < tz + 1 && z1 > tz;
      const p = this.pos;
      if (inter(p.x - HW, p.y, p.z - HW, p.x + HW, p.y + PH, p.z + HW)) return;
      for (const m of this.mobs) if (inter(m.pos.x - m.hw, m.pos.y, m.pos.z - m.hw, m.pos.x + m.hw, m.pos.y + m.h, m.pos.z + m.hw)) return;
    }
    if (PLANT[id]) {
      const below = this.world.getBlock(tx, ty - 1, tz);
      if (below !== B.GRASS && below !== B.DIRT && below !== B.SNOWGRASS) return;
    }
    if (id === B.CACTUS) {
      const below = this.world.getBlock(tx, ty - 1, tz);
      if (below !== B.SAND && below !== B.CACTUS) return;
    }
    this.setBlocks([[tx, ty, tz, id]]);
    if (this.mode === 'survival') { this.consumeSelected(); this.emit(); }
  }

  // ---------------------------------------------------------------- TNT
  primeTNT(x: number, y: number, z: number, fuse: number) {
    const mesh = new THREE.Mesh(makeBlockGeo(B.TNT), this.matOpaque);
    mesh.position.set(x + 0.5, y + 0.5, z + 0.5);
    const flash = new THREE.Mesh(new THREE.BoxGeometry(1.02, 1.02, 1.02), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 }));
    mesh.add(flash);
    this.scene.add(mesh);
    this.tnts.push({ x, y, z, t: fuse, mesh, flash });
  }

  updateTNT(dt: number) {
    for (let i = this.tnts.length - 1; i >= 0; i--) {
      const n = this.tnts[i];
      n.t -= dt;
      n.flash.visible = Math.floor(n.t * 6) % 2 === 0;
      const s = n.t < 0.5 ? 1 + (0.5 - n.t) * 0.4 : 1;
      n.mesh.scale.setScalar(s);
      if (n.t <= 0) {
        this.scene.remove(n.mesh);
        n.mesh.geometry.dispose();
        n.flash.geometry.dispose();
        this.tnts.splice(i, 1);
        this.explode(n.x + 0.5, n.y + 0.5, n.z + 0.5);
      }
    }
  }

  explode(cx: number, cy: number, cz: number) {
    const R = 3.6;
    const list: [number, number, number, number][] = [];
    for (let dx = -4; dx <= 4; dx++) for (let dy = -4; dy <= 4; dy++) for (let dz = -4; dz <= 4; dz++) {
      const d = Math.hypot(dx, dy, dz);
      if (d > R + (Math.random() - 0.5) * 1.2) continue;
      const x = Math.floor(cx) + dx, y = Math.floor(cy) + dy, z = Math.floor(cz) + dz;
      const id = this.world.getBlock(x, y, z);
      if (!id || id === B.BEDROCK || id === B.OBSIDIAN || id === B.WATER) continue;
      if (id === B.TNT) { list.push([x, y, z, 0]); this.primeTNT(x, y, z, 0.4 + Math.random() * 0.8); continue; }
      list.push([x, y, z, 0]);
      if (Math.random() < 0.08) this.spawnParticles(x + 0.5, y + 0.5, z + 0.5, id, 3);
    }
    this.setBlocks(list);
    mcAudio.playExplosion();
    for (let i = 0; i < 40; i++) this.spawnParticles(cx, cy, cz, B.COBBLE, 1, 12);
    const pd = Math.hypot(this.pos.x - cx, this.pos.y + 0.9 - cy, this.pos.z - cz);
    if (pd < 7) {
      const f = 1 - pd / 7;
      this.damage(Math.floor(f * 22), 'was blown up by TNT');
      const dir = new THREE.Vector3(this.pos.x - cx, this.pos.y + 0.9 - cy, this.pos.z - cz).normalize();
      this.vel.addScaledVector(dir, f * 18);
      this.vel.y += f * 8;
    }
    for (const m of this.mobs) {
      const d = m.pos.distanceTo(new THREE.Vector3(cx, cy, cz));
      if (d < 7) this.hurtMob(m, Math.floor((1 - d / 7) * 25), new THREE.Vector3(m.pos.x - cx, 0, m.pos.z - cz).normalize());
    }
  }

  // ---------------------------------------------------------------- particles
  spawnParticles(x: number, y: number, z: number, id: number, n: number, speed = 3) {
    const tile = BLOCKS[id]?.tiles[2] ?? 0;
    let mat = this.particleMats.get(tile);
    if (!mat) {
      const c = getAtlas().avg[tile];
      mat = new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(c[0] / 255, c[1] / 255, c[2] / 255, THREE.SRGBColorSpace) });
      this.particleMats.set(tile, mat);
    }
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(this.particleGeo, mat);
      m.position.set(x + (Math.random() - 0.5) * 0.6, y + (Math.random() - 0.5) * 0.6, z + (Math.random() - 0.5) * 0.6);
      this.scene.add(m);
      this.particles.push({ m, v: new THREE.Vector3((Math.random() - 0.5) * speed, Math.random() * speed, (Math.random() - 0.5) * speed), life: 0.5 + Math.random() * 0.6 });
    }
  }

  updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.v.y -= 20 * dt;
      p.m.position.addScaledVector(p.v, dt);
      const bp = p.m.position;
      if (SOLID[this.world.getBlock(Math.floor(bp.x), Math.floor(bp.y - 0.06), Math.floor(bp.z))]) {
        bp.y = Math.floor(bp.y - 0.06) + 1.06;
        p.v.set(p.v.x * 0.5, 0, p.v.z * 0.5);
      }
      if (p.life <= 0) { this.scene.remove(p.m); this.particles.splice(i, 1); }
    }
  }

  // ---------------------------------------------------------------- mobs
  updateMobs(dt: number) {
    const w = this.world;
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = 1;
      const passive = this.mobs.filter((m) => m.type !== 'zombie').length;
      const hostile = this.mobs.length - passive;
      const tryPos = (minD: number, maxD: number) => {
        const a = Math.random() * Math.PI * 2, d = minD + Math.random() * (maxD - minD);
        const x = Math.floor(this.pos.x + Math.cos(a) * d), z = Math.floor(this.pos.z + Math.sin(a) * d);
        const top = w.topAt(x, z);
        if (top < 0 || top >= CH - 3) return null;
        const g = w.getBlock(x, top, z);
        if (SOLID[w.getBlock(x, top + 1, z)] || SOLID[w.getBlock(x, top + 2, z)] || LIQUID[w.getBlock(x, top + 1, z)]) return null;
        return { x: x + 0.5, y: top + 1, z: z + 0.5, g };
      };
      if (passive < 10) {
        const p = tryPos(20, 44);
        if (p && p.g === B.GRASS) this.addMob(Math.random() < 0.55 ? 'pig' : 'sheep', p.x, p.y, p.z);
      }
      if (this.daylight < 0.35 && this.mode === 'survival' && hostile < 7) {
        const p = tryPos(18, 36);
        if (p && p.g !== B.LEAVES && p.g !== B.WATER) this.addMob('zombie', p.x, p.y, p.z);
      }
    }

    for (let i = this.mobs.length - 1; i >= 0; i--) {
      const m = this.mobs[i];
      const dx = this.pos.x - m.pos.x, dz = this.pos.z - m.pos.z, dy = this.pos.y - m.pos.y;
      const dist = Math.hypot(dx, dz);
      const chunkOk = !!w.getChunk(Math.floor(m.pos.x / CS), Math.floor(m.pos.z / CS));
      if (dist > 100 || !chunkOk) { this.removeMob(i); continue; }
      m.attackCd -= dt;
      let speed = m.type === 'zombie' ? 1.2 : 1.1;
      const chase = m.type === 'zombie' && this.mode === 'survival' && !this.dead && dist < 22;
      if (chase) {
        m.yaw = Math.atan2(-dx, -dz);
        m.moving = dist > 0.9;
        speed = 2.6;
        if (dist < 1.4 && Math.abs(dy) < 1.6 && m.attackCd <= 0) {
          m.attackCd = 1;
          this.damage(3, 'was slain by Zombie');
          const kn = new THREE.Vector3(dx, 0, dz).normalize();
          this.vel.x += kn.x * 8; this.vel.z += kn.z * 8; this.vel.y = 5;
        }
      } else {
        m.timer -= dt;
        if (m.timer <= 0) {
          m.timer = 2 + Math.random() * 4;
          m.moving = Math.random() < 0.6;
          m.yaw += (Math.random() - 0.5) * Math.PI * 1.5;
        }
      }
      if (m.hurt > 0 && m.type !== 'zombie') speed = 3.5;
      const tx = m.moving ? -Math.sin(m.yaw) * speed : 0;
      const tz = m.moving ? -Math.cos(m.yaw) * speed : 0;
      const f = 1 - Math.exp(-dt * (m.onGround ? 10 : 2));
      m.vel.x += (tx - m.vel.x) * f;
      m.vel.z += (tz - m.vel.z) * f;
      const inW = LIQUID[w.getBlock(Math.floor(m.pos.x), Math.floor(m.pos.y + 0.3), Math.floor(m.pos.z))];
      if (inW) { m.vel.y = Math.min(m.vel.y + 22 * dt, 2); }
      else { m.vel.y -= 30 * dt; m.vel.y = Math.max(m.vel.y, -50); }
      const res = collideMove(w, m.pos, m.vel, m.hw, m.h, dt);
      if ((res.hitX || res.hitZ) && (res.onGround || inW)) m.vel.y = 8.5;
      m.onGround = res.onGround;

      // burn zombies in daylight
      if (m.type === 'zombie' && this.daylight > 0.6 && m.pos.y + 1.6 > w.topAt(Math.floor(m.pos.x), Math.floor(m.pos.z))) {
        m.health -= dt * 1.5;
        if (Math.random() < dt * 8) this.spawnParticles(m.pos.x, m.pos.y + 1.5, m.pos.z, B.GLOWSTONE, 1, 1.5);
      }
      m.hurt = Math.max(0, m.hurt - dt);
      const tint = m.hurt > 0 ? 0x990000 : 0x000000;
      m.mats.forEach((mt) => mt.emissive.setHex(tint));

      const hs = Math.hypot(m.vel.x, m.vel.z);
      m.walk += hs * dt * 4;
      const swingA = Math.sin(m.walk) * Math.min(1, hs) * 0.7;
      m.legs.forEach((l, li) => (l.rotation.x = li % 2 === (li < 2 ? 0 : 1) ? swingA : -swingA));
      m.group.position.copy(m.pos);
      m.group.rotation.y = m.yaw;

      if (m.health <= 0) {
        this.spawnParticles(m.pos.x, m.pos.y + m.h / 2, m.pos.z, B.WOOL, 16, 3);
        if (this.mode === 'survival') {
          if (m.type === 'pig') this.addItem(ITEM.PORKCHOP, 1 + Math.floor(Math.random() * 2));
          if (m.type === 'sheep') { this.addItem(B.WOOL, 1); this.addItem(ITEM.MUTTON, 1); }
          if (m.type === 'zombie') this.addItem(ITEM.FLESH, Math.floor(Math.random() * 3));
          this.emit();
        }
        this.removeMob(i);
      }
    }
  }

  addMob(type: MobType, x: number, y: number, z: number) {
    const m = new Mob(type);
    m.pos.set(x, y, z);
    this.scene.add(m.group);
    this.mobs.push(m);
  }
  removeMob(i: number) {
    const m = this.mobs[i];
    this.scene.remove(m.group);
    m.dispose();
    this.mobs.splice(i, 1);
  }

  // ---------------------------------------------------------------- camera & sky
  updateCamera(dt: number) {
    const e = this.eyePos();
    const moving = Math.hypot(this.vel.x, this.vel.z) > 0.5 && this.onGround;
    const bobY = moving ? Math.abs(Math.sin(this.bob)) * 0.06 : 0;
    this.camera.position.set(e.x, e.y + bobY, e.z);
    this.camera.rotation.set(this.pitch, this.yaw, 0);
    const targetFov = (this.camera as THREE.PerspectiveCamera).userData.baseFov ?? this.camera.fov;
    this.camera.userData.baseFov = targetFov;
    const want = targetFov * (this.sprinting || (this.flying && this.sprinting) ? 1.12 : 1);
    if (Math.abs(this.camera.fov - want) > 0.05) {
      this.camera.fov += (want - this.camera.fov) * Math.min(1, dt * 10);
      this.camera.updateProjectionMatrix();
    }
  }

  updateSky() {
    const ang = this.time * Math.PI * 2;
    const sunH = Math.sin(ang);
    const d = Math.max(0.14, Math.min(1, 0.45 + sunH * 1.4));
    this.daylight = d;
    const day = [0.47, 0.67, 1.0], night = [0.01, 0.015, 0.05], sunset = [0.98, 0.55, 0.28];
    const k = Math.max(0, Math.min(1, (sunH + 0.2) / 0.5));
    let col = day.map((v, i) => night[i] + (v - night[i]) * k);
    const ss = Math.max(0, 1 - Math.abs(sunH) / 0.22) * 0.55;
    col = col.map((v, i) => v + (sunset[i] - v) * ss);
    const sky = new THREE.Color().setRGB(col[0], col[1], col[2], THREE.SRGBColorSpace);
    const fog = this.scene.fog as THREE.Fog;
    if (this.headInWater) {
      const wc = new THREE.Color().setRGB(0.1 * d, 0.2 * d, 0.55 * d, THREE.SRGBColorSpace);
      this.scene.background = wc;
      fog.color.copy(wc);
      fog.near = 0.5; fog.far = 20;
    } else {
      this.scene.background = sky;
      fog.color.copy(sky);
      fog.near = this.rd * CS * 0.55; fog.far = this.rd * CS * 0.95;
    }
    const lin = d * d;
    this.matOpaque.color.setRGB(lin, lin, lin);
    this.matCutout.color.setRGB(lin, lin, lin);
    this.matWater.color.setRGB(lin, lin, lin);
    this.matHand.color.setRGB(Math.max(lin, 0.3), Math.max(lin, 0.3), Math.max(lin, 0.3));
    this.ambient.intensity = 0.3 + d * 1.2;
    this.dirLight.intensity = d * 1.5;

    const cam = this.camera.position;
    const dir = new THREE.Vector3(Math.cos(ang), sunH, 0.25).normalize();
    this.sun.position.copy(cam).addScaledVector(dir, 380);
    this.sun.lookAt(cam);
    this.moon.position.copy(cam).addScaledVector(dir, -380);
    this.moon.lookAt(cam);
    this.dirLight.position.copy(cam).addScaledVector(dir, 50);
    this.dirLight.target.position.copy(cam);
    this.stars.position.copy(cam);
    (this.stars.material as THREE.PointsMaterial).opacity = Math.max(0, Math.min(1, -sunH * 3));
    this.clouds.position.set(cam.x, 120, cam.z);
    this.cloudTex.offset.set((cam.x + this.time * 6000) / 1536, -cam.z / 1536);
    (this.clouds.material as THREE.MeshBasicMaterial).color.setScalar(Math.max(0.15, d));
  }

  updateHand(dt: number) {
    const s = this.inv[this.selected];
    const id = s ? s.id : -1;
    if (id !== this.handId) {
      this.handId = id;
      this.hand.geometry.dispose();
      if (id === -1) {
        this.hand.geometry = new THREE.BoxGeometry(0.22, 0.22, 0.7);
        this.hand.material = new THREE.MeshBasicMaterial({ color: 0xd9a066, depthTest: false, fog: false });
      } else if (isItem(id)) {
        this.hand.geometry = new THREE.BoxGeometry(0.3, 0.2, 0.3);
        this.hand.material = new THREE.MeshBasicMaterial({ color: ITEMS[id].color, depthTest: false, fog: false });
      } else {
        this.hand.geometry = makeBlockGeo(id);
        this.hand.material = this.matHand;
        if (BLOCKS[id].plant) this.hand.geometry.scale(0.5, 0.5, 0.5); else this.hand.geometry.scale(0.4, 0.4, 0.4);
      }
    }
    void dt;
    const moving = Math.hypot(this.vel.x, this.vel.z) > 0.5 && this.onGround;
    const bx = moving ? Math.sin(this.bob) * 0.03 : 0;
    const by = moving ? -Math.abs(Math.cos(this.bob)) * 0.03 : 0;
    const sw = Math.sin(this.swing * Math.PI);
    if (id === -1) {
      this.hand.position.set(0.45 + bx, -0.42 + by - sw * 0.1, -0.6 - sw * 0.15);
      this.hand.rotation.set(0.3 - sw * 0.9, -0.2, 0.1);
    } else {
      this.hand.position.set(0.5 + bx - sw * 0.15, -0.45 + by + sw * 0.1, -0.8 - sw * 0.2);
      this.hand.rotation.set(-sw * 0.8, 0.7 + sw * 0.3, 0);
    }
    this.hand.visible = !this.invOpen;
  }
}

export { RECIPES };
