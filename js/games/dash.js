// Cyber Dash / Geometry Dash Rhythm Runner for Arcadia
function gameDash(canvas, W) {
  const H = Math.round(W * 0.65);
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  let running = true;
  let lastTime = performance.now();

  const FLOOR_Y = H - 50;
  const CEIL_Y = 50;

  let player = {
    x: 80,
    y: FLOOR_Y - 28,
    vy: 0,
    w: 28,
    h: 28,
    rotation: 0,
    gravity: 1, // 1: normal, -1: inverted
    onGround: true,
    alive: true,
    particles: []
  };

  let scrollX = 0;
  let speed = 320;
  let levelLength = 6000;
  let score = 0;
  let percent = 0;

  // Level Obstacle Definitions (Spikes, Pads, Gravity Portals)
  const OBSTACLES = [
    // spikes
    { x: 400, type: 'spike' },
    { x: 650, type: 'spike' },
    { x: 700, type: 'spike' },
    { x: 950, type: 'pad' }, // Yellow Jump Pad
    { x: 1050, type: 'spike' },
    { x: 1100, type: 'spike' },
    { x: 1300, type: 'block', w: 60, h: 30 },
    { x: 1500, type: 'ring' }, // Yellow Jump Ring
    { x: 1600, type: 'spike' },
    { x: 1650, type: 'spike' },
    { x: 1850, type: 'portal_flip' }, // Gravity flip portal
    { x: 2100, type: 'spike_ceil' },
    { x: 2300, type: 'block_ceil', w: 80, h: 30 },
    { x: 2550, type: 'pad_ceil' },
    { x: 2800, type: 'portal_norm' }, // Normal gravity portal
    { x: 3100, type: 'spike' },
    { x: 3160, type: 'spike' },
    { x: 3220, type: 'spike' },
    { x: 3500, type: 'ring' },
    { x: 3600, type: 'spike' },
    { x: 3800, type: 'pad' },
    { x: 4000, type: 'block', w: 100, h: 40 },
    { x: 4050, type: 'spike' },
    { x: 4300, type: 'portal_flip' },
    { x: 4600, type: 'spike_ceil' },
    { x: 4800, type: 'portal_norm' },
    { x: 5100, type: 'spike' },
    { x: 5200, type: 'spike' },
    { x: 5300, type: 'spike' },
    { x: 5500, type: 'finish' }
  ];

  function jump() {
    if (!player.alive) {
      restart();
      return;
    }

    if (player.onGround) {
      player.vy = -560 * player.gravity;
      player.onGround = false;
      if (window.ArcadiaAudio) window.ArcadiaAudio.playJump();
    } else {
      // Check ring hit
      OBSTACLES.forEach(o => {
        if (o.type === 'ring') {
          const rx = o.x - scrollX;
          const ry = FLOOR_Y - 50;
          if (Math.hypot(player.x - rx, player.y - ry) < 55) {
            player.vy = -580 * player.gravity;
            if (window.ArcadiaAudio) window.ArcadiaAudio.playCoin();
            // Spawn ring ring particles
            for (let i = 0; i < 8; i++) {
              player.particles.push({
                x: rx, y: ry,
                vx: (Math.random() - 0.5) * 200,
                vy: (Math.random() - 0.5) * 200,
                color: '#f0c040', life: 0.4
              });
            }
          }
        }
      });
    }
  }

  function restart() {
    scrollX = 0;
    player.x = 80;
    player.y = FLOOR_Y - 28;
    player.vy = 0;
    player.rotation = 0;
    player.gravity = 1;
    player.onGround = true;
    player.alive = true;
    player.particles = [];
    score = 0;
    setScore(0);
    hideGover();
  }

  function die() {
    if (!player.alive) return;
    player.alive = false;
    if (window.ArcadiaAudio) window.ArcadiaAudio.playExplosion();

    // Spawn explosion particles
    for (let i = 0; i < 30; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 100 + Math.random() * 250;
      player.particles.push({
        x: player.x, y: player.y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        color: ['#3df5c1', '#f0c040', '#ff4f7b', '#ffffff'][Math.floor(Math.random() * 4)],
        life: 0.6 + Math.random() * 0.4
      });
    }

    setTimeout(() => {
      showGover(`CRASHED AT ${percent}%`, Math.round(percent * 10));
    }, 600);
  }

  function onKeyDown(e) {
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
      e.preventDefault();
      jump();
    }
    if (e.code === 'KeyR') restart();
  }
  function onMouseDown(e) {
    if (e.button === 0) jump();
  }

  window.addEventListener('keydown', onKeyDown);
  canvas.addEventListener('mousedown', onMouseDown);

  function update(dt) {
    // Update particles
    player.particles.forEach(p => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    });
    player.particles = player.particles.filter(p => p.life > 0);

    if (!player.alive) return;

    scrollX += speed * dt;
    percent = Math.min(100, Math.round((scrollX / levelLength) * 100));
    setScore(percent);

    if (window.ArcadiaPassport && percent >= 50) {
      window.ArcadiaPassport.unlock('dash_rhythm');
    }

    if (percent >= 100) {
      // Level Complete!
      player.alive = false;
      if (window.ArcadiaAudio) window.ArcadiaAudio.playWin();
      showGover('LEVEL 100% COMPLETE!', 1000);
      return;
    }

    // Gravity & Physics
    const GRAV = 1600 * player.gravity;
    player.vy += GRAV * dt;
    player.y += player.vy * dt;

    if (player.gravity === 1) {
      if (player.y >= FLOOR_Y - player.h) {
        player.y = FLOOR_Y - player.h;
        player.vy = 0;
        player.onGround = true;
        // Snap rotation to nearest 90 deg
        player.rotation = Math.round(player.rotation / (Math.PI / 2)) * (Math.PI / 2);
      } else {
        player.onGround = false;
        player.rotation += 9.0 * dt;
      }
    } else {
      // Inverted gravity
      if (player.y <= CEIL_Y) {
        player.y = CEIL_Y;
        player.vy = 0;
        player.onGround = true;
        player.rotation = Math.round(player.rotation / (Math.PI / 2)) * (Math.PI / 2);
      } else {
        player.onGround = false;
        player.rotation += 9.0 * dt;
      }
    }

    // Trail particle
    if (Math.random() < 0.4) {
      player.particles.push({
        x: player.x - 10,
        y: player.y + player.h / 2,
        vx: -60, vy: (Math.random() - 0.5) * 20,
        color: '#3df5c1', life: 0.25
      });
    }

    // Check Obstacle collisions
    OBSTACLES.forEach(o => {
      const ox = o.x - scrollX;
      if (ox < -100 || ox > W + 100) return;

      if (o.type === 'spike') {
        const sy = FLOOR_Y - 24;
        if (Math.abs(player.x - ox) < 20 && player.y + player.h > sy) {
          die();
        }
      } else if (o.type === 'spike_ceil') {
        const sy = CEIL_Y + 24;
        if (Math.abs(player.x - ox) < 20 && player.y < sy) {
          die();
        }
      } else if (o.type === 'pad') {
        const py = FLOOR_Y - 12;
        if (Math.abs(player.x - ox) < 24 && Math.abs(player.y + player.h - py) < 20) {
          player.vy = -720;
          if (window.ArcadiaAudio) window.ArcadiaAudio.playPowerup();
        }
      } else if (o.type === 'pad_ceil') {
        const py = CEIL_Y + 12;
        if (Math.abs(player.x - ox) < 24 && Math.abs(player.y - py) < 20) {
          player.vy = 720;
          if (window.ArcadiaAudio) window.ArcadiaAudio.playPowerup();
        }
      } else if (o.type === 'portal_flip') {
        if (Math.abs(player.x - ox) < 18) {
          if (player.gravity === 1) {
            player.gravity = -1;
            player.vy = -200;
            if (window.ArcadiaAudio) window.ArcadiaAudio.playScore();
          }
        }
      } else if (o.type === 'portal_norm') {
        if (Math.abs(player.x - ox) < 18) {
          if (player.gravity === -1) {
            player.gravity = 1;
            player.vy = 200;
            if (window.ArcadiaAudio) window.ArcadiaAudio.playScore();
          }
        }
      } else if (o.type === 'block') {
        const bx = ox - o.w / 2;
        const by = FLOOR_Y - o.h;
        if (player.x + player.w / 2 > bx && player.x - player.w / 2 < bx + o.w) {
          if (player.y + player.h > by + 8 && player.y < by + o.h) {
            die();
          } else if (player.y + player.h <= by + 8) {
            player.y = by - player.h;
            player.vy = 0;
            player.onGround = true;
          }
        }
      }
    });
  }

  function render() {
    // Dynamic Neon Background
    ctx.fillStyle = '#080514';
    ctx.fillRect(0, 0, W, H);

    // Neon Grid
    ctx.strokeStyle = 'rgba(123, 92, 255, 0.15)';
    ctx.lineWidth = 1;
    const gridOffset = (scrollX * 0.5) % 40;
    for (let x = -gridOffset; x < W; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // Floor and Ceiling Neon Lines
    ctx.fillStyle = '#100c24';
    ctx.fillRect(0, FLOOR_Y, W, H - FLOOR_Y);
    ctx.fillRect(0, 0, W, CEIL_Y);

    ctx.strokeStyle = '#3df5c1';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, FLOOR_Y); ctx.lineTo(W, FLOOR_Y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, CEIL_Y); ctx.lineTo(W, CEIL_Y); ctx.stroke();

    // Render Obstacles
    OBSTACLES.forEach(o => {
      const ox = o.x - scrollX;
      if (ox < -100 || ox > W + 100) return;

      if (o.type === 'spike') {
        ctx.fillStyle = '#ff4f7b';
        ctx.beginPath();
        ctx.moveTo(ox - 14, FLOOR_Y);
        ctx.lineTo(ox, FLOOR_Y - 26);
        ctx.lineTo(ox + 14, FLOOR_Y);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else if (o.type === 'spike_ceil') {
        ctx.fillStyle = '#ff4f7b';
        ctx.beginPath();
        ctx.moveTo(ox - 14, CEIL_Y);
        ctx.lineTo(ox, CEIL_Y + 26);
        ctx.lineTo(ox + 14, CEIL_Y);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else if (o.type === 'pad') {
        ctx.fillStyle = '#f0c040';
        ctx.fillRect(ox - 16, FLOOR_Y - 8, 32, 8);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(ox - 8, FLOOR_Y - 6, 16, 4);
      } else if (o.type === 'ring') {
        ctx.strokeStyle = '#f0c040';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(ox, FLOOR_Y - 50, 16, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(240, 192, 64, 0.3)';
        ctx.fill();
      } else if (o.type === 'portal_flip') {
        ctx.fillStyle = 'rgba(255, 79, 123, 0.4)';
        ctx.strokeStyle = '#ff4f7b';
        ctx.lineWidth = 3;
        ctx.strokeRect(ox - 10, CEIL_Y + 10, 20, FLOOR_Y - CEIL_Y - 20);
        ctx.fillRect(ox - 10, CEIL_Y + 10, 20, FLOOR_Y - CEIL_Y - 20);
      } else if (o.type === 'portal_norm') {
        ctx.fillStyle = 'rgba(61, 245, 193, 0.4)';
        ctx.strokeStyle = '#3df5c1';
        ctx.lineWidth = 3;
        ctx.strokeRect(ox - 10, CEIL_Y + 10, 20, FLOOR_Y - CEIL_Y - 20);
        ctx.fillRect(ox - 10, CEIL_Y + 10, 20, FLOOR_Y - CEIL_Y - 20);
      } else if (o.type === 'block') {
        ctx.fillStyle = '#2a1a4a';
        ctx.strokeStyle = '#7b5cff';
        ctx.lineWidth = 2;
        ctx.fillRect(ox - o.w / 2, FLOOR_Y - o.h, o.w, o.h);
        ctx.strokeRect(ox - o.w / 2, FLOOR_Y - o.h, o.w, o.h);
      }
    });

    // Particles
    player.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, 4, 4);
    });

    // Render Player Cube
    if (player.alive) {
      ctx.save();
      ctx.translate(player.x, player.y + player.h / 2);
      ctx.rotate(player.rotation);

      // Cube Body
      ctx.fillStyle = '#3df5c1';
      ctx.fillRect(-player.w / 2, -player.h / 2, player.w, player.h);

      // Inner Face / Eyes
      ctx.fillStyle = '#06040e';
      ctx.fillRect(-player.w / 4, -player.h / 4, player.w / 2, player.h / 2);
      ctx.fillStyle = '#f0c040';
      ctx.fillRect(-2, -2, 4, 4);

      ctx.restore();
    }

    // Top Progress Bar HUD
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(W / 2 - 100, 12, 200, 14);
    ctx.fillStyle = '#3df5c1';
    ctx.fillRect(W / 2 - 100, 12, (200 * percent) / 100, 14);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(W / 2 - 100, 12, 200, 14);

    ctx.fillStyle = '#ffffff';
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${percent}%`, W / 2, 24);
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
      canvas.removeEventListener('mousedown', onMouseDown);
    }
  };
}
