// Sudoku Master for Arcadia
function gameSudoku(canvas, W) {
  const H = Math.round(W * 0.95);
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  const PUZZLES = [
    {
      init: [
        [5,3,0,0,7,0,0,0,0],
        [6,0,0,1,9,5,0,0,0],
        [0,9,8,0,0,0,0,6,0],
        [8,0,0,0,6,0,0,0,3],
        [4,0,0,8,0,3,0,0,1],
        [7,0,0,0,2,0,0,0,6],
        [0,6,0,0,0,0,2,8,0],
        [0,0,0,4,1,9,0,0,5],
        [0,0,0,0,8,0,0,7,9]
      ],
      sol: [
        [5,3,4,6,7,8,9,1,2],
        [6,7,2,1,9,5,3,4,8],
        [1,9,8,3,4,2,5,6,7],
        [8,5,9,7,6,1,4,2,3],
        [4,2,6,8,5,3,7,9,1],
        [7,1,3,9,2,4,8,5,6],
        [9,6,1,5,3,7,2,8,4],
        [2,8,7,4,1,9,6,3,5],
        [3,4,5,2,8,6,1,7,9]
      ]
    },
    {
      init: [
        [0,0,0,2,6,0,7,0,1],
        [6,8,0,0,7,0,0,9,0],
        [1,9,0,0,0,4,5,0,0],
        [8,2,0,1,0,0,0,4,0],
        [0,0,4,6,0,2,9,0,0],
        [0,5,0,0,0,3,0,2,8],
        [0,0,9,3,0,0,0,7,4],
        [0,4,0,0,5,0,0,3,6],
        [7,0,3,0,1,8,0,0,0]
      ],
      sol: [
        [4,3,5,2,6,9,7,8,1],
        [6,8,2,5,7,1,4,9,3],
        [1,9,7,8,3,4,5,6,2],
        [8,2,6,1,9,5,3,4,7],
        [3,7,4,6,8,2,9,1,5],
        [9,5,1,7,4,3,6,2,8],
        [5,1,9,3,2,6,8,7,4],
        [2,4,8,9,5,7,1,3,6],
        [7,6,3,4,1,8,2,5,9]
      ]
    }
  ];

  let pz = PUZZLES[Math.floor(Math.random() * PUZZLES.length)];
  let grid = pz.init.map(r => [...r]);
  let isGiven = pz.init.map(r => r.map(c => c !== 0));
  let selR = 0, selC = 0;
  let mistakes = 0;
  let hints = 3;
  let startTime = performance.now();
  let completed = false;

  const GRID_SIZE = Math.min(W - 40, H - 120);
  const CELL = GRID_SIZE / 9;
  const GX = (W - GRID_SIZE) / 2;
  const GY = 40;

  function setNumber(num) {
    if (completed || isGiven[selR][selC]) return;

    if (num === 0) {
      grid[selR][selC] = 0;
      if (window.ArcadiaAudio) window.ArcadiaAudio.playClick();
      return;
    }

    if (pz.sol[selR][selC] === num) {
      grid[selR][selC] = num;
      if (window.ArcadiaAudio) window.ArcadiaAudio.playCoin();
      checkCompletion();
    } else {
      mistakes++;
      if (window.ArcadiaAudio) window.ArcadiaAudio.playHit();
      if (mistakes >= 3) {
        if (window.ArcadiaAudio) window.ArcadiaAudio.playGameOver();
        showGover('3 MISTAKES - GAME OVER', 0);
      }
    }
  }

  function giveHint() {
    if (hints <= 0 || completed) return;
    hints--;
    grid[selR][selC] = pz.sol[selR][selC];
    if (window.ArcadiaAudio) window.ArcadiaAudio.playPowerup();
    checkCompletion();
  }

  function checkCompletion() {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (grid[r][c] !== pz.sol[r][c]) return;
      }
    }
    completed = true;
    const timeTaken = Math.round((performance.now() - startTime) / 1000);
    const score = Math.max(100, 1000 - timeTaken * 2 - mistakes * 100);
    setScore(score);
    if (window.ArcadiaPassport) window.ArcadiaPassport.unlock('sudoku_solver');
    if (window.ArcadiaAudio) window.ArcadiaAudio.playWin();
    setTimeout(() => showGover(`SUDOKU SOLVED IN ${timeTaken}s!`, score), 1000);
  }

  function onKeyDown(e) {
    if (e.key >= '1' && e.key <= '9') setNumber(parseInt(e.key, 10));
    if (e.key === 'Backspace' || e.key === '0' || e.key === 'Delete') setNumber(0);
    if (e.key === 'ArrowUp' && selR > 0) selR--;
    if (e.key === 'ArrowDown' && selR < 8) selR++;
    if (e.key === 'ArrowLeft' && selC > 0) selC--;
    if (e.key === 'ArrowRight' && selC < 8) selC++;
    if (e.key === 'h' || e.key === 'H') giveHint();
  }

  function onClick(e) {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    // Check Grid
    if (mx >= GX && mx <= GX + GRID_SIZE && my >= GY && my <= GY + GRID_SIZE) {
      selC = Math.floor((mx - GX) / CELL);
      selR = Math.floor((my - GY) / CELL);
      if (window.ArcadiaAudio) window.ArcadiaAudio.playClick();
      return;
    }

    // Check Bottom Number Bar
    const numY = GY + GRID_SIZE + 14;
    const numW = (W - 40) / 10;
    for (let i = 1; i <= 9; i++) {
      const bx = 20 + (i - 1) * numW;
      if (mx >= bx && mx <= bx + numW && my >= numY && my <= numY + 40) {
        setNumber(i);
        return;
      }
    }
    // Erase button
    const eraseX = 20 + 9 * numW;
    if (mx >= eraseX && mx <= eraseX + numW && my >= numY && my <= numY + 40) {
      setNumber(0);
    }
  }

  window.addEventListener('keydown', onKeyDown);
  canvas.addEventListener('click', onClick);

  function render() {
    ctx.fillStyle = '#080512';
    ctx.fillRect(0, 0, W, H);

    // Top Bar HUD
    ctx.fillStyle = '#f0c040';
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.textAlign = 'left';
    const elapsed = Math.round((performance.now() - startTime) / 1000);
    ctx.fillText(`TIME: ${elapsed}s`, 20, 24);

    ctx.fillStyle = '#ff4f7b';
    ctx.textAlign = 'center';
    ctx.fillText(`MISTAKES: ${mistakes}/3`, W / 2, 24);

    ctx.fillStyle = '#3df5c1';
    ctx.textAlign = 'right';
    ctx.fillText(`HINTS: ${hints}`, W - 20, 24);

    // Draw Grid
    const selVal = grid[selR][selC];

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cx = GX + c * CELL;
        const cy = GY + r * CELL;

        // Background
        let bg = '#120d24';
        if (r === selR && c === selC) bg = 'rgba(61, 245, 193, 0.35)';
        else if (r === selR || c === selC) bg = 'rgba(123, 92, 255, 0.12)';
        else if (selVal !== 0 && grid[r][c] === selVal) bg = 'rgba(240, 192, 64, 0.25)';

        ctx.fillStyle = bg;
        ctx.fillRect(cx, cy, CELL, CELL);

        // Value
        const val = grid[r][c];
        if (val !== 0) {
          ctx.fillStyle = isGiven[r][c] ? '#f0c040' : '#3df5c1';
          ctx.font = 'bold 20px "Rajdhani", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(val, cx + CELL / 2, cy + CELL / 2 + 1);
        }

        // Thin Grid Lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.strokeRect(cx, cy, CELL, CELL);
      }
    }

    // Thick 3x3 Box Lines
    ctx.strokeStyle = '#7b5cff';
    ctx.lineWidth = 3;
    for (let i = 0; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(GX + i * (CELL * 3), GY);
      ctx.lineTo(GX + i * (CELL * 3), GY + GRID_SIZE);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(GX, GY + i * (CELL * 3));
      ctx.lineTo(GX + GRID_SIZE, GY + i * (CELL * 3));
      ctx.stroke();
    }

    // Number Pad
    const numY = GY + GRID_SIZE + 14;
    const numW = (W - 40) / 10;
    for (let i = 1; i <= 9; i++) {
      const bx = 20 + (i - 1) * numW;
      ctx.fillStyle = '#1c1538';
      ctx.fillRect(bx + 2, numY, numW - 4, 38);
      ctx.strokeStyle = '#3df5c1';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(bx + 2, numY, numW - 4, 38);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px "Rajdhani"';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(i, bx + numW / 2, numY + 19);
    }

    // Eraser Button
    const eraseX = 20 + 9 * numW;
    ctx.fillStyle = '#2a1122';
    ctx.fillRect(eraseX + 2, numY, numW - 4, 38);
    ctx.strokeStyle = '#ff4f7b';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(eraseX + 2, numY, numW - 4, 38);
    ctx.fillStyle = '#ff4f7b';
    ctx.font = '14px sans-serif';
    ctx.fillText('⌫', eraseX + numW / 2, numY + 19);
  }

  let running = true;
  function loop() {
    if (!running) return;
    render();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  return {
    stop: () => {
      running = false;
      window.removeEventListener('keydown', onKeyDown);
      canvas.removeEventListener('click', onClick);
    }
  };
}
