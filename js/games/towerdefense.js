// Arcadia Tower Defense
function gameTowerDefense(canvas, W) {
  const H = Math.round(W * 0.72);
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  let running = true;
  let lastTime = performance.now();

  let gold = 150;
  let lives = 20;
  let wave = 0;
  let waveInProgress = false;
  let waveTimer = 3.0;
  let score = 0;

  // Track Path Waypoints
  const PATH = [
    { x: -20, y: H * 0.25 },
    { x: W * 0.25, y: H * 0.25 },
    { x: W * 0.25, y: H * 0.75 },
    { x: W * 0.6, y: H * 0.75 },
    { x: W * 0.6, y: H * 0.35 },
    { x: W * 0.85, y: H * 0.35 },
    { x: W * 0.85, y: H * 0.8 },
    { x: W + 20, y: H * 0.8 }
  ];

  // Grid system for placing towers (columns & rows)
  const COLS = 12, ROWS = 8;
  const CELL_W = W / COLS;
  const CELL_H = (H - 50) / ROWS;

  const TOWERS = [
    { id: 'gun', name: 'GATLING', cost: 100, range: 110, dmg: 14, rate: 0.18, color: '#3df5c1' },
    { id: 'laser', name: 'LASER', cost: 175, range: 140, dmg: 40, rate: 0.6, color: '#ff4f7b' },
    { id: 'ice', name: 'FROST', cost: 125, range: 95, dmg: 8, rate: 0.4, slow: 0.5, color: '#44aaff' },
    { id: 'mortar', name: 'MORTAR', cost: 220, range: 160, dmg: 85, rate: 1.2, splash: 50, color: '#f0c040' }
  ];

  let selectedTowerType = 0; // index in TOWERS
  let placedTowers = []; // { x, y, gx, gy, type, level, cd, target }
  let enemies = []; // { x, y, wpIdx, hp, maxHp, speed, reward, isBoss }
  let projectiles = []; // { x, y, tx, ty, target, speed, dmg, color, splash }
  let particles = [];
  let selectedPlacedTower = null;

  function isPath(gx, gy) {
    const cx = gx * CELL_W + CELL_W / 2;
    const cy = gy * CELL_H + CELL_H / 2;
    // Check distance to path segments
    for (let i = 0; i < PATH.length - 1; i++) {
      const p1 = PATH[i], p2 = PATH[i+1];
      const dist = distToSegment({ x: cx, y: cy }, p1, p2);
      if (dist < 32) return true;
    }
    return false;
  }

  function distToSegment(p, v, w) {
    const l2 = (v.x - w.x)**2 + (v.y - w.y)**2;
    if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
    let t = ((p.x - v.x)*(w.x - v.x) + (p.y - v.y)*(w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p.x - (v.x + t*(w.x - v.x)), p.y - (v.y + t*(w.y - v.y)));
  }

  function startNextWave() {
    wave++;
    waveInProgress = true;
    const count = 6 + wave * 3;
    const isBossWave = wave % 5 === 0;

    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        if (!running) return;
        const isBoss = isBossWave && i === count - 1;
        const hp = (isBoss ? 450 : 45) * (1 + wave * 0.25);
        enemies.push({
          x: PATH[0].x,
          y: PATH[0].y,
          wpIdx: 0,
          hp: hp,
          maxHp: hp,
          speed: (isBoss ? 40 : 65) + Math.random() * 15,
          reward: isBoss ? 80 : 15,
          isBoss
        });
      }, i * 650);
    }
  }

  function onClick(e) {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    // Check Bottom Tower Bar Click
    if (my > H - 48) {
      const btnW = W / 4;
      const idx = Math.floor(mx / btnW);
      if (idx >= 0 && idx < TOWERS.length) {
        selectedTowerType = idx;
        if (window.ArcadiaAudio) window.ArcadiaAudio.playClick();
      }
      return;
    }

    // Grid placement
    const gx = Math.floor(mx / CELL_W);
    const gy = Math.floor(my / CELL_H);
    if (gx < 0 || gx >= COLS || gy < 0 || gy >= ROWS) return;

    // Check if clicked existing tower
    const existing = placedTowers.find(t => t.gx === gx && t.gy === gy);
    if (existing) {
      selectedPlacedTower = existing;
      return;
    }

    if (!isPath(gx, gy)) {
      const tDef = TOWERS[selectedTowerType];
      if (gold >= tDef.cost) {
        gold -= tDef.cost;
        placedTowers.push({
          gx, gy,
          x: gx * CELL_W + CELL_W / 2,
          y: gy * CELL_H + CELL_H / 2,
          type: tDef,
          level: 1,
          cd: 0
        });
        if (window.ArcadiaAudio) window.ArcadiaAudio.playCoin();
      } else {
        if (window.ArcadiaAudio) window.ArcadiaAudio.playTone(180, 0.08, 'sawtooth', 0.2);
      }
    }
  }

  canvas.addEventListener('click', onClick);

  function update(dt) {
    // Wave timer
    if (!waveInProgress && enemies.length === 0) {
      waveTimer -= dt;
      if (waveTimer <= 0) {
        startNextWave();
      }
    }

    // Update Enemies
    enemies.forEach(en => {
      const targetWp = PATH[en.wpIdx + 1];
      if (!targetWp) return;

      const dx = targetWp.x - en.x;
      const dy = targetWp.y - en.y;
      const dist = Math.hypot(dx, dy);

      const moveStep = en.speed * dt;
      if (dist <= moveStep) {
        en.wpIdx++;
        if (en.wpIdx >= PATH.length - 1) {
          // Reached end base
          en.dead = true;
          lives -= en.isBoss ? 5 : 1;
          if (window.ArcadiaAudio) window.ArcadiaAudio.playHit();
          if (lives <= 0) {
            lives = 0;
            if (window.ArcadiaAudio) window.ArcadiaAudio.playGameOver();
            showGover(`BASE DESTROYED! WAVE ${wave}`, score);
            running = false;
          }
        }
      } else {
        en.x += (dx / dist) * moveStep;
        en.y += (dy / dist) * moveStep;
      }
    });

    enemies = enemies.filter(e => !e.dead && e.hp > 0);
    if (waveInProgress && enemies.length === 0) {
      waveInProgress = false;
      waveTimer = 4.0;
      gold += 50 + wave * 10;
      score += wave * 200;
      setScore(score);
      if (window.ArcadiaPassport && wave >= 10) {
        window.ArcadiaPassport.unlock('tower_marshal');
      }
      if (window.ArcadiaAudio) window.ArcadiaAudio.playPowerup();
    }

    // Towers AI & Shooting
    placedTowers.forEach(t => {
      if (t.cd > 0) t.cd -= dt;

      // Find closest enemy in range
      let bestEn = null;
      let closestDist = t.type.range;

      enemies.forEach(en => {
        const d = Math.hypot(en.x - t.x, en.y - t.y);
        if (d < closestDist) {
          closestDist = d;
          bestEn = en;
        }
      });

      if (bestEn && t.cd <= 0) {
        t.cd = t.type.rate;
        // Fire projectile
        projectiles.push({
          x: t.x, y: t.y,
          target: bestEn,
          speed: 400,
          dmg: t.type.dmg * t.level,
          color: t.type.color,
          splash: t.type.splash || 0,
          slow: t.type.slow || 0
        });
        if (window.ArcadiaAudio) window.ArcadiaAudio.playLaser();
      }
    });

    // Update Projectiles
    projectiles.forEach(p => {
      if (!p.target || p.target.hp <= 0) {
        p.dead = true;
        return;
      }

      const dx = p.target.x - p.x;
      const dy = p.target.y - p.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 15) {
        p.dead = true;
        p.target.hp -= p.dmg;
        if (p.slow) p.target.speed *= p.slow;

        if (p.splash) {
          enemies.forEach(en => {
            if (Math.hypot(en.x - p.target.x, en.y - p.target.y) < p.splash) {
              en.hp -= p.dmg * 0.6;
            }
          });
        }

        // Particle explosion
        for (let i = 0; i < 6; i++) {
          particles.push({
            x: p.target.x, y: p.target.y,
            vx: (Math.random() - 0.5) * 120,
            vy: (Math.random() - 0.5) * 120,
            color: p.color, life: 0.3
          });
        }

        if (p.target.hp <= 0) {
          gold += p.target.reward;
          score += p.target.reward * 10;
          setScore(score);
          if (window.ArcadiaAudio) window.ArcadiaAudio.playScore();
        }
      } else {
        p.x += (dx / dist) * p.speed * dt;
        p.y += (dy / dist) * p.speed * dt;
      }
    });
    projectiles = projectiles.filter(p => !p.dead);

    // Update Particles
    particles.forEach(pt => {
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.life -= dt;
    });
    particles = particles.filter(pt => pt.life > 0);
  }

  function render() {
    ctx.fillStyle = '#0a0818';
    ctx.fillRect(0, 0, W, H);

    // Draw Grid Placement Zones
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (!isPath(c, r)) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
          ctx.fillRect(c * CELL_W + 2, r * CELL_H + 2, CELL_W - 4, CELL_H - 4);
        }
      }
    }

    // Draw Winding Path
    ctx.lineWidth = 36;
    ctx.strokeStyle = '#18122c';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(PATH[0].x, PATH[0].y);
    for (let i = 1; i < PATH.length; i++) ctx.lineTo(PATH[i].x, PATH[i].y);
    ctx.stroke();

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#3df5c1';
    ctx.stroke();

    // Draw Towers
    placedTowers.forEach(t => {
      ctx.fillStyle = t.type.color;
      ctx.beginPath();
      ctx.arc(t.x, t.y, 16, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#06040e';
      ctx.beginPath();
      ctx.arc(t.x, t.y, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    // Draw Enemies
    enemies.forEach(en => {
      ctx.fillStyle = en.isBoss ? '#ff2255' : '#ff8c42';
      ctx.beginPath();
      ctx.arc(en.x, en.y, en.isBoss ? 16 : 9, 0, Math.PI * 2);
      ctx.fill();

      // Health bar
      const barW = en.isBoss ? 32 : 18;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(en.x - barW / 2, en.y - (en.isBoss ? 24 : 15), barW, 4);
      ctx.fillStyle = '#3df5c1';
      ctx.fillRect(en.x - barW / 2, en.y - (en.isBoss ? 24 : 15), barW * Math.max(0, en.hp / en.maxHp), 4);
    });

    // Draw Projectiles
    projectiles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Particles
    particles.forEach(pt => {
      ctx.fillStyle = pt.color;
      ctx.fillRect(pt.x, pt.y, 3, 3);
    });

    // Top HUD
    ctx.fillStyle = 'rgba(6, 4, 14, 0.85)';
    ctx.fillRect(0, 0, W, 28);
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillStyle = '#f0c040';
    ctx.textAlign = 'left';
    ctx.fillText(`💰 ${gold}`, 12, 18);
    ctx.fillStyle = '#ff4f7b';
    ctx.fillText(`❤️ ${lives}`, 110, 18);
    ctx.fillStyle = '#3df5c1';
    ctx.fillText(`WAVE: ${wave}`, 200, 18);

    // Bottom Tower Selection Bar
    const barY = H - 44;
    ctx.fillStyle = '#110d24';
    ctx.fillRect(0, barY, W, 44);

    const btnW = W / TOWERS.length;
    TOWERS.forEach((tw, idx) => {
      const bx = idx * btnW;
      const isSel = idx === selectedTowerType;

      ctx.fillStyle = isSel ? 'rgba(61, 245, 193, 0.2)' : 'transparent';
      ctx.fillRect(bx, barY, btnW, 44);

      ctx.strokeStyle = isSel ? '#3df5c1' : 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(bx, barY, btnW, 44);

      ctx.fillStyle = tw.color;
      ctx.font = '9px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.fillText(tw.name, bx + btnW / 2, barY + 18);

      ctx.fillStyle = '#f0c040';
      ctx.fillText(`${tw.cost}G`, bx + btnW / 2, barY + 34);
    });
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
      canvas.removeEventListener('click', onClick);
    }
  };
}
