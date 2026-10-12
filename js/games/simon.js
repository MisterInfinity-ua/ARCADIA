// Cyber Simon / Memory Matrix for Arcadia
function gameSimon(canvas, W) {
  const H = Math.round(W * 1.0);
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  let running = true;
  let sequence = [];
  let playerIdx = 0;
  let state = 'waiting'; // 'waiting', 'showing', 'input', 'gameover'
  let score = 0;
  let activePad = null;
  let padTimer = 0;

  const PADS = [
    { id: 0, name: 'GREEN', color: '#3df5c1', lit: '#aaffea', freq: 440, angle: Math.PI * 1.0 },
    { id: 1, name: 'RED', color: '#ff4f7b', lit: '#ffa6bf', freq: 554.37, angle: Math.PI * 1.5 },
    { id: 2, name: 'YELLOW', color: '#f0c040', lit: '#fff0a6', freq: 659.25, angle: 0 },
    { id: 3, name: 'BLUE', color: '#44aaff', lit: '#a6d4ff', freq: 880, angle: Math.PI * 0.5 }
  ];

  const CX = W / 2, CY = H / 2;
  const OUTER_R = Math.min(W, H) * 0.42;
  const INNER_R = OUTER_R * 0.38;

  function startNextRound() {
    state = 'showing';
    sequence.push(Math.floor(Math.random() * 4));
    playerIdx = 0;
    playSequence(0);
  }

  function playSequence(idx) {
    if (!running || state !== 'showing') return;
    if (idx >= sequence.length) {
      setTimeout(() => {
        state = 'input';
        playerIdx = 0;
      }, 400);
      return;
    }

    const padId = sequence[idx];
    highlightPad(padId, 350);

    const speed = Math.max(180, 500 - sequence.length * 20);
    setTimeout(() => {
      playSequence(idx + 1);
    }, speed + 120);
  }

  function highlightPad(padId, duration = 300) {
    activePad = padId;
    const p = PADS[padId];
    if (window.ArcadiaAudio) {
      window.ArcadiaAudio.playTone(p.freq, duration / 1000, 'sine', 0.3);
    }
    setTimeout(() => {
      if (activePad === padId) activePad = null;
    }, duration);
  }

  function handleInput(padId) {
    if (state !== 'input' || !running) return;

    highlightPad(padId, 250);

    if (padId === sequence[playerIdx]) {
      playerIdx++;
      if (playerIdx >= sequence.length) {
        // Round Complete!
        score += sequence.length * 100;
        setScore(score);
        state = 'waiting';
        if (window.ArcadiaAudio) window.ArcadiaAudio.playCoin();
        setTimeout(startNextRound, 900);
      }
    } else {
      // Mistake!
      state = 'gameover';
      if (window.ArcadiaAudio) window.ArcadiaAudio.playGameOver();
      setTimeout(() => {
        showGover('WRONG SEQUENCE!', score);
      }, 600);
    }
  }

  function onClick(e) {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const dx = mx - CX, dy = my - CY;
    const dist = Math.hypot(dx, dy);

    if (dist >= INNER_R && dist <= OUTER_R) {
      let angle = Math.atan2(dy, dx);
      if (angle < 0) angle += Math.PI * 2;

      // 4 quadrants: Top-Left (1), Top-Right (0), Bottom-Right (2), Bottom-Left (3)
      if (dx < 0 && dy < 0) handleInput(0);
      else if (dx >= 0 && dy < 0) handleInput(1);
      else if (dx >= 0 && dy >= 0) handleInput(2);
      else if (dx < 0 && dy >= 0) handleInput(3);
    } else if (dist < INNER_R && state === 'waiting' && sequence.length === 0) {
      startNextRound();
    }
  }

  canvas.addEventListener('click', onClick);

  // Auto start initial round
  setTimeout(startNextRound, 600);

  function render() {
    ctx.fillStyle = '#080512';
    ctx.fillRect(0, 0, W, H);

    // Draw 4 Quadrant Pads
    const GAP = 0.08;

    PADS.forEach((p, i) => {
      const isLit = activePad === i;
      const startAngle = i * (Math.PI / 2) + GAP;
      const endAngle = (i + 1) * (Math.PI / 2) - GAP;

      ctx.fillStyle = isLit ? p.lit : p.color;
      ctx.beginPath();
      ctx.arc(CX, CY, OUTER_R, startAngle, endAngle);
      ctx.arc(CX, CY, INNER_R, endAngle, startAngle, true);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = isLit ? 4 : 2;
      ctx.stroke();

      if (isLit) {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 30;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    });

    // Center Console Hub
    ctx.fillStyle = '#110d24';
    ctx.beginPath();
    ctx.arc(CX, CY, INNER_R - 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#7b5cff';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Center Display Text
    ctx.fillStyle = '#f0c040';
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (state === 'showing') {
      ctx.fillText('WATCH', CX, CY - 10);
      ctx.fillStyle = '#3df5c1';
      ctx.fillText(`LVL ${sequence.length}`, CX, CY + 14);
    } else if (state === 'input') {
      ctx.fillText('YOUR TURN', CX, CY - 10);
      ctx.fillStyle = '#ff4f7b';
      ctx.fillText(`${playerIdx}/${sequence.length}`, CX, CY + 14);
    } else {
      ctx.fillText('MEMORY', CX, CY - 10);
      ctx.fillStyle = '#3df5c1';
      ctx.fillText('MATRIX', CX, CY + 14);
    }

    // Top Header
    ctx.fillStyle = '#3df5c1';
    ctx.font = '11px "Press Start 2P", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${score}`, 20, 28);
  }

  function loop() {
    if (!running) return;
    render();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  return {
    stop: () => {
      running = false;
      canvas.removeEventListener('click', onClick);
    }
  };
}
