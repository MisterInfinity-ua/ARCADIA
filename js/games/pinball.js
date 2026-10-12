// Cyber Pinball 2D Physics Table for Arcadia
function gamePinball(canvas, W) {
  const H = Math.round(W * 1.35);
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  let running = true;
  let lastTime = performance.now();

  let score = 0;
  let ballsLeft = 3;
  let multiplier = 1;

  // Pinball Physics State
  let ball = {
    x: W - 28, y: H - 120,
    vx: 0, vy: -600,
    r: 9,
    active: true,
    trail: []
  };

  // Flippers
  const FLIP_Y = H - 80;
  const FLIP_LEN = 65;
  let leftFlipper = {
    x: W * 0.3, y: FLIP_Y,
    angle: 0.4, restAngle: 0.4, activeAngle: -0.55,
    active: false
  };
  let rightFlipper = {
    x: W * 0.7, y: FLIP_Y,
    angle: -0.4, restAngle: -0.4, activeAngle: 0.55,
    active: false
  };

  // Bumpers
  const BUMPERS = [
    { x: W * 0.35, y: H * 0.28, r: 24, pts: 100, color: '#ff4f7b', hit: 0 },
    { x: W * 0.65, y: H * 0.28, r: 24, pts: 100, color: '#3df5c1', hit: 0 },
    { x: W * 0.5, y: H * 0.42, r: 28, pts: 250, color: '#f0c040', hit: 0 }
  ];

  let particles = [];

  function onKeyDown(e) {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') leftFlipper.active = true;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') rightFlipper.active = true;
    if (e.code === 'Space' || e.code === 'ArrowDown') {
      if (!ball.active && ballsLeft > 0) launchBall();
    }
  }
  function onKeyUp(e) {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') leftFlipper.active = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') rightFlipper.active = false;
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  function launchBall() {
    ball.x = W - 28;
    ball.y = H - 100;
    ball.vx = (Math.random() - 0.5) * 40;
    ball.vy = -750;
    ball.active = true;
    if (window.ArcadiaAudio) window.ArcadiaAudio.playJump();
  }

  function update(dt) {
    // Update Flipper Angles
    const flipSpd = 18.0;
    const lTarget = leftFlipper.active ? leftFlipper.activeAngle : leftFlipper.restAngle;
    leftFlipper.angle += (lTarget - leftFlipper.angle) * flipSpd * dt;

    const rTarget = rightFlipper.active ? rightFlipper.activeAngle : rightFlipper.restAngle;
    rightFlipper.angle += (rTarget - rightFlipper.angle) * flipSpd * dt;

    // Bumpers hit flash timer
    BUMPERS.forEach(b => { if (b.hit > 0) b.hit -= dt; });

    // Update Particles
    particles.forEach(p => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    });
    particles = particles.filter(p => p.life > 0);

    if (!ball.active) return;

    // Ball Gravity & Velocity
    ball.vy += 700 * dt;
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;

    // Ball trail
    ball.trail.push({ x: ball.x, y: ball.y, life: 0.15 });
    ball.trail.forEach(t => t.life -= dt);
    ball.trail = ball.trail.filter(t => t.life > 0);

    // Wall Collisions
    const L_WALL = 20;
    const R_WALL = W - 20;
    const T_WALL = 30;

    if (ball.x - ball.r < L_WALL) { ball.x = L_WALL + ball.r; ball.vx = Math.abs(ball.vx) * 0.8; }
    if (ball.x + ball.r > R_WALL) { ball.x = R_WALL - ball.r; ball.vx = -Math.abs(ball.vx) * 0.8; }
    if (ball.y - ball.r < T_WALL) { ball.y = T_WALL + ball.r; ball.vy = Math.abs(ball.vy) * 0.8; }

    // Bumper Collisions
    BUMPERS.forEach(b => {
      const dx = ball.x - b.x;
      const dy = ball.y - b.y;
      const dist = Math.hypot(dx, dy);
      if (dist < ball.r + b.r) {
        // Bounce off bumper
        const nx = dx / dist;
        const ny = dy / dist;
        const bounceSpd = 550;
        ball.vx = nx * bounceSpd;
        ball.vy = ny * bounceSpd;
        b.hit = 0.25;

        score += b.pts * multiplier;
        setScore(score);
        if (window.ArcadiaPassport && score >= 10000) {
          window.ArcadiaPassport.unlock('pinball_wizard');
        }
        if (window.ArcadiaAudio) window.ArcadiaAudio.playCoin();

        // Particles
        for (let i = 0; i < 12; i++) {
          particles.push({
            x: b.x, y: b.y,
            vx: (Math.random() - 0.5) * 200,
            vy: (Math.random() - 0.5) * 200,
            color: b.color, life: 0.35
          });
        }
      }
    });

    // Flipper Collisions
    // Left Flipper Line Segment
    const lfEndX = leftFlipper.x + Math.cos(leftFlipper.angle) * FLIP_LEN;
    const lfEndY = leftFlipper.y + Math.sin(leftFlipper.angle) * FLIP_LEN;
    checkFlipperHit(leftFlipper.x, leftFlipper.y, lfEndX, lfEndY, leftFlipper.active);

    // Right Flipper Line Segment
    const rfEndX = rightFlipper.x - Math.cos(-rightFlipper.angle) * FLIP_LEN;
    const rfEndY = rightFlipper.y + Math.sin(-rightFlipper.angle) * FLIP_LEN;
    checkFlipperHit(rightFlipper.x, rightFlipper.y, rfEndX, rfEndY, rightFlipper.active);

    // Ball Drain (Bottom)
    if (ball.y > H + 40) {
      ball.active = false;
      ballsLeft--;
      if (window.ArcadiaAudio) window.ArcadiaAudio.playHit();

      if (ballsLeft > 0) {
        setTimeout(launchBall, 1000);
      } else {
        if (window.ArcadiaAudio) window.ArcadiaAudio.playGameOver();
        showGover('GAME OVER', score);
        running = false;
      }
    }
  }

  function checkFlipperHit(x1, y1, x2, y2, isActive) {
    const l2 = (x2 - x1)**2 + (y2 - y1)**2;
    if (l2 === 0) return;
    let t = ((ball.x - x1)*(x2 - x1) + (ball.y - y1)*(y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    const px = x1 + t * (x2 - x1);
    const py = y1 + t * (y2 - y1);
    const dist = Math.hypot(ball.x - px, ball.y - py);

    if (dist < ball.r + 8) {
      // Normal vector
      const nx = -(y2 - y1) / Math.sqrt(l2);
      const ny = (x2 - x1) / Math.sqrt(l2);

      const hitSpd = isActive ? -650 : -350;
      ball.vy = hitSpd;
      ball.vx += nx * 200;
      if (window.ArcadiaAudio) window.ArcadiaAudio.playHit();
    }
  }

  function render() {
    ctx.fillStyle = '#0a0818';
    ctx.fillRect(0, 0, W, H);

    // Pinball Table Outer Border
    ctx.strokeStyle = '#44aaff';
    ctx.lineWidth = 4;
    ctx.strokeRect(16, 26, W - 32, H - 40);

    // Bumpers
    BUMPERS.forEach(b => {
      ctx.fillStyle = b.hit > 0 ? '#ffffff' : b.color;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.fillStyle = '#06040e';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r * 0.4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Flippers
    // Left Flipper
    const lfEndX = leftFlipper.x + Math.cos(leftFlipper.angle) * FLIP_LEN;
    const lfEndY = leftFlipper.y + Math.sin(leftFlipper.angle) * FLIP_LEN;
    ctx.strokeStyle = '#ff4f7b';
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(leftFlipper.x, leftFlipper.y);
    ctx.lineTo(lfEndX, lfEndY);
    ctx.stroke();

    // Right Flipper
    const rfEndX = rightFlipper.x - Math.cos(-rightFlipper.angle) * FLIP_LEN;
    const rfEndY = rightFlipper.y + Math.sin(-rightFlipper.angle) * FLIP_LEN;
    ctx.strokeStyle = '#ff4f7b';
    ctx.beginPath();
    ctx.moveTo(rightFlipper.x, rightFlipper.y);
    ctx.lineTo(rfEndX, rfEndY);
    ctx.stroke();

    // Particles
    particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, 4, 4);
    });

    // Ball Trail
    ball.trail.forEach(t => {
      ctx.fillStyle = 'rgba(61, 245, 193, 0.3)';
      ctx.beginPath();
      ctx.arc(t.x, t.y, ball.r * 0.7, 0, Math.PI * 2);
      ctx.fill();
    });

    // Ball
    if (ball.active) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#3df5c1';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Top HUD
    ctx.fillStyle = '#f0c040';
    ctx.font = '11px "Press Start 2P", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${score}`, 24, 20);

    ctx.fillStyle = '#ff4f7b';
    ctx.textAlign = 'right';
    let ballStr = '';
    for (let i = 0; i < ballsLeft; i++) ballStr += '⚪ ';
    ctx.fillText(ballStr || 'LAST BALL', W - 24, 20);
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
