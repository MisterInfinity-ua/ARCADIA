// Crossy Cyber / Neon Road Hopper for Arcadia
function gameCrossy(canvas, W) {
  const H = Math.round(W * 1.15);
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  let running = true;
  let lastTime = performance.now();

  const GRID = 36;
  const COLS = Math.floor(W / GRID);
  const ROWS = Math.floor(H / GRID);
  const OFFSET_X = (W - COLS * GRID) / 2;

  let player = {
    gx: Math.floor(COLS / 2),
    gy: 0, // row index from start
    x: 0, y: 0,
    targetX: 0, targetY: 0,
    alive: true,
    hopAnim: 0,
    facing: 'up'
  };

  let cameraY = 0;
  let maxRow = 0;
  let coins = 0;
  let score = 0;
  let lanes = []; // generated terrain rows
  let particles = [];

  // Generate lane types: 'grass', 'road', 'river', 'train'
  function generateLane(row) {
    if (row <= 2) return { row, type: 'grass', items: [] };

    const rand = Math.random();
    if (rand < 0.35) {
      // Road with hovercars
      const speed = (Math.random() < 0.5 ? 1 : -1) * (110 + Math.random() * 120);
      const color = ['#ff4f7b', '#f0c040', '#44aaff', '#ff8c42'][Math.floor(Math.random() * 4)];
      const cars = [];
      const count = 2 + Math.floor(Math.random() * 2);
      const gap = W / count;
      for (let i = 0; i < count; i++) {
        cars.push({ x: i * gap + Math.random() * 40, w: 48, speed, color });
      }
      return { row, type: 'road', cars, speed };
    } else if (rand < 0.65) {
      // River with floating logs
      const speed = (Math.random() < 0.5 ? 1 : -1) * (80 + Math.random() * 70);
      const logs = [];
      const count = 2 + Math.floor(Math.random() * 2);
      const gap = W / count;
      for (let i = 0; i < count; i++) {
        logs.push({ x: i * gap + Math.random() * 30, w: 64, speed });
      }
      return { row, type: 'river', logs, speed };
    } else if (rand < 0.8) {
      // Train track
      return { row, type: 'train', train: { active: false, timer: 1.5 + Math.random() * 2.5, x: -W * 2 } };
    } else {
      // Grass with collectible coins
      const laneCoins = [];
      if (Math.random() < 0.6) {
        laneCoins.push({ gx: Math.floor(Math.random() * COLS), collected: false });
      }
      return { row, type: 'grass', coins: laneCoins };
    }
  }

  // Pre-generate initial lanes
  for (let r = 0; r < 40; r++) {
    lanes.push(generateLane(r));
  }

  function getLane(row) {
    while (lanes.length <= row + 20) {
      lanes.push(generateLane(lanes.length));
    }
    return lanes[row];
  }

  function move(dx, dy) {
    if (!player.alive) return;
    const ngx = player.gx + dx;
    const ngy = player.gy + dy;

    if (ngx < 0 || ngx >= COLS || ngy < 0) return;

    player.gx = ngx;
    player.gy = ngy;
    player.hopAnim = 0.15;

    if (dy > 0) player.facing = 'up';
    else if (dy < 0) player.facing = 'down';
    else if (dx > 0) player.facing = 'right';
    else if (dx < 0) player.facing = 'left';

    if (window.ArcadiaAudio) window.ArcadiaAudio.playJump();

    if (player.gy > maxRow) {
      maxRow = player.gy;
      score = maxRow * 10 + coins * 25;
      setScore(score);
    }
  }

  function onKeyDown(e) {
    if (e.code === 'ArrowUp' || e.code === 'KeyW') { e.preventDefault(); move(0, 1); }
    if (e.code === 'ArrowDown' || e.code === 'KeyS') { e.preventDefault(); move(0, -1); }
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') { e.preventDefault(); move(-1, 0); }
    if (e.code === 'ArrowRight' || e.code === 'KeyD') { e.preventDefault(); move(1, 0); }
  }

  window.addEventListener('keydown', onKeyDown);

  function die(reason = 'CRASHED!') {
    if (!player.alive) return;
    player.alive = false;
    if (window.ArcadiaAudio) window.ArcadiaAudio.playExplosion();

    // Spawn splatter particles
    for (let i = 0; i < 24; i++) {
      particles.push({
        x: player.x, y: player.y,
        vx: (Math.random() - 0.5) * 220,
        vy: (Math.random() - 0.5) * 220,
        color: '#3df5c1', life: 0.5
      });
    }

    setTimeout(() => {
      showGover(reason, score);
    }, 700);
  }

  function update(dt) {
    // Update particles
    particles.forEach(p => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    });
    particles = particles.filter(p => p.life > 0);

    // Smooth camera follow
    const targetCamY = player.gy * GRID - H * 0.45;
    cameraY += (targetCamY - cameraY) * 6 * dt;

    // Player screen position
    player.targetX = OFFSET_X + player.gx * GRID + GRID / 2;
    player.targetY = H - (player.gy * GRID - cameraY) - GRID / 2;

    player.x += (player.targetX - player.x) * 18 * dt;
    player.y += (player.targetY - player.y) * 18 * dt;

    if (player.hopAnim > 0) player.hopAnim -= dt;

    // Check if player fell behind bottom screen
    if (player.targetY > H + 40 && player.alive) {
      die('TRAPPED BY LASER WALL!');
      return;
    }

    // Update Lanes
    const startRow = Math.max(0, Math.floor((cameraY - 100) / GRID));
    const endRow = startRow + ROWS + 4;

    let onLog = false;
    let logSpeed = 0;

    for (let r = startRow; r <= endRow; r++) {
      const lane = getLane(r);
      const laneY = H - (r * GRID - cameraY) - GRID / 2;

      if (lane.type === 'road') {
        lane.cars.forEach(car => {
          car.x += car.speed * dt;
          if (car.speed > 0 && car.x > W + 60) car.x = -60;
          if (car.speed < 0 && car.x < -60) car.x = W + 60;

          // Check hit
          if (player.alive && r === player.gy) {
            if (Math.abs(player.x - (car.x + car.w / 2)) < car.w / 2 + 10) {
              die('HIT BY CYBER CAR!');
            }
          }
        });
      } else if (lane.type === 'river') {
        let inWater = (r === player.gy);
        lane.logs.forEach(log => {
          log.x += log.speed * dt;
          if (log.speed > 0 && log.x > W + 80) log.x = -80;
          if (log.speed < 0 && log.x < -80) log.x = W + 80;

          if (r === player.gy && player.alive) {
            if (player.x > log.x && player.x < log.x + log.w) {
              onLog = true;
              logSpeed = log.speed;
              inWater = false;
            }
          }
        });

        if (inWater && !onLog && player.alive) {
          die('DROWNED IN CYBER RIVER!');
        }
      } else if (lane.type === 'train') {
        const tr = lane.train;
        tr.timer -= dt;
        if (tr.timer <= 0 && !tr.active) {
          tr.active = true;
          tr.x = -W * 1.5;
        }
        if (tr.active) {
          tr.x += 1400 * dt;
          if (r === player.gy && player.alive) {
            if (player.x > tr.x && player.x < tr.x + W * 1.8) {
              die('OBLITERATED BY BULLET TRAIN!');
            }
          }
          if (tr.x > W * 2) {
            tr.active = false;
            tr.timer = 2.5 + Math.random() * 3.5;
          }
        }
      } else if (lane.type === 'grass' && lane.coins) {
        lane.coins.forEach(c => {
          if (!c.collected && r === player.gy && c.gx === player.gx && player.alive) {
            c.collected = true;
            coins++;
            score += 25;
            setScore(score);
            if (window.ArcadiaAudio) window.ArcadiaAudio.playCoin();
          }
        });
      }
    }

    // Ride log speed
    if (onLog && player.alive) {
      player.x += logSpeed * dt;
      player.gx = Math.max(0, Math.min(COLS - 1, Math.floor((player.x - OFFSET_X) / GRID)));
    }
  }

  function render() {
    ctx.fillStyle = '#080512';
    ctx.fillRect(0, 0, W, H);

    const startRow = Math.max(0, Math.floor((cameraY - 100) / GRID));
    const endRow = startRow + ROWS + 4;

    // Render Lanes
    for (let r = startRow; r <= endRow; r++) {
      const lane = getLane(r);
      const laneY = H - (r * GRID - cameraY) - GRID;

      if (lane.type === 'grass') {
        ctx.fillStyle = r % 2 === 0 ? '#111e18' : '#0e1814';
        ctx.fillRect(0, laneY, W, GRID);
        // Coins
        if (lane.coins) {
          lane.coins.forEach(c => {
            if (!c.collected) {
              const cx = OFFSET_X + c.gx * GRID + GRID / 2;
              const cy = laneY + GRID / 2;
              ctx.fillStyle = '#f0c040';
              ctx.beginPath(); ctx.arc(cx, cy, 7, 0, Math.PI * 2); ctx.fill();
              ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
            }
          });
        }
      } else if (lane.type === 'road') {
        ctx.fillStyle = '#120f20';
        ctx.fillRect(0, laneY, W, GRID);
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.setLineDash([8, 8]);
        ctx.beginPath(); ctx.moveTo(0, laneY + GRID / 2); ctx.lineTo(W, laneY + GRID / 2); ctx.stroke();
        ctx.setLineDash([]);

        // Render Cars
        lane.cars.forEach(car => {
          ctx.fillStyle = car.color;
          ctx.fillRect(car.x, laneY + 6, car.w, GRID - 12);
          ctx.fillStyle = '#000';
          ctx.fillRect(car.x + (car.speed > 0 ? car.w - 12 : 4), laneY + 8, 8, GRID - 16);
          // Headlights
          ctx.fillStyle = '#fff';
          const hx = car.speed > 0 ? car.x + car.w : car.x - 4;
          ctx.fillRect(hx, laneY + 8, 4, 4);
          ctx.fillRect(hx, laneY + GRID - 12, 4, 4);
        });
      } else if (lane.type === 'river') {
        ctx.fillStyle = '#0a1a36';
        ctx.fillRect(0, laneY, W, GRID);
        // Render Logs
        lane.logs.forEach(log => {
          ctx.fillStyle = '#4a2c14';
          ctx.fillRect(log.x, laneY + 4, log.w, GRID - 8);
          ctx.strokeStyle = '#3df5c1';
          ctx.lineWidth = 2;
          ctx.strokeRect(log.x, laneY + 4, log.w, GRID - 8);
        });
      } else if (lane.type === 'train') {
        ctx.fillStyle = '#1f1322';
        ctx.fillRect(0, laneY, W, GRID);
        ctx.strokeStyle = '#ff4f7b';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, laneY + 8); ctx.lineTo(W, laneY + 8); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, laneY + GRID - 8); ctx.lineTo(W, laneY + GRID - 8); ctx.stroke();

        // Warning light
        if (lane.train.timer < 1.2) {
          ctx.fillStyle = Math.floor(Date.now() / 150) % 2 === 0 ? '#ff2255' : '#440011';
          ctx.beginPath(); ctx.arc(20, laneY + GRID / 2, 6, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(W - 20, laneY + GRID / 2, 6, 0, Math.PI * 2); ctx.fill();
        }

        if (lane.train.active) {
          ctx.fillStyle = '#ff2255';
          ctx.fillRect(lane.train.x, laneY + 4, W * 1.8, GRID - 8);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(lane.train.x + W * 1.8 - 20, laneY + 8, 16, GRID - 16);
        }
      }
    }

    // Particles
    particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, 4, 4);
    });

    // Render Player Hopper
    if (player.alive) {
      const hopOffset = player.hopAnim > 0 ? -10 * Math.sin((player.hopAnim / 0.15) * Math.PI) : 0;
      const px = player.x;
      const py = player.y + hopOffset;

      ctx.fillStyle = '#3df5c1';
      ctx.beginPath();
      ctx.arc(px, py, GRID * 0.38, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Eyes
      ctx.fillStyle = '#06040e';
      ctx.fillRect(px - 4, py - 6, 3, 3);
      ctx.fillRect(px + 2, py - 6, 3, 3);
    }

    // Top HUD
    ctx.fillStyle = 'rgba(6,4,14,0.85)';
    ctx.fillRect(0, 0, W, 28);
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillStyle = '#f0c040';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${score}`, 12, 18);
    ctx.fillStyle = '#3df5c1';
    ctx.textAlign = 'right';
    ctx.fillText(`ROW: ${maxRow}`, W - 12, 18);
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
