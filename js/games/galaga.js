// Galaga / Cyber Space Fighter for Arcadia
function gameGalaga(canvas, W) {
  const H = Math.round(W * 1.25);
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  let running = true;
  let lastTime = performance.now();

  let player = {
    x: W / 2, y: H - 45,
    w: 30, h: 24,
    vx: 0,
    dual: false,
    alive: true,
    lives: 3
  };

  let lasers = [];
  let enemies = []; // { x, y, origX, origY, type, state, hp, t, color }
  let enemyLasers = [];
  let particles = [];
  let wave = 1;
  let score = 0;
  let keys = {};

  function initWave() {
    enemies = [];
    const rows = 4, cols = 8;
    const startX = (W - cols * 38) / 2;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const type = r === 0 ? 'boss' : r === 1 ? 'butterfly' : 'bee';
        const color = r === 0 ? '#ff2255' : r === 1 ? '#ff4f7b' : '#f0c040';
        enemies.push({
          x: startX + c * 38 + 19,
          y: 60 + r * 32,
          origX: startX + c * 38 + 19,
          origY: 60 + r * 32,
          type,
          color,
          hp: type === 'boss' ? 2 : 1,
          state: 'grid',
          t: Math.random() * Math.PI * 2,
          diveT: 0
        });
      }
    }
  }
  initWave();

  function shoot() {
    if (!player.alive) return;
    if (player.dual) {
      lasers.push({ x: player.x - 12, y: player.y - 12, vy: -700 });
      lasers.push({ x: player.x + 12, y: player.y - 12, vy: -700 });
    } else {
      lasers.push({ x: player.x, y: player.y - 12, vy: -700 });
    }
    if (window.ArcadiaAudio) window.ArcadiaAudio.playLaser();
  }

  function onKeyDown(e) {
    keys[e.code] = true;
    if (e.code === 'Space') {
      e.preventDefault();
      shoot();
    }
  }
  function onKeyUp(e) { keys[e.code] = false; }
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  function update(dt) {
    // Player move
    const spd = 320;
    if (keys['ArrowLeft'] || keys['KeyA']) player.x = Math.max(20, player.x - spd * dt);
    if (keys['ArrowRight'] || keys['KeyD']) player.x = Math.min(W - 20, player.x + spd * dt);

    // Lasers
    lasers.forEach(l => { l.y += l.vy * dt; });
    lasers = lasers.filter(l => l.y > -20);

    enemyLasers.forEach(el => { el.y += el.vy * dt; });
    enemyLasers = enemyLasers.filter(el => el.y < H + 20);

    // Particles
    particles.forEach(p => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    });
    particles = particles.filter(p => p.life > 0);

    // Enemy AI & Movement
    let aliveCount = 0;
    enemies.forEach(en => {
      if (en.hp <= 0) return;
      aliveCount++;
      en.t += dt * 3;

      if (en.state === 'grid') {
        en.x = en.origX + Math.sin(en.t) * 12;
        en.y = en.origY;

        // Chance to dive
        if (Math.random() < 0.002) {
          en.state = 'diving';
          en.diveT = 0;
          // Shoot at player
          enemyLasers.push({ x: en.x, y: en.y, vy: 300 });
        }
      } else if (en.state === 'diving') {
        en.diveT += dt * 2.2;
        en.y += 240 * dt;
        en.x += Math.sin(en.diveT * 3) * 160 * dt;

        if (en.y > H + 40) {
          en.y = -20;
          en.state = 'grid';
        }
      }

      // Check Laser Hit
      lasers.forEach(l => {
        if (Math.hypot(l.x - en.x, l.y - en.y) < 16) {
          en.hp--;
          l.dead = true;
          if (en.hp <= 0) {
            score += en.type === 'boss' ? 200 : 80;
            setScore(score);
            if (window.ArcadiaAudio) window.ArcadiaAudio.playExplosion();
            for (let i = 0; i < 14; i++) {
              particles.push({
                x: en.x, y: en.y,
                vx: (Math.random() - 0.5) * 200, vy: (Math.random() - 0.5) * 200,
                color: en.color, life: 0.4
              });
            }
          } else {
            if (window.ArcadiaAudio) window.ArcadiaAudio.playHit();
          }
        }
      });

      // Check hit player
      if (player.alive && Math.hypot(en.x - player.x, en.y - player.y) < 20) {
        en.hp = 0;
        playerHit();
      }
    });

    lasers = lasers.filter(l => !l.dead);

    // Enemy lasers hit player
    enemyLasers.forEach(el => {
      if (player.alive && Math.hypot(el.x - player.x, el.y - player.y) < 18) {
        el.dead = true;
        playerHit();
      }
    });
    enemyLasers = enemyLasers.filter(el => !el.dead);

    // Wave complete
    if (aliveCount === 0) {
      wave++;
      score += 500;
      setScore(score);
      player.dual = true; // reward dual cannons!
      if (window.ArcadiaAudio) window.ArcadiaAudio.playWin();
      initWave();
    }
  }

  function playerHit() {
    player.lives--;
    player.dual = false;
    if (window.ArcadiaAudio) window.ArcadiaAudio.playExplosion();

    for (let i = 0; i < 20; i++) {
      particles.push({
        x: player.x, y: player.y,
        vx: (Math.random() - 0.5) * 220, vy: (Math.random() - 0.5) * 220,
        color: '#3df5c1', life: 0.5
      });
    }

    if (player.lives <= 0) {
      player.alive = false;
      if (window.ArcadiaAudio) window.ArcadiaAudio.playGameOver();
      setTimeout(() => {
        showGover('FLEET DESTROYED!', score);
      }, 600);
    }
  }

  function render() {
    ctx.fillStyle = '#060412';
    ctx.fillRect(0, 0, W, H);

    // Background Stars
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 25; i++) {
      const sx = (i * 97) % W;
      const sy = (i * 131 + (Date.now() / 20)) % H;
      ctx.fillRect(sx, sy, 2, 2);
    }

    // Enemies
    enemies.forEach(en => {
      if (en.hp <= 0) return;
      ctx.fillStyle = en.color;

      ctx.beginPath();
      ctx.arc(en.x, en.y, 11, 0, Math.PI * 2);
      ctx.fill();

      // Wings
      ctx.fillRect(en.x - 14, en.y - 4, 28, 8);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(en.x - 3, en.y - 3, 6, 6);
    });

    // Lasers
    lasers.forEach(l => {
      ctx.fillStyle = '#3df5c1';
      ctx.fillRect(l.x - 2, l.y - 8, 4, 16);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(l.x - 1, l.y - 6, 2, 12);
    });

    enemyLasers.forEach(el => {
      ctx.fillStyle = '#ff4f7b';
      ctx.fillRect(el.x - 2, el.y - 6, 4, 12);
    });

    // Particles
    particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, 4, 4);
    });

    // Player Fighter
    if (player.alive) {
      ctx.fillStyle = '#3df5c1';
      ctx.beginPath();
      ctx.moveTo(player.x, player.y - 14);
      ctx.lineTo(player.x - 16, player.y + 12);
      ctx.lineTo(player.x + 16, player.y + 12);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      if (player.dual) {
        // Dual Pods
        ctx.fillStyle = '#f0c040';
        ctx.fillRect(player.x - 22, player.y + 2, 8, 12);
        ctx.fillRect(player.x + 14, player.y + 2, 8, 12);
      }
    }

    // Top HUD
    ctx.fillStyle = '#f0c040';
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${score}`, 16, 22);

    ctx.fillStyle = '#ff4f7b';
    ctx.textAlign = 'right';
    let lifeStr = '';
    for (let i = 0; i < player.lives; i++) lifeStr += '🚀 ';
    ctx.fillText(lifeStr, W - 16, 22);
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
