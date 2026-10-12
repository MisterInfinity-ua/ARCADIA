// Subway Cyber Surfer 3-Lane for Arcadia
function gameSurfer(canvas, W) {
  const H = Math.round(W * 1.2);
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  let running = true;
  let lastTime = performance.now();

  const LANES = [W * 0.25, W * 0.5, W * 0.75];
  let curLane = 1;

  let player = {
    x: LANES[1],
    y: H - 80,
    targetX: LANES[1],
    vy: 0,
    isJumping: false,
    isDucking: false,
    duckTimer: 0,
    alive: true,
    magnet: 0
  };

  let speed = 400;
  let score = 0;
  let coins = 0;
  let obstacles = []; // { lane, y, type: 'barrier' | 'laser' | 'coin' | 'magnet' }
  let particles = [];

  function spawnWave() {
    if (!running) return;
    const lane = Math.floor(Math.random() * 3);
    const rand = Math.random();

    if (rand < 0.45) {
      // Barrier (Jump over)
      obstacles.push({ lane, y: -40, type: 'barrier', w: 50, h: 25 });
    } else if (rand < 0.75) {
      // High Laser (Duck under)
      obstacles.push({ lane, y: -40, type: 'laser', w: 60, h: 14 });
    } else if (rand < 0.9) {
      // Coin trail
      for (let i = 0; i < 4; i++) {
        obstacles.push({ lane, y: -40 - i * 35, type: 'coin' });
      }
    } else {
      // Magnet
      obstacles.push({ lane, y: -40, type: 'magnet' });
    }

    const nextTime = Math.max(500, 1400 - speed * 1.2);
    setTimeout(spawnWave, nextTime);
  }
  spawnWave();

  function onKeyDown(e) {
    if (!player.alive) return;
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
      if (curLane > 0) curLane--;
    } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
      if (curLane < 2) curLane++;
    } else if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') {
      e.preventDefault();
      if (!player.isJumping) {
        player.vy = -620;
        player.isJumping = true;
        if (window.ArcadiaAudio) window.ArcadiaAudio.playJump();
      }
    } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
      e.preventDefault();
      player.isDucking = true;
      player.duckTimer = 0.6;
    }
  }

  window.addEventListener('keydown', onKeyDown);

  function die() {
    if (!player.alive) return;
    player.alive = false;
    if (window.ArcadiaAudio) window.ArcadiaAudio.playExplosion();
    setTimeout(() => {
      showGover('CRASHED IN CYBER TUNNEL!', score);
    }, 600);
  }

  function update(dt) {
    speed += 8 * dt; // gradual acceleration
    score += Math.round(speed * dt * 0.5);
    setScore(score);

    // Update Player
    player.targetX = LANES[curLane];
    player.x += (player.targetX - player.x) * 18 * dt;

    if (player.duckTimer > 0) {
      player.duckTimer -= dt;
      if (player.duckTimer <= 0) player.isDucking = false;
    }

    if (player.magnet > 0) player.magnet -= dt;

    if (player.isJumping) {
      player.vy += 1600 * dt;
      player.y += player.vy * dt;
      if (player.y >= H - 80) {
        player.y = H - 80;
        player.vy = 0;
        player.isJumping = false;
      }
    }

    // Update Particles
    particles.forEach(p => {
      p.y += (speed * 0.8) * dt;
      p.life -= dt;
    });
    particles = particles.filter(p => p.life > 0);

    // Update Obstacles
    obstacles.forEach(o => {
      o.y += speed * dt;

      // Magnet attraction
      if (o.type === 'coin' && player.magnet > 0) {
        const ox = LANES[o.lane];
        if (Math.hypot(player.x - ox, player.y - o.y) < 180) {
          o.lane = curLane;
        }
      }

      // Check Player Collision
      if (player.alive && Math.abs(o.y - player.y) < 25 && o.lane === curLane) {
        if (o.type === 'coin') {
          o.dead = true;
          coins++;
          score += 50;
          setScore(score);
          if (window.ArcadiaAudio) window.ArcadiaAudio.playCoin();
        } else if (o.type === 'magnet') {
          o.dead = true;
          player.magnet = 6.0;
          if (window.ArcadiaAudio) window.ArcadiaAudio.playPowerup();
        } else if (o.type === 'barrier') {
          if (!player.isJumping || player.y > H - 110) {
            die();
          }
        } else if (o.type === 'laser') {
          if (!player.isDucking) {
            die();
          }
        }
      }
    });

    obstacles = obstacles.filter(o => !o.dead && o.y < H + 50);
  }

  function render() {
    ctx.fillStyle = '#080512';
    ctx.fillRect(0, 0, W, H);

    // 3 Perspective Lanes
    ctx.strokeStyle = 'rgba(123,92,255,0.25)';
    ctx.lineWidth = 2;
    LANES.forEach(lx => {
      ctx.beginPath(); ctx.moveTo(lx, 0); ctx.lineTo(lx, H); ctx.stroke();
    });

    // Track Cross Bars (Speed Illusion)
    ctx.strokeStyle = 'rgba(61,245,193,0.1)';
    const barOffset = (Date.now() * (speed / 1000)) % 60;
    for (let y = barOffset; y < H; y += 60) {
      ctx.beginPath(); ctx.moveTo(W * 0.1, y); ctx.lineTo(W * 0.9, y); ctx.stroke();
    }

    // Render Obstacles
    obstacles.forEach(o => {
      const ox = LANES[o.lane];

      if (o.type === 'coin') {
        ctx.fillStyle = '#f0c040';
        ctx.beginPath(); ctx.arc(ox, o.y, 8, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
      } else if (o.type === 'magnet') {
        ctx.fillStyle = '#ff2255';
        ctx.beginPath(); ctx.arc(ox, o.y, 12, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = '10px sans-serif'; ctx.fillText('🧲', ox - 5, o.y + 4);
      } else if (o.type === 'barrier') {
        ctx.fillStyle = '#ff4f7b';
        ctx.fillRect(ox - 24, o.y - 10, 48, 20);
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5; ctx.strokeRect(ox - 24, o.y - 10, 48, 20);
      } else if (o.type === 'laser') {
        ctx.fillStyle = '#00f0ff';
        ctx.fillRect(ox - 28, o.y - 25, 56, 10);
        ctx.shadowColor = '#00f0ff'; ctx.shadowBlur = 15;
        ctx.fillRect(ox - 28, o.y - 25, 56, 10);
        ctx.shadowBlur = 0;
      }
    });

    // Render Player
    if (player.alive) {
      const pSize = player.isDucking ? 14 : 22;
      ctx.fillStyle = '#3df5c1';
      ctx.beginPath();
      ctx.arc(player.x, player.y, pSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Surfer Board
      ctx.fillStyle = '#f0c040';
      ctx.fillRect(player.x - 18, player.y + pSize - 2, 36, 6);
    }

    // Top HUD
    ctx.fillStyle = '#f0c040';
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${score}`, 16, 22);

    ctx.fillStyle = '#3df5c1';
    ctx.textAlign = 'right';
    ctx.fillText(`COINS: ${coins}`, W - 16, 22);
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
    }
  };
}
