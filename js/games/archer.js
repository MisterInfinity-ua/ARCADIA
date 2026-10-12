// Cyber Archer / Ballistic Bow Duel for Arcadia
function gameArcher(canvas, W) {
  const H = Math.round(W * 0.7);
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  let running = true;
  let lastTime = performance.now();

  let player = {
    x: 80, y: H - 120,
    hp: 100, maxHp: 100,
    alive: true,
    angle: -0.4,
    power: 0,
    aiming: false
  };

  let enemy = {
    x: W - 80, y: H - 120,
    hp: 100, maxHp: 100,
    alive: true,
    angle: -Math.PI + 0.4,
    timer: 2.0
  };

  let arrows = []; // { x, y, vx, vy, isPlayer, stuck }
  let wind = (Math.random() - 0.5) * 60;
  let score = 0;
  let streak = 0;
  let particles = [];
  let dragStart = null;

  function onMouseDown(e) {
    if (!player.alive) return;
    const rect = canvas.getBoundingClientRect();
    dragStart = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    player.aiming = true;
  }

  function onMouseMove(e) {
    if (!player.aiming || !dragStart) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const dx = dragStart.x - mx;
    const dy = dragStart.y - my;
    player.angle = Math.atan2(dy, dx);
    player.power = Math.min(750, Math.hypot(dx, dy) * 4.5);
  }

  function onMouseUp() {
    if (!player.aiming || !player.alive) return;
    player.aiming = false;

    if (player.power > 50) {
      arrows.push({
        x: player.x + 20, y: player.y - 20,
        vx: Math.cos(player.angle) * player.power,
        vy: Math.sin(player.angle) * player.power,
        isPlayer: true
      });
      if (window.ArcadiaAudio) window.ArcadiaAudio.playLaser();
    }
    dragStart = null;
  }

  canvas.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);

  function spawnNewEnemy() {
    enemy.x = W * 0.6 + Math.random() * (W * 0.3);
    enemy.hp = 100;
    enemy.alive = true;
    enemy.timer = 1.8 + Math.random() * 1.2;
    wind = (Math.random() - 0.5) * 80;
  }

  function enemyShoot() {
    if (!enemy.alive || !player.alive) return;
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const dist = Math.hypot(dx, dy);

    // AI calculations with slight error
    const err = (Math.random() - 0.5) * 0.15;
    const angle = -Math.PI * 0.75 + err;
    const spd = dist * 1.1 + Math.random() * 50;

    arrows.push({
      x: enemy.x - 20, y: enemy.y - 20,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd,
      isPlayer: false
    });
    if (window.ArcadiaAudio) window.ArcadiaAudio.playHit();
  }

  function update(dt) {
    // Enemy AI timer
    if (enemy.alive) {
      enemy.timer -= dt;
      if (enemy.timer <= 0) {
        enemy.timer = 2.4 + Math.random() * 1.5;
        enemyShoot();
      }
    }

    // Update Particles
    particles.forEach(p => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    });
    particles = particles.filter(p => p.life > 0);

    // Update Arrows
    arrows.forEach(a => {
      if (a.stuck) return;

      a.vx += wind * dt;
      a.vy += 600 * dt; // gravity
      a.x += a.vx * dt;
      a.y += a.vy * dt;

      // Ground hit
      if (a.y > H - 40) {
        a.y = H - 40;
        a.stuck = true;
      }

      // Check Enemy Hit
      if (a.isPlayer && enemy.alive) {
        const headDist = Math.hypot(a.x - enemy.x, a.y - (enemy.y - 45));
        const bodyDist = Math.hypot(a.x - enemy.x, a.y - (enemy.y - 15));

        if (headDist < 16) {
          // Headshot!
          a.stuck = true;
          enemy.hp -= 100;
          score += 300;
          setScore(score);
          if (window.ArcadiaAudio) window.ArcadiaAudio.playPowerup();
        } else if (bodyDist < 24) {
          // Body hit
          a.stuck = true;
          enemy.hp -= 45;
          score += 100;
          setScore(score);
          if (window.ArcadiaAudio) window.ArcadiaAudio.playHit();
        }

        if (enemy.hp <= 0 && enemy.alive) {
          enemy.alive = false;
          streak++;
          if (window.ArcadiaAudio) window.ArcadiaAudio.playCoin();
          setTimeout(spawnNewEnemy, 1200);
        }
      }

      // Check Player Hit
      if (!a.isPlayer && player.alive) {
        const pHeadDist = Math.hypot(a.x - player.x, a.y - (player.y - 45));
        const pBodyDist = Math.hypot(a.x - player.x, a.y - (player.y - 15));

        if (pHeadDist < 16 || pBodyDist < 24) {
          a.stuck = true;
          player.hp = Math.max(0, player.hp - 35);
          if (window.ArcadiaAudio) window.ArcadiaAudio.playHit();

          if (player.hp <= 0 && player.alive) {
            player.alive = false;
            if (window.ArcadiaAudio) window.ArcadiaAudio.playGameOver();
            setTimeout(() => {
              showGover('DEFEATED IN DUEL!', score);
            }, 600);
          }
        }
      }
    });

    arrows = arrows.filter(a => a.x > -50 && a.x < W + 50 && a.y < H + 50);
  }

  function renderStickman(x, y, color, angle, hp) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;

    // Head
    ctx.beginPath(); ctx.arc(x, y - 45, 12, 0, Math.PI * 2); ctx.stroke();
    // Spine
    ctx.beginPath(); ctx.moveTo(x, y - 33); ctx.lineTo(x, y - 10); ctx.stroke();
    // Legs
    ctx.beginPath(); ctx.moveTo(x, y - 10); ctx.lineTo(x - 12, y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y - 10); ctx.lineTo(x + 12, y); ctx.stroke();
    // Bow Arm
    const bowX = x + Math.cos(angle) * 18;
    const bowY = y - 25 + Math.sin(angle) * 18;
    ctx.beginPath(); ctx.moveTo(x, y - 25); ctx.lineTo(bowX, bowY); ctx.stroke();

    // Bow Arc
    ctx.strokeStyle = '#f0c040';
    ctx.beginPath();
    ctx.arc(bowX, bowY, 14, angle - 1.2, angle + 1.2);
    ctx.stroke();

    // Health Bar
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(x - 25, y - 70, 50, 6);
    ctx.fillStyle = color;
    ctx.fillRect(x - 25, y - 70, 50 * Math.max(0, hp / 100), 6);
  }

  function render() {
    ctx.fillStyle = '#080512';
    ctx.fillRect(0, 0, W, H);

    // Ground
    ctx.fillStyle = '#100c24';
    ctx.fillRect(0, H - 40, W, 40);
    ctx.strokeStyle = '#3df5c1';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, H - 40); ctx.lineTo(W, H - 40); ctx.stroke();

    // Stickmen
    if (player.alive) renderStickman(player.x, player.y, '#3df5c1', player.angle, player.hp);
    if (enemy.alive) renderStickman(enemy.x, enemy.y, '#ff4f7b', enemy.angle, enemy.hp);

    // Trajectory Guide (when aiming)
    if (player.aiming && player.power > 50) {
      ctx.strokeStyle = 'rgba(240,192,64,0.4)';
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      let tx = player.x + 20, ty = player.y - 20;
      let tvx = Math.cos(player.angle) * player.power;
      let tvy = Math.sin(player.angle) * player.power;
      ctx.moveTo(tx, ty);
      for (let i = 0; i < 20; i++) {
        tvx += wind * 0.05;
        tvy += 600 * 0.05;
        tx += tvx * 0.05;
        ty += tvy * 0.05;
        ctx.lineTo(tx, ty);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Arrows
    arrows.forEach(a => {
      ctx.strokeStyle = a.isPlayer ? '#3df5c1' : '#ff4f7b';
      ctx.lineWidth = 2;
      const angle = Math.atan2(a.vy, a.vx);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(a.x - Math.cos(angle) * 22, a.y - Math.sin(angle) * 22);
      ctx.stroke();
    });

    // Top HUD
    ctx.fillStyle = '#f0c040';
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${score}`, 20, 24);

    ctx.fillStyle = '#3df5c1';
    ctx.textAlign = 'center';
    const windStr = wind > 0 ? `WIND: ➔ ${Math.round(Math.abs(wind))}` : `WIND: ⬅ ${Math.round(Math.abs(wind))}`;
    ctx.fillText(windStr, W / 2, 24);

    ctx.fillStyle = '#ff4f7b';
    ctx.textAlign = 'right';
    ctx.fillText(`KILLS: ${streak}`, W - 20, 24);
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
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    }
  };
}
