// Cyber Jumper / Doodle Jump for Arcadia
function gameJumper(canvas, W) {
  const H = Math.round(W * 1.3);
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  let running = true;
  let lastTime = performance.now();

  let player = {
    x: W / 2, y: H - 120,
    vx: 0, vy: -550,
    w: 26, h: 26,
    facing: 1, // 1: right, -1: left
    alive: true,
    jetpack: 0
  };

  let platforms = [];
  let bullets = [];
  let monsters = [];
  let particles = [];
  let maxAltitude = 0;
  let score = 0;
  let keys = {};

  // Initialize Platforms
  const PLAT_W = 58, PLAT_H = 12;
  platforms.push({ x: W / 2 - PLAT_W / 2, y: H - 40, type: 'standard', w: PLAT_W, h: PLAT_H });

  for (let i = 1; i < 15; i++) {
    spawnPlatform(H - i * 65);
  }

  function spawnPlatform(y) {
    const x = Math.random() * (W - PLAT_W);
    const rand = Math.random();
    let type = 'standard';
    let spring = false;

    if (rand < 0.25) type = 'moving';
    else if (rand < 0.4) type = 'broken';
    else if (rand < 0.55 && Math.random() < 0.3) spring = true;

    platforms.push({
      x, y,
      w: PLAT_W, h: PLAT_H,
      type,
      vx: (Math.random() < 0.5 ? 1 : -1) * (60 + Math.random() * 60),
      broken: false,
      spring,
      hasJetpack: Math.random() < 0.04
    });

    // Chance to spawn monster
    if (Math.random() < 0.08 && y < H - 200) {
      monsters.push({
        x: Math.random() * (W - 32),
        y: y - 40,
        w: 32, h: 32,
        vx: (Math.random() - 0.5) * 40,
        alive: true
      });
    }
  }

  function shoot() {
    if (!player.alive) return;
    bullets.push({ x: player.x, y: player.y - 10, vy: -800 });
    if (window.ArcadiaAudio) window.ArcadiaAudio.playLaser();
  }

  function onKeyDown(e) {
    keys[e.code] = true;
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
      e.preventDefault();
      shoot();
    }
  }
  function onKeyUp(e) { keys[e.code] = false; }
  function onClick() { shoot(); }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('click', onClick);

  function die() {
    if (!player.alive) return;
    player.alive = false;
    if (window.ArcadiaAudio) window.ArcadiaAudio.playGameOver();
    setTimeout(() => {
      showGover('FELL DOWN! GAME OVER', score);
    }, 600);
  }

  function update(dt) {
    // Bullets
    bullets.forEach(b => { b.y += b.vy * dt; });
    bullets = bullets.filter(b => b.y > -20);

    // Particles
    particles.forEach(p => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    });
    particles = particles.filter(p => p.life > 0);

    if (!player.alive) return;

    // Movement
    const accel = 1200;
    if (keys['ArrowLeft'] || keys['KeyA']) {
      player.vx = Math.max(-380, player.vx - accel * dt);
      player.facing = -1;
    } else if (keys['ArrowRight'] || keys['KeyD']) {
      player.vx = Math.min(380, player.vx + accel * dt);
      player.facing = 1;
    } else {
      player.vx *= Math.pow(0.85, dt * 60);
    }

    player.x += player.vx * dt;

    // Screen wrapping left/right
    if (player.x < -15) player.x = W + 15;
    if (player.x > W + 15) player.x = -15;

    // Jetpack mode
    if (player.jetpack > 0) {
      player.jetpack -= dt;
      player.vy = -750;
      // Jetpack particles
      if (Math.random() < 0.6) {
        particles.push({
          x: player.x, y: player.y + 15,
          vx: (Math.random() - 0.5) * 40, vy: 120 + Math.random() * 80,
          color: '#f0c040', life: 0.3
        });
      }
    } else {
      // Normal Gravity
      player.vy += 1200 * dt;
    }

    player.y += player.vy * dt;

    // Camera follow (when player reaches upper half)
    if (player.y < H * 0.45) {
      const diff = (H * 0.45) - player.y;
      player.y = H * 0.45;
      score += Math.round(diff);
      setScore(score);

      // Move platforms down
      platforms.forEach(p => { p.y += diff; });
      monsters.forEach(m => { m.y += diff; });
      bullets.forEach(b => { b.y += diff; });

      // Clean offscreen platforms and spawn new ones at top
      platforms = platforms.filter(p => p.y < H + 20);
      monsters = monsters.filter(m => m.y < H + 20 && m.alive);

      while (platforms.length < 15) {
        const topY = Math.min(...platforms.map(p => p.y));
        spawnPlatform(topY - 65 - Math.random() * 20);
      }
    }

    // Platform Updates & Collisions (only when falling downwards)
    platforms.forEach(p => {
      if (p.type === 'moving') {
        p.x += p.vx * dt;
        if (p.x < 10) { p.x = 10; p.vx = Math.abs(p.vx); }
        if (p.x + p.w > W - 10) { p.x = W - 10 - p.w; p.vx = -Math.abs(p.vx); }
      }

      // Check collision
      if (player.vy > 0 && !p.broken) {
        if (player.x + 12 > p.x && player.x - 12 < p.x + p.w) {
          if (player.y + player.h / 2 >= p.y && player.y + player.h / 2 <= p.y + 14) {
            if (p.type === 'broken') {
              p.broken = true;
              if (window.ArcadiaAudio) window.ArcadiaAudio.playHit();
            } else {
              player.vy = p.spring ? -820 : -560;
              if (window.ArcadiaAudio) {
                if (p.spring) window.ArcadiaAudio.playPowerup();
                else window.ArcadiaAudio.playJump();
              }

              if (p.hasJetpack) {
                p.hasJetpack = false;
                player.jetpack = 3.5;
                if (window.ArcadiaAudio) window.ArcadiaAudio.playCoin();
              }
            }
          }
        }
      }
    });

    // Monster Collisions
    monsters.forEach(m => {
      m.x += m.vx * dt;
      if (m.x < 10 || m.x + m.w > W - 10) m.vx *= -1;

      // Bullet hit
      bullets.forEach(b => {
        if (b.x > m.x && b.x < m.x + m.w && b.y > m.y && b.y < m.y + m.h) {
          m.alive = false;
          b.dead = true;
          score += 200;
          setScore(score);
          if (window.ArcadiaAudio) window.ArcadiaAudio.playExplosion();
          for (let i = 0; i < 12; i++) {
            particles.push({
              x: m.x + m.w / 2, y: m.y + m.h / 2,
              vx: (Math.random() - 0.5) * 180, vy: (Math.random() - 0.5) * 180,
              color: '#ff4f7b', life: 0.4
            });
          }
        }
      });

      // Player hit monster
      if (m.alive && Math.hypot(player.x - (m.x + m.w / 2), player.y - (m.y + m.h / 2)) < 24) {
        if (player.vy > 0 && player.y < m.y + 10) {
          // Stomp monster
          m.alive = false;
          player.vy = -600;
          score += 150;
          setScore(score);
          if (window.ArcadiaAudio) window.ArcadiaAudio.playHit();
        } else if (player.jetpack <= 0) {
          die();
        }
      }
    });
    bullets = bullets.filter(b => !b.dead);

    // Fall below screen bottom
    if (player.y > H + 40) {
      die();
    }
  }

  function render() {
    ctx.fillStyle = '#080512';
    ctx.fillRect(0, 0, W, H);

    // Grid lines background
    ctx.strokeStyle = 'rgba(123,92,255,0.08)';
    ctx.lineWidth = 1;
    for (let y = 0; y < H; y += 30) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // Platforms
    platforms.forEach(p => {
      if (p.broken) return;

      let color = '#3df5c1';
      if (p.type === 'moving') color = '#44aaff';
      if (p.type === 'broken') color = '#ff4f7b';

      ctx.fillStyle = color;
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(p.x, p.y, p.w, p.h);

      // Spring
      if (p.spring) {
        ctx.fillStyle = '#f0c040';
        ctx.fillRect(p.x + p.w / 2 - 6, p.y - 6, 12, 6);
      }
      // Jetpack pickup
      if (p.hasJetpack) {
        ctx.fillStyle = '#ff2255';
        ctx.fillRect(p.x + p.w / 2 - 8, p.y - 12, 16, 12);
        ctx.fillStyle = '#ffff66';
        ctx.fillRect(p.x + p.w / 2 - 4, p.y - 10, 8, 8);
      }
    });

    // Monsters
    monsters.forEach(m => {
      if (!m.alive) return;
      ctx.fillStyle = '#ff4f7b';
      ctx.beginPath(); ctx.arc(m.x + m.w / 2, m.y + m.h / 2, m.w / 2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(m.x + 8, m.y + 10, 4, 4);
      ctx.fillRect(m.x + 20, m.y + 10, 4, 4);
    });

    // Bullets
    bullets.forEach(b => {
      ctx.fillStyle = '#ffff66';
      ctx.beginPath(); ctx.arc(b.x, b.y, 4, 0, Math.PI * 2); ctx.fill();
    });

    // Particles
    particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, 4, 4);
    });

    // Player
    if (player.alive) {
      ctx.fillStyle = '#3df5c1';
      ctx.beginPath();
      ctx.arc(player.x, player.y, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Snout / gun
      ctx.fillStyle = '#06040e';
      ctx.fillRect(player.x + (player.facing > 0 ? 6 : -10), player.y - 4, 6, 6);

      // Jetpack flame
      if (player.jetpack > 0) {
        ctx.fillStyle = '#ff8c42';
        ctx.fillRect(player.x - 6, player.y + 14, 12, 12);
      }
    }

    // Top HUD
    ctx.fillStyle = 'rgba(6,4,14,0.85)';
    ctx.fillRect(0, 0, W, 28);
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillStyle = '#f0c040';
    ctx.textAlign = 'left';
    ctx.fillText(`ALTITUDE: ${score}`, 12, 18);
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
      canvas.removeEventListener('click', onClick);
    }
  };
}
