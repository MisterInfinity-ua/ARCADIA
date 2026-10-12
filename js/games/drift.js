// Retro Drift / Cyber Racing 2D for Arcadia
function gameDrift(canvas, W) {
  const H = Math.round(W * 0.7);
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  let running = true;
  let lastTime = performance.now();

  // Car Physics
  let car = {
    x: 120, y: H / 2 + 70,
    vx: 0, vy: 0,
    angle: 0,
    speed: 0,
    driftScore: 0,
    nitro: 100,
    lap: 1, maxLaps: 3,
    checkpoint: 0,
    lapStart: performance.now(),
    bestLap: null,
    tireMarks: [],
    particles: []
  };

  // AI Opponents
  let rivals = [
    { x: 100, y: H / 2 + 50, angle: 0, speed: 180, color: '#ff4f7b', cp: 0, lap: 1 },
    { x: 140, y: H / 2 + 90, angle: 0, speed: 170, color: '#f0c040', cp: 0, lap: 1 }
  ];

  // Track Path (Circuit Waypoints)
  const WAYPOINTS = [
    { x: 120, y: H / 2 + 70 },
    { x: W - 140, y: H / 2 + 70 },
    { x: W - 100, y: H / 2 },
    { x: W - 140, y: 100 },
    { x: W / 2, y: 80 },
    { x: 140, y: 100 },
    { x: 100, y: H / 2 }
  ];

  let keys = {};
  function onKeyDown(e) { keys[e.code] = true; }
  function onKeyUp(e) { keys[e.code] = false; }
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  function update(dt) {
    // Car input
    const maxSpeed = keys['ShiftLeft'] && car.nitro > 0 ? 320 : 220;
    const accel = 280;
    const turnSpeed = 3.2;

    if (keys['ShiftLeft'] && car.nitro > 0) {
      car.nitro = Math.max(0, car.nitro - 35 * dt);
      if (Math.random() < 0.5) {
        car.particles.push({
          x: car.x - Math.cos(car.angle) * 16,
          y: car.y - Math.sin(car.angle) * 16,
          vx: -Math.cos(car.angle) * 80 + (Math.random() - 0.5) * 20,
          vy: -Math.sin(car.angle) * 80 + (Math.random() - 0.5) * 20,
          color: '#3df5c1', life: 0.3
        });
      }
    } else {
      car.nitro = Math.min(100, car.nitro + 12 * dt);
    }

    if (keys['ArrowUp'] || keys['KeyW']) {
      car.speed = Math.min(maxSpeed, car.speed + accel * dt);
    } else if (keys['ArrowDown'] || keys['KeyS']) {
      car.speed = Math.max(-80, car.speed - accel * 1.5 * dt);
    } else {
      car.speed *= Math.pow(0.85, dt * 60); // friction
    }

    if (Math.abs(car.speed) > 10) {
      const dir = car.speed > 0 ? 1 : -1;
      if (keys['ArrowLeft'] || keys['KeyA']) car.angle -= turnSpeed * dt * dir;
      if (keys['ArrowRight'] || keys['KeyD']) car.angle += turnSpeed * dt * dir;
    }

    // Drift physics
    const targetVx = Math.cos(car.angle) * car.speed;
    const targetVy = Math.sin(car.angle) * car.speed;

    // Drifting grip factor
    const grip = keys['Space'] ? 0.08 : 0.22;
    car.vx += (targetVx - car.vx) * grip;
    car.vy += (targetVy - car.vy) * grip;

    car.x += car.vx * dt;
    car.y += car.vy * dt;

    // Lateral slide detection for drift score & smoke
    const currentSpeed = Math.hypot(car.vx, car.vy);
    const moveAngle = Math.atan2(car.vy, car.vx);
    let driftAngle = Math.abs(car.angle - moveAngle);
    while (driftAngle > Math.PI) driftAngle -= Math.PI * 2;
    driftAngle = Math.abs(driftAngle);

    if (currentSpeed > 100 && (driftAngle > 0.4 || keys['Space'])) {
      car.driftScore += Math.round(currentSpeed * driftAngle * dt * 2);
      setScore(car.driftScore);

      // Tire smoke & marks
      if (Math.random() < 0.6) {
        car.particles.push({
          x: car.x, y: car.y,
          vx: (Math.random() - 0.5) * 30,
          vy: (Math.random() - 0.5) * 30,
          color: 'rgba(255,255,255,0.4)', life: 0.4
        });
      }
      if (car.tireMarks.length > 200) car.tireMarks.shift();
      car.tireMarks.push({ x: car.x, y: car.y });
    }

    // Update Particles
    car.particles.forEach(p => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    });
    car.particles = car.particles.filter(p => p.life > 0);

    // Checkpoints & Laps
    const nextWp = WAYPOINTS[(car.checkpoint + 1) % WAYPOINTS.length];
    if (Math.hypot(car.x - nextWp.x, car.y - nextWp.y) < 90) {
      car.checkpoint = (car.checkpoint + 1) % WAYPOINTS.length;
      if (car.checkpoint === 0) {
        // Completed a Lap!
        const lapTime = (performance.now() - car.lapStart) / 1000;
        if (!car.bestLap || lapTime < car.bestLap) car.bestLap = lapTime;
        car.lapStart = performance.now();
        car.lap++;
        if (window.ArcadiaAudio) window.ArcadiaAudio.playCoin();

        if (car.lap > car.maxLaps) {
          if (window.ArcadiaPassport) window.ArcadiaPassport.unlock('drift_king');
          if (window.ArcadiaAudio) window.ArcadiaAudio.playWin();
          showGover(`RACE FINISHED! DRIFT PTS`, car.driftScore);
          running = false;
        }
      }
    }

    // AI Rivals movement
    rivals.forEach(r => {
      const target = WAYPOINTS[r.cp];
      const dx = target.x - r.x;
      const dy = target.y - r.y;
      const targetAngle = Math.atan2(dy, dx);
      r.angle += (targetAngle - r.angle) * 4 * dt;
      r.x += Math.cos(r.angle) * r.speed * dt;
      r.y += Math.sin(r.angle) * r.speed * dt;

      if (Math.hypot(dx, dy) < 70) {
        r.cp = (r.cp + 1) % WAYPOINTS.length;
      }
    });
  }

  function render() {
    // Neon Asphalt Track Background
    ctx.fillStyle = '#080512';
    ctx.fillRect(0, 0, W, H);

    // Track Outer Border
    ctx.lineWidth = 120;
    ctx.strokeStyle = '#120d24';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(WAYPOINTS[0].x, WAYPOINTS[0].y);
    for (let i = 1; i < WAYPOINTS.length; i++) ctx.lineTo(WAYPOINTS[i].x, WAYPOINTS[i].y);
    ctx.closePath();
    ctx.stroke();

    // Track Neon Curb lines
    ctx.lineWidth = 6;
    ctx.strokeStyle = 'rgba(123, 92, 255, 0.4)';
    ctx.stroke();

    // Track Center Guide Line
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(240, 192, 64, 0.3)';
    ctx.setLineDash([12, 12]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Tire marks
    ctx.fillStyle = 'rgba(20, 15, 35, 0.4)';
    car.tireMarks.forEach(tm => {
      ctx.fillRect(tm.x - 3, tm.y - 3, 6, 6);
    });

    // Start / Finish Line
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(WAYPOINTS[0].x - 4, WAYPOINTS[0].y - 45, 8, 90);
    ctx.fillStyle = '#000000';
    for (let y = WAYPOINTS[0].y - 45; y < WAYPOINTS[0].y + 45; y += 15) {
      ctx.fillRect(WAYPOINTS[0].x - 4, y, 4, 8);
      ctx.fillRect(WAYPOINTS[0].x, y + 8, 4, 8);
    }

    // Particles
    car.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - 2, p.y - 2, 5, 5);
    });

    // Render Rival Cars
    rivals.forEach(r => {
      ctx.save();
      ctx.translate(r.x, r.y);
      ctx.rotate(r.angle);
      ctx.fillStyle = r.color;
      ctx.fillRect(-14, -8, 28, 16);
      ctx.fillStyle = '#111122';
      ctx.fillRect(-4, -6, 12, 12);
      ctx.restore();
    });

    // Render Player Car
    ctx.save();
    ctx.translate(car.x, car.y);
    ctx.rotate(car.angle);

    // Car Body (Neon Cyan)
    ctx.fillStyle = '#3df5c1';
    ctx.fillRect(-16, -9, 32, 18);

    // Windshield & Roof
    ctx.fillStyle = '#0a1020';
    ctx.fillRect(-6, -7, 14, 14);

    // Headlights
    ctx.fillStyle = '#ffff66';
    ctx.fillRect(14, -8, 3, 4);
    ctx.fillRect(14, 4, 3, 4);

    // Taillights
    ctx.fillStyle = '#ff4f7b';
    ctx.fillRect(-16, -8, 2, 4);
    ctx.fillRect(-16, 4, 2, 4);

    ctx.restore();

    // HUD Display
    ctx.fillStyle = 'rgba(6, 4, 14, 0.8)';
    ctx.fillRect(10, 10, 180, 80);
    ctx.strokeStyle = '#3df5c1';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(10, 10, 180, 80);

    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText(`LAP ${Math.min(car.maxLaps, car.lap)}/${car.maxLaps}`, 20, 28);

    ctx.fillStyle = '#3df5c1';
    ctx.fillText(`SPD: ${Math.round(Math.abs(car.speed))} MPH`, 20, 46);

    ctx.fillStyle = '#f0c040';
    ctx.fillText(`DRIFT: ${car.driftScore}`, 20, 64);

    // Nitro Bar
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(20, 72, 150, 8);
    ctx.fillStyle = '#ff4f7b';
    ctx.fillRect(20, 72, (150 * car.nitro) / 100, 8);
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
