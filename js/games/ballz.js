// Ballz Physics Stream Breaker for Arcadia
function gameBallz(canvas, W) {
  const H = Math.round(W * 1.3);
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  let running = true;
  let lastTime = performance.now();

  const COLS = 7;
  const CELL = (W - 30) / COLS;
  const BX = 15, BY = 60;

  let totalBalls = 20;
  let ballsInFlight = [];
  let nextVolleyBalls = 20;
  let launchX = W / 2;
  let newLaunchX = W / 2;
  let isAiming = false;
  let aimAngle = -Math.PI / 2;
  let state = 'aiming'; // 'aiming', 'firing', 'collecting'
  let score = 0;
  let level = 1;

  let bricks = []; // { r, c, count, maxCount, isBonus }

  function spawnRow() {
    // Shift existing bricks down
    bricks.forEach(b => b.r++);

    // Check game over
    if (bricks.some(b => b.r >= 9 && !b.isBonus)) {
      if (window.ArcadiaAudio) window.ArcadiaAudio.playGameOver();
      showGover('BRICKS REACHED BOTTOM!', score);
      state = 'gameover';
      return;
    }

    // Spawn new top row
    for (let c = 0; c < COLS; c++) {
      if (Math.random() < 0.5) {
        const isBonus = Math.random() < 0.2;
        bricks.push({
          r: 0, c,
          count: isBonus ? 1 : level * 2,
          maxCount: isBonus ? 1 : level * 2,
          isBonus
        });
      }
    }
  }

  spawnRow();

  function fireBalls() {
    if (state !== 'aiming') return;
    state = 'firing';
    ballsInFlight = [];
    newLaunchX = null;

    let fired = 0;
    const interval = setInterval(() => {
      if (!running || state === 'gameover') { clearInterval(interval); return; }
      if (fired >= totalBalls) { clearInterval(interval); return; }

      const spd = 650;
      ballsInFlight.push({
        x: launchX, y: H - 35,
        vx: Math.cos(aimAngle) * spd,
        vy: Math.sin(aimAngle) * spd,
        active: true
      });
      fired++;
      if (window.ArcadiaAudio && fired % 3 === 0) window.ArcadiaAudio.playTone(800, 0.02, 'sine', 0.1);
    }, 45);
  }

  function onMouseDown(e) {
    if (state !== 'aiming') return;
    isAiming = true;
    updateAim(e);
  }

  function onMouseMove(e) {
    if (isAiming) updateAim(e);
  }

  function onMouseUp() {
    if (isAiming) {
      isAiming = false;
      fireBalls();
    }
  }

  function updateAim(e) {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const dx = mx - launchX;
    const dy = my - (H - 35);
    let ang = Math.atan2(dy, dx);
    if (ang > -0.15) ang = -0.15;
    if (ang < -Math.PI + 0.15) ang = -Math.PI + 0.15;
    aimAngle = ang;
  }

  canvas.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);

  function update(dt) {
    if (state === 'firing') {
      let activeCount = 0;

      ballsInFlight.forEach(b => {
        if (!b.active) return;
        activeCount++;

        b.x += b.vx * dt;
        b.y += b.vy * dt;

        // Walls
        if (b.x < 10) { b.x = 10; b.vx = Math.abs(b.vx); }
        if (b.x > W - 10) { b.x = W - 10; b.vx = -Math.abs(b.vx); }
        if (b.y < BY) { b.y = BY; b.vy = Math.abs(b.vy); }

        // Floor (Collect ball)
        if (b.y > H - 35) {
          b.active = false;
          if (newLaunchX === null) newLaunchX = b.x;
        }

        // Brick Collisions
        bricks.forEach(br => {
          if (br.count <= 0) return;
          const bx = BX + br.c * CELL;
          const by = BY + br.r * CELL;

          if (b.x > bx && b.x < bx + CELL && b.y > by && b.y < by + CELL) {
            if (br.isBonus) {
              br.count = 0;
              nextVolleyBalls++;
              if (window.ArcadiaAudio) window.ArcadiaAudio.playCoin();
            } else {
              br.count--;
              score += 10;
              setScore(score);
              b.vy *= -1; // bounce
              if (window.ArcadiaAudio) window.ArcadiaAudio.playHit();
            }
          }
        });
      });

      bricks = bricks.filter(b => b.count > 0);

      // Check if all balls landed
      if (activeCount === 0 && ballsInFlight.length >= totalBalls) {
        state = 'aiming';
        totalBalls = nextVolleyBalls;
        if (newLaunchX !== null) launchX = newLaunchX;
        level++;
        spawnRow();
      }
    }
  }

  function render() {
    ctx.fillStyle = '#080512';
    ctx.fillRect(0, 0, W, H);

    // Aim Trajectory Line
    if (state === 'aiming') {
      ctx.strokeStyle = 'rgba(61,245,193,0.4)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(launchX, H - 35);
      ctx.lineTo(launchX + Math.cos(aimAngle) * 350, H - 35 + Math.sin(aimAngle) * 350);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Bricks
    bricks.forEach(b => {
      const bx = BX + b.c * CELL;
      const by = BY + b.r * CELL;

      if (b.isBonus) {
        ctx.fillStyle = '#f0c040';
        ctx.beginPath(); ctx.arc(bx + CELL / 2, by + CELL / 2, 8, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
      } else {
        const pct = b.count / b.maxCount;
        ctx.fillStyle = pct > 0.6 ? '#ff2255' : pct > 0.3 ? '#ff8c42' : '#3df5c1';
        ctx.fillRect(bx + 2, by + 2, CELL - 4, CELL - 4);
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.strokeRect(bx + 2, by + 2, CELL - 4, CELL - 4);

        ctx.fillStyle = '#06040e';
        ctx.font = 'bold 15px "Rajdhani"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(b.count, bx + CELL / 2, by + CELL / 2);
      }
    });

    // Balls
    ballsInFlight.forEach(b => {
      if (!b.active) return;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(b.x, b.y, 5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#3df5c1'; ctx.lineWidth = 1; ctx.stroke();
    });

    // Launcher Base
    ctx.fillStyle = '#3df5c1';
    ctx.beginPath(); ctx.arc(launchX, H - 35, 8, 0, Math.PI * 2); ctx.fill();

    // Top HUD
    ctx.fillStyle = '#f0c040';
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${score}`, 16, 28);
    ctx.fillStyle = '#3df5c1';
    ctx.textAlign = 'right';
    ctx.fillText(`BALLS: x${totalBalls}`, W - 16, 28);
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
