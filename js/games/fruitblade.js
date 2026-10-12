// Fruit Blade / Ninja Slicer for Arcadia
function gameFruitBlade(canvas, W) {
  const H = Math.round(W * 0.72);
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  let running = true;
  let lastTime = performance.now();

  let score = 0;
  let lives = 3;
  let slicedCount = 0;
  let bladeTrail = []; // { x, y, life }
  let fruits = []; // { x, y, vx, vy, rot, vrot, r, type, sliced, halves, color }
  let particles = [];
  let isMouseDown = false;

  const FRUIT_TYPES = [
    { name: 'Watermelon', color: '#ff4f7b', inner: '#2ecc71', r: 32, points: 10, icon: '🍉' },
    { name: 'Orange', color: '#ff8c42', inner: '#ffd166', r: 26, points: 15, icon: '🍊' },
    { name: 'Banana', color: '#f0c040', inner: '#ffffff', r: 24, points: 15, icon: '🍌' },
    { name: 'Strawberry', color: '#ff2255', inner: '#ff99aa', r: 22, points: 20, icon: '🍓' },
    { name: 'Pineapple', color: '#f0a500', inner: '#ffea75', r: 34, points: 25, icon: '🍍' },
    { name: 'Bomb', color: '#111122', inner: '#ff2255', r: 28, isBomb: true, icon: '💣' }
  ];

  function spawnWave() {
    if (!running) return;
    const count = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const type = (Math.random() < 0.18) ? FRUIT_TYPES[5] : FRUIT_TYPES[Math.floor(Math.random() * 5)];
      const x = W * 0.15 + Math.random() * (W * 0.7);
      const vx = (Math.random() - 0.5) * 160;
      const vy = -520 - Math.random() * 180;

      fruits.push({
        x, y: H + 30,
        vx, vy,
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 6,
        r: type.r,
        type,
        sliced: false
      });
    }

    const nextDelay = 1200 + Math.random() * 1500;
    setTimeout(spawnWave, nextDelay);
  }
  spawnWave();

  function onMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    bladeTrail.push({ x: mx, y: my, life: 0.2 });

    // Check slice collision with fruits
    if (bladeTrail.length >= 2) {
      const p1 = bladeTrail[bladeTrail.length - 2];
      const p2 = bladeTrail[bladeTrail.length - 1];

      let comboSlice = 0;

      fruits.forEach(f => {
        if (f.sliced) return;
        const d = distToSegment({ x: f.x, y: f.y }, p1, p2);
        if (d < f.r) {
          f.sliced = true;
          if (f.type.isBomb) {
            // Bomb hit!
            if (window.ArcadiaAudio) window.ArcadiaAudio.playExplosion();
            lives = 0;
            showGover('HIT A BOMB! GAME OVER', score);
            running = false;
          } else {
            // Fruit sliced!
            comboSlice++;
            slicedCount++;
            score += f.type.points;
            setScore(score);

            if (window.ArcadiaPassport && slicedCount >= 50) {
              window.ArcadiaPassport.unlock('fruit_slicer');
            }
            if (window.ArcadiaAudio) window.ArcadiaAudio.playScore();

            // Juice splatters
            for (let i = 0; i < 18; i++) {
              particles.push({
                x: f.x, y: f.y,
                vx: (Math.random() - 0.5) * 350,
                vy: (Math.random() - 0.5) * 350,
                color: f.type.color,
                r: Math.random() * 6 + 2,
                life: 0.6 + Math.random() * 0.4
              });
            }

            // Halves
            f.half1 = { x: f.x - 8, y: f.y, vx: f.vx - 80, vy: f.vy - 40, rot: f.rot, vrot: -4 };
            f.half2 = { x: f.x + 8, y: f.y, vx: f.vx + 80, vy: f.vy - 40, rot: f.rot, vrot: 4 };
          }
        }
      });

      if (comboSlice > 1 && window.ArcadiaAudio) {
        window.ArcadiaAudio.playCombo();
      }
    }
  }

  function distToSegment(p, v, w) {
    const l2 = (v.x - w.x)**2 + (v.y - w.y)**2;
    if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
    let t = ((p.x - v.x)*(w.x - v.x) + (p.y - v.y)*(w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p.x - (v.x + t*(w.x - v.x)), p.y - (v.y + t*(w.y - v.y)));
  }

  canvas.addEventListener('mousemove', onMouseMove);

  function update(dt) {
    // Update blade trail
    bladeTrail.forEach(t => t.life -= dt);
    bladeTrail = bladeTrail.filter(t => t.life > 0);

    // Update particles
    particles.forEach(p => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 800 * dt;
      p.life -= dt;
    });
    particles = particles.filter(p => p.life > 0);

    // Update Fruits
    fruits.forEach(f => {
      if (!f.sliced) {
        f.x += f.vx * dt;
        f.y += f.vy * dt;
        f.vy += 650 * dt; // gravity
        f.rot += f.vrot * dt;

        if (f.y > H + 50 && f.vy > 0 && !f.type.isBomb) {
          f.dead = true;
          lives--;
          if (window.ArcadiaAudio) window.ArcadiaAudio.playHit();
          if (lives <= 0) {
            lives = 0;
            if (window.ArcadiaAudio) window.ArcadiaAudio.playGameOver();
            showGover('MISSED 3 FRUITS! GAME OVER', score);
            running = false;
          }
        }
      } else if (f.half1 && f.half2) {
        f.half1.x += f.half1.vx * dt; f.half1.y += f.half1.vy * dt; f.half1.vy += 750 * dt; f.half1.rot += f.half1.vrot * dt;
        f.half2.x += f.half2.vx * dt; f.half2.y += f.half2.vy * dt; f.half2.vy += 750 * dt; f.half2.rot += f.half2.vrot * dt;
        if (f.half1.y > H + 80 && f.half2.y > H + 80) f.dead = true;
      }
    });

    fruits = fruits.filter(f => !f.dead);
  }

  function render() {
    ctx.fillStyle = '#080512';
    ctx.fillRect(0, 0, W, H);

    // Juice Splatters on board
    particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Render Fruits
    fruits.forEach(f => {
      if (!f.sliced) {
        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.rotate(f.rot);

        ctx.font = `${f.r * 1.8}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(f.type.icon, 0, 0);

        ctx.restore();
      } else if (f.half1 && f.half2) {
        // Draw halves
        [f.half1, f.half2].forEach(h => {
          ctx.save();
          ctx.translate(h.x, h.y);
          ctx.rotate(h.rot);

          ctx.fillStyle = f.type.color;
          ctx.beginPath();
          ctx.arc(0, 0, f.r * 0.8, 0, Math.PI);
          ctx.fill();

          ctx.restore();
        });
      }
    });

    // Blade Slash Trail
    if (bladeTrail.length >= 2) {
      ctx.strokeStyle = '#3df5c1';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(bladeTrail[0].x, bladeTrail[0].y);
      for (let i = 1; i < bladeTrail.length; i++) {
        ctx.lineTo(bladeTrail[i].x, bladeTrail[i].y);
      }
      ctx.stroke();

      // White inner core
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Top HUD
    ctx.fillStyle = '#f0c040';
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${score}`, 16, 28);

    ctx.fillStyle = '#ff4f7b';
    ctx.textAlign = 'right';
    let heartStr = '';
    for (let i = 0; i < lives; i++) heartStr += '❤️ ';
    ctx.fillText(heartStr || '💀', W - 16, 28);
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
      canvas.removeEventListener('mousemove', onMouseMove);
    }
  };
}
