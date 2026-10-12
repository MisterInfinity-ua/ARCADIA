// Neon Tank War / Battle Tanks for Arcadia
function gameTanks(canvas, W) {
  const H = Math.round(W * 0.85);
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  let running = true;
  let lastTime = performance.now();

  const GRID = 28;
  const COLS = Math.floor(W / GRID);
  const ROWS = Math.floor(H / GRID);

  // 0: empty, 1: brick (destructible), 2: steel (indestructible), 3: base
  let map = Array.from({ length: ROWS }, () => Array(COLS).fill(0));

  function initMap() {
    // Outer border
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (r === 0 || r === ROWS - 1 || c === 0 || c === COLS - 1) {
          map[r][c] = 2;
        } else if ((r % 2 === 0 && c % 2 === 0) || (r > 3 && r < ROWS - 4 && Math.random() < 0.25)) {
          map[r][c] = Math.random() < 0.75 ? 1 : 2;
        }
      }
    }
    // Base core
    const bR = ROWS - 2, bC = Math.floor(COLS / 2);
    map[bR][bC] = 3;
    map[bR - 1][bC] = 1;
    map[bR][bC - 1] = 1;
    map[bR][bC + 1] = 1;
  }
  initMap();

  let player = {
    x: Math.floor(COLS / 2 - 3) * GRID + GRID / 2,
    y: (ROWS - 2) * GRID + GRID / 2,
    dir: 'up',
    hp: 3,
    cd: 0,
    alive: true
  };

  let enemies = [];
  let bullets = []; // { x, y, vx, vy, isPlayer, dead }
  let particles = [];
  let score = 0;
  let keys = {};

  function spawnEnemy() {
    if (enemies.length >= 4 || !running) return;
    const spawnCols = [2, Math.floor(COLS / 2), COLS - 3];
    const sc = spawnCols[Math.floor(Math.random() * spawnCols.length)];
    enemies.push({
      x: sc * GRID + GRID / 2,
      y: 2 * GRID + GRID / 2,
      dir: 'down',
      hp: 1,
      type: Math.random() < 0.3 ? 'heavy' : 'light',
      cd: 1.0,
      moveTimer: 0
    });
  }

  for (let i = 0; i < 3; i++) spawnEnemy();
  setInterval(() => { if (running) spawnEnemy(); }, 3500);

  function shoot(tank, isPlayer) {
    if (tank.cd > 0) return;
    tank.cd = isPlayer ? 0.3 : 1.2;

    const spd = 360;
    let vx = 0, vy = 0;
    if (tank.dir === 'up') vy = -spd;
    else if (tank.dir === 'down') vy = spd;
    else if (tank.dir === 'left') vx = -spd;
    else if (tank.dir === 'right') vx = spd;

    bullets.push({
      x: tank.x + Math.sign(vx) * 14,
      y: tank.y + Math.sign(vy) * 14,
      vx, vy,
      isPlayer
    });

    if (isPlayer && window.ArcadiaAudio) window.ArcadiaAudio.playLaser();
  }

  function onKeyDown(e) {
    keys[e.code] = true;
    if (e.code === 'Space') {
      e.preventDefault();
      if (player.alive) shoot(player, true);
    }
  }
  function onKeyUp(e) { keys[e.code] = false; }
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  function canMove(x, y) {
    const r0 = Math.floor((y - 12) / GRID);
    const r1 = Math.floor((y + 12) / GRID);
    const c0 = Math.floor((x - 12) / GRID);
    const c1 = Math.floor((x + 12) / GRID);

    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return false;
        if (map[r][c] === 1 || map[r][c] === 2 || map[r][c] === 3) return false;
      }
    }
    return true;
  }

  function update(dt) {
    if (player.cd > 0) player.cd -= dt;

    // Player Move
    if (player.alive) {
      const spd = 160 * dt;
      let dx = 0, dy = 0;

      if (keys['ArrowUp'] || keys['KeyW']) { dy -= spd; player.dir = 'up'; }
      else if (keys['ArrowDown'] || keys['KeyS']) { dy += spd; player.dir = 'down'; }
      else if (keys['ArrowLeft'] || keys['KeyA']) { dx -= spd; player.dir = 'left'; }
      else if (keys['ArrowRight'] || keys['KeyD']) { dx += spd; player.dir = 'right'; }

      if (dx !== 0 && canMove(player.x + dx, player.y)) player.x += dx;
      if (dy !== 0 && canMove(player.x, player.y + dy)) player.y += dy;
    }

    // Enemies AI
    enemies.forEach(en => {
      en.cd -= dt;
      en.moveTimer -= dt;

      if (en.moveTimer <= 0) {
        en.moveTimer = 1.0 + Math.random() * 1.5;
        const dirs = ['up', 'down', 'left', 'right'];
        en.dir = dirs[Math.floor(Math.random() * dirs.length)];
      }

      const spd = 90 * dt;
      let dx = 0, dy = 0;
      if (en.dir === 'up') dy -= spd;
      else if (en.dir === 'down') dy += spd;
      else if (en.dir === 'left') dx -= spd;
      else if (en.dir === 'right') dx += spd;

      if (canMove(en.x + dx, en.y + dy)) {
        en.x += dx; en.y += dy;
      } else {
        en.moveTimer = 0; // pick new dir
      }

      if (en.cd <= 0 && Math.random() < 0.4) {
        shoot(en, false);
      }
    });

    // Update Bullets
    bullets.forEach(b => {
      b.x += b.vx * dt;
      b.y += b.vy * dt;

      const gr = Math.floor(b.y / GRID);
      const gc = Math.floor(b.x / GRID);

      if (gr >= 0 && gr < ROWS && gc >= 0 && gc < COLS) {
        if (map[gr][gc] === 1) {
          // Destroy brick
          map[gr][gc] = 0;
          b.dead = true;
          if (window.ArcadiaAudio) window.ArcadiaAudio.playHit();
        } else if (map[gr][gc] === 2) {
          // Steel bounce
          b.dead = true;
        } else if (map[gr][gc] === 3) {
          // Base destroyed!
          map[gr][gc] = 0;
          b.dead = true;
          if (window.ArcadiaAudio) window.ArcadiaAudio.playExplosion();
          showGover('BASE CORE DESTROYED!', score);
          player.alive = false;
        }
      }

      // Hit Enemy
      if (b.isPlayer) {
        enemies.forEach(en => {
          if (Math.hypot(b.x - en.x, b.y - en.y) < 18) {
            b.dead = true;
            en.hp--;
            if (en.hp <= 0) {
              en.dead = true;
              score += 150;
              setScore(score);
              if (window.ArcadiaAudio) window.ArcadiaAudio.playExplosion();
            }
          }
        });
      } else if (player.alive) {
        // Hit Player
        if (Math.hypot(b.x - player.x, b.y - player.y) < 18) {
          b.dead = true;
          player.hp--;
          if (window.ArcadiaAudio) window.ArcadiaAudio.playHit();
          if (player.hp <= 0) {
            player.alive = false;
            if (window.ArcadiaAudio) window.ArcadiaAudio.playGameOver();
            showGover('TANK DESTROYED!', score);
          }
        }
      }
    });

    bullets = bullets.filter(b => !b.dead);
    enemies = enemies.filter(e => !e.dead);
  }

  function renderTank(x, y, dir, color) {
    ctx.save();
    ctx.translate(x, y);

    let rot = 0;
    if (dir === 'right') rot = Math.PI / 2;
    else if (dir === 'down') rot = Math.PI;
    else if (dir === 'left') rot = -Math.PI / 2;
    ctx.rotate(rot);

    // Treads
    ctx.fillStyle = '#222233';
    ctx.fillRect(-12, -12, 6, 24);
    ctx.fillRect(6, -12, 6, 24);

    // Tank Body
    ctx.fillStyle = color;
    ctx.fillRect(-8, -10, 16, 20);

    // Turret Barrel
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-2, -18, 4, 12);

    ctx.restore();
  }

  function render() {
    ctx.fillStyle = '#080512';
    ctx.fillRect(0, 0, W, H);

    // Map Tiles
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const val = map[r][c];
        const x = c * GRID, y = r * GRID;

        if (val === 1) {
          // Brick
          ctx.fillStyle = '#b33927';
          ctx.fillRect(x + 1, y + 1, GRID - 2, GRID - 2);
          ctx.strokeStyle = '#e0533c';
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 1, y + 1, GRID - 2, GRID - 2);
        } else if (val === 2) {
          // Steel
          ctx.fillStyle = '#4a5568';
          ctx.fillRect(x + 1, y + 1, GRID - 2, GRID - 2);
          ctx.strokeStyle = '#a0aec0';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(x + 1, y + 1, GRID - 2, GRID - 2);
        } else if (val === 3) {
          // Base Eagle Core
          ctx.fillStyle = '#f0c040';
          ctx.beginPath(); ctx.arc(x + GRID / 2, y + GRID / 2, 10, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#ffffff'; ctx.stroke();
        }
      }
    }

    // Tanks
    if (player.alive) renderTank(player.x, player.y, player.dir, '#3df5c1');
    enemies.forEach(en => renderTank(en.x, en.y, en.dir, en.type === 'heavy' ? '#ff2255' : '#ff8c42'));

    // Bullets
    bullets.forEach(b => {
      ctx.fillStyle = b.isPlayer ? '#3df5c1' : '#ff4f7b';
      ctx.beginPath(); ctx.arc(b.x, b.y, 4, 0, Math.PI * 2); ctx.fill();
    });

    // Top HUD
    ctx.fillStyle = '#f0c040';
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${score}`, 16, 18);

    ctx.fillStyle = '#3df5c1';
    ctx.textAlign = 'right';
    let hpStr = '';
    for (let i = 0; i < player.hp; i++) hpStr += '🛡️ ';
    ctx.fillText(hpStr || '💥', W - 16, 18);
  }

  function loop(now) {
    if (!running) return;
    const dt = Math.min(0.08, (now - lastTime) / 1000);
    lastTime = now;
    update(dt);
    render();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  return {
    stop: () => {
      running = false;
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    }
  };
}
