// Stack 2048 / Falling Number Merge for Arcadia
function gameStack2048(canvas, W) {
  const H = Math.round(W * 1.25);
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  let running = true;
  const COLS = 5, ROWS = 7;
  const CELL = Math.min((W - 40) / COLS, (H - 90) / ROWS);
  const BX = (W - COLS * CELL) / 2;
  const BY = 70;

  let grid = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  let curCol = 2;
  let nextVal = getRandomVal();
  let score = 0;
  let combo = 0;
  let dropping = false;
  let dropAnim = null;

  const VAL_COLORS = {
    2: '#3df5c1', 4: '#44aaff', 8: '#7b5cff', 16: '#ff4f7b',
    32: '#ff8c42', 64: '#f0c040', 128: '#00f0ff', 256: '#e040fb',
    512: '#76ff03', 1024: '#ffd600', 2048: '#ff1744'
  };

  function getRandomVal() {
    const vals = [2, 4, 8, 16, 32];
    const weights = [0.4, 0.3, 0.18, 0.08, 0.04];
    const r = Math.random();
    let sum = 0;
    for (let i = 0; i < vals.length; i++) {
      sum += weights[i];
      if (r <= sum) return vals[i];
    }
    return 2;
  }

  function dropBlock(col) {
    if (dropping) return;
    // Find landing row
    let landRow = -1;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (grid[r][col] === 0) {
        landRow = r;
        break;
      }
    }

    if (landRow === -1) {
      // Column is full - check game over
      checkGameOver();
      return;
    }

    dropping = true;
    dropAnim = {
      col,
      targetRow: landRow,
      val: nextVal,
      curY: BY - CELL,
      targetY: BY + landRow * CELL,
      vy: 0
    };

    if (window.ArcadiaAudio) window.ArcadiaAudio.playHit();
  }

  function mergeBoard() {
    let mergedAny = false;

    // Check vertical merges
    for (let c = 0; c < COLS; c++) {
      for (let r = ROWS - 1; r > 0; r--) {
        if (grid[r][c] !== 0 && grid[r][c] === grid[r - 1][c]) {
          grid[r][c] *= 2;
          grid[r - 1][c] = 0;
          score += grid[r][c];
          setScore(score);
          mergedAny = true;
          combo++;
          if (window.ArcadiaAudio) window.ArcadiaAudio.playCoin();
        }
      }
    }

    // Apply gravity
    for (let c = 0; c < COLS; c++) {
      for (let r = ROWS - 1; r >= 0; r--) {
        if (grid[r][c] === 0) {
          for (let nr = r - 1; nr >= 0; nr--) {
            if (grid[nr][c] !== 0) {
              grid[r][c] = grid[nr][c];
              grid[nr][c] = 0;
              break;
            }
          }
        }
      }
    }

    if (mergedAny) {
      setTimeout(mergeBoard, 180);
    } else {
      combo = 0;
      nextVal = getRandomVal();
      checkGameOver();
    }
  }

  function checkGameOver() {
    for (let c = 0; c < COLS; c++) {
      if (grid[0][c] !== 0) {
        if (window.ArcadiaAudio) window.ArcadiaAudio.playGameOver();
        showGover('GRID FULL! GAME OVER', score);
        return;
      }
    }
  }

  function onKeyDown(e) {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
      if (curCol > 0) curCol--;
    } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
      if (curCol < COLS - 1) curCol++;
    } else if (e.code === 'ArrowDown' || e.code === 'Space') {
      e.preventDefault();
      dropBlock(curCol);
    }
  }

  function onMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const col = Math.floor((mx - BX) / CELL);
    if (col >= 0 && col < COLS) curCol = col;
  }

  function onClick(e) {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const col = Math.floor((mx - BX) / CELL);
    if (col >= 0 && col < COLS) dropBlock(col);
  }

  window.addEventListener('keydown', onKeyDown);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('click', onClick);

  function update(dt) {
    if (dropAnim) {
      dropAnim.vy += 2200 * dt;
      dropAnim.curY += dropAnim.vy * dt;

      if (dropAnim.curY >= dropAnim.targetY) {
        grid[dropAnim.targetRow][dropAnim.col] = dropAnim.val;
        dropAnim = null;
        dropping = false;
        mergeBoard();
      }
    }
  }

  function render() {
    ctx.fillStyle = '#080512';
    ctx.fillRect(0, 0, W, H);

    // Board Outline
    ctx.fillStyle = '#110d24';
    ctx.fillRect(BX - 6, BY - 6, COLS * CELL + 12, ROWS * CELL + 12);
    ctx.strokeStyle = '#7b5cff';
    ctx.lineWidth = 3;
    ctx.strokeRect(BX - 6, BY - 6, COLS * CELL + 12, ROWS * CELL + 12);

    // Hover Aim Indicator
    if (!dropping) {
      const hx = BX + curCol * CELL;
      const hy = BY - CELL - 6;

      ctx.fillStyle = VAL_COLORS[nextVal] || '#3df5c1';
      ctx.fillRect(hx + 2, hy + 2, CELL - 4, CELL - 4);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.strokeRect(hx + 2, hy + 2, CELL - 4, CELL - 4);

      ctx.fillStyle = '#06040e';
      ctx.font = 'bold 18px "Rajdhani"';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(nextVal, hx + CELL / 2, hy + CELL / 2);
    }

    // Grid Cells
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cx = BX + c * CELL;
        const cy = BY + r * CELL;
        const val = grid[r][c];

        ctx.fillStyle = val !== 0 ? (VAL_COLORS[val] || '#ff1744') : '#18122c';
        ctx.fillRect(cx + 2, cy + 2, CELL - 4, CELL - 4);

        if (val !== 0) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(cx + 2, cy + 2, CELL - 4, CELL - 4);

          ctx.fillStyle = '#06040e';
          ctx.font = 'bold 20px "Rajdhani"';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(val, cx + CELL / 2, cy + CELL / 2 + 1);
        }
      }
    }

    // Dropping Block
    if (dropAnim) {
      const dx = BX + dropAnim.col * CELL;
      ctx.fillStyle = VAL_COLORS[dropAnim.val] || '#3df5c1';
      ctx.fillRect(dx + 2, dropAnim.curY + 2, CELL - 4, CELL - 4);
      ctx.fillStyle = '#06040e';
      ctx.font = 'bold 20px "Rajdhani"';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(dropAnim.val, dx + CELL / 2, dropAnim.curY + CELL / 2 + 1);
    }

    // Top HUD
    ctx.fillStyle = '#f0c040';
    ctx.font = '11px "Press Start 2P", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${score}`, 20, 24);
  }

  let lastTime = performance.now();
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
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('click', onClick);
    }
  };
}
