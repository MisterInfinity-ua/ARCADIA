// Connect Four / Cyber 4 vs AI / 2-Player
function gameConnect4(canvas, W) {
  const H = Math.round(W * 0.75);
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  const COLS = 7, ROWS = 6;
  const CELL_SIZE = Math.min((W - 60) / COLS, (H - 90) / ROWS);
  const BOARD_X = (W - COLS * CELL_SIZE) / 2;
  const BOARD_Y = (H - ROWS * CELL_SIZE) / 2 + 20;

  let board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  let turn = 1; // 1: Red (Player 1), 2: Yellow (AI / Player 2)
  let mode = 'ai'; // 'ai' or '2p'
  let aiDifficulty = 'medium'; // 'easy', 'medium', 'master'
  let gameOver = false;
  let winner = 0;
  let winningCells = [];
  let winStreak = 0;
  let hoverCol = 3;
  let droppingPiece = null; // { col, row, targetY, curY, player }
  let confetti = [];

  function dropDisc(col) {
    if (gameOver || droppingPiece) return false;
    // Find lowest open row
    let targetRow = -1;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (board[r][col] === 0) {
        targetRow = r;
        break;
      }
    }
    if (targetRow === -1) return false; // column full

    droppingPiece = {
      col,
      row: targetRow,
      targetY: BOARD_Y + targetRow * CELL_SIZE + CELL_SIZE / 2,
      curY: BOARD_Y - CELL_SIZE / 2,
      vy: 0,
      player: turn
    };

    if (window.ArcadiaAudio) window.ArcadiaAudio.playHit();
    return true;
  }

  function checkWin(b, player) {
    // Horizontal
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c <= COLS - 4; c++) {
        if (b[r][c] === player && b[r][c+1] === player && b[r][c+2] === player && b[r][c+3] === player) {
          return [[r,c],[r,c+1],[r,c+2],[r,c+3]];
        }
      }
    }
    // Vertical
    for (let r = 0; r <= ROWS - 4; r++) {
      for (let c = 0; c < COLS; c++) {
        if (b[r][c] === player && b[r+1][c] === player && b[r+2][c] === player && b[r+3][c] === player) {
          return [[r,c],[r+1,c],[r+2,c],[r+3,c]];
        }
      }
    }
    // Diagonal \
    for (let r = 0; r <= ROWS - 4; r++) {
      for (let c = 0; c <= COLS - 4; c++) {
        if (b[r][c] === player && b[r+1][c+1] === player && b[r+2][c+2] === player && b[r+3][c+3] === player) {
          return [[r,c],[r+1,c+1],[r+2,c+2],[r+3,c+3]];
        }
      }
    }
    // Diagonal /
    for (let r = 3; r < ROWS; r++) {
      for (let c = 0; c <= COLS - 4; c++) {
        if (b[r][c] === player && b[r-1][c+1] === player && b[r-2][c+2] === player && b[r-3][c+3] === player) {
          return [[r,c],[r-1,c+1],[r-2,c+2],[r-3,c+3]];
        }
      }
    }
    return null;
  }

  function isBoardFull(b) {
    return b[0].every(cell => cell !== 0);
  }

  function aiMove() {
    if (gameOver) return;

    // Check if AI can win immediately
    for (let c = 0; c < COLS; c++) {
      let r = getLowestRow(board, c);
      if (r !== -1) {
        board[r][c] = 2;
        if (checkWin(board, 2)) {
          board[r][c] = 0;
          dropDisc(c);
          return;
        }
        board[r][c] = 0;
      }
    }

    // Check if Player 1 can win immediately and block
    if (aiDifficulty !== 'easy') {
      for (let c = 0; c < COLS; c++) {
        let r = getLowestRow(board, c);
        if (r !== -1) {
          board[r][c] = 1;
          if (checkWin(board, 1)) {
            board[r][c] = 0;
            dropDisc(c);
            return;
          }
          board[r][c] = 0;
        }
      }
    }

    // Pick best center-weighted column
    const pref = [3, 2, 4, 1, 5, 0, 6];
    for (let c of pref) {
      if (getLowestRow(board, c) !== -1) {
        dropDisc(c);
        return;
      }
    }
  }

  function getLowestRow(b, col) {
    for (let r = ROWS - 1; r >= 0; r--) {
      if (b[r][col] === 0) return r;
    }
    return -1;
  }

  function restart() {
    board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    turn = 1;
    gameOver = false;
    winner = 0;
    winningCells = [];
    droppingPiece = null;
    confetti = [];
    hideGover();
  }

  function onMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const col = Math.floor((mx - BOARD_X) / CELL_SIZE);
    if (col >= 0 && col < COLS) hoverCol = col;
  }

  function onClick(e) {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const col = Math.floor((mx - BOARD_X) / CELL_SIZE);
    if (col >= 0 && col < COLS && (turn === 1 || mode === '2p')) {
      dropDisc(col);
    }
  }

  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('click', onClick);

  function update(dt) {
    // Drop animation
    if (droppingPiece) {
      droppingPiece.vy += 2200 * dt;
      droppingPiece.curY += droppingPiece.vy * dt;

      if (droppingPiece.curY >= droppingPiece.targetY) {
        droppingPiece.curY = droppingPiece.targetY;
        board[droppingPiece.row][droppingPiece.col] = droppingPiece.player;
        if (window.ArcadiaAudio) window.ArcadiaAudio.playHit();

        const win = checkWin(board, droppingPiece.player);
        if (win) {
          gameOver = true;
          winner = droppingPiece.player;
          winningCells = win;
          if (winner === 1) {
            winStreak++;
            setScore(winStreak * 100);
            if (window.ArcadiaPassport) window.ArcadiaPassport.unlock('connect4_champ');
            if (window.ArcadiaAudio) window.ArcadiaAudio.playWin();
            // Confetti
            for (let i = 0; i < 60; i++) {
              confetti.push({
                x: W / 2, y: H / 2,
                vx: (Math.random() - 0.5) * 400,
                vy: -Math.random() * 350 - 50,
                color: ['#ff4f7b', '#f0c040', '#3df5c1', '#7b5cff'][Math.floor(Math.random() * 4)],
                size: Math.random() * 6 + 4,
                life: 1.5 + Math.random()
              });
            }
            setTimeout(() => showGover('PLAYER 1 WINS!', winStreak * 100), 1200);
          } else {
            winStreak = 0;
            if (window.ArcadiaAudio) window.ArcadiaAudio.playGameOver();
            setTimeout(() => showGover(mode === 'ai' ? 'AI WINS!' : 'PLAYER 2 WINS!', 0), 1200);
          }
        } else if (isBoardFull(board)) {
          gameOver = true;
          winner = 3; // Draw
          setTimeout(() => showGover('DRAW GAME!', 50), 1000);
        } else {
          turn = turn === 1 ? 2 : 1;
          if (turn === 2 && mode === 'ai' && !gameOver) {
            setTimeout(aiMove, 300);
          }
        }

        droppingPiece = null;
      }
    }

    // Confetti
    confetti.forEach(c => {
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.vy += 400 * dt;
      c.life -= dt;
    });
    confetti = confetti.filter(c => c.life > 0);
  }

  function render() {
    ctx.fillStyle = '#0a0818';
    ctx.fillRect(0, 0, W, H);

    // Header Info
    ctx.fillStyle = '#f0e8ff';
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    if (!gameOver) {
      ctx.fillStyle = turn === 1 ? '#ff4f7b' : '#f0c040';
      ctx.fillText(turn === 1 ? "PLAYER 1'S TURN" : mode === 'ai' ? "AI THINKING..." : "PLAYER 2'S TURN", W / 2, 28);
    }

    // Hover Indicator
    if (!gameOver && !droppingPiece && (turn === 1 || mode === '2p')) {
      const hx = BOARD_X + hoverCol * CELL_SIZE + CELL_SIZE / 2;
      const hy = BOARD_Y - CELL_SIZE / 2;
      ctx.fillStyle = turn === 1 ? 'rgba(255, 79, 123, 0.7)' : 'rgba(240, 192, 64, 0.7)';
      ctx.beginPath();
      ctx.arc(hx, hy, CELL_SIZE * 0.38, 0, Math.PI * 2);
      ctx.fill();
    }

    // Board Frame (Neon Blue Grid)
    ctx.fillStyle = '#110e2e';
    ctx.strokeStyle = '#44aaff';
    ctx.lineWidth = 4;
    ctx.fillRect(BOARD_X - 10, BOARD_Y - 10, COLS * CELL_SIZE + 20, ROWS * CELL_SIZE + 20);
    ctx.strokeRect(BOARD_X - 10, BOARD_Y - 10, COLS * CELL_SIZE + 20, ROWS * CELL_SIZE + 20);

    // Holes and Discs
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cx = BOARD_X + c * CELL_SIZE + CELL_SIZE / 2;
        const cy = BOARD_Y + r * CELL_SIZE + CELL_SIZE / 2;
        const radius = CELL_SIZE * 0.38;

        const val = board[r][c];
        if (val === 1) {
          ctx.fillStyle = '#ff4f7b';
        } else if (val === 2) {
          ctx.fillStyle = '#f0c040';
        } else {
          ctx.fillStyle = '#0a0818';
        }

        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();

        // 3D Rim bevel
        if (val !== 0) {
          ctx.strokeStyle = val === 1 ? '#ff8da6' : '#fff099';
          ctx.lineWidth = 2.5;
          ctx.stroke();
        }
      }
    }

    // Dropping piece
    if (droppingPiece) {
      const cx = BOARD_X + droppingPiece.col * CELL_SIZE + CELL_SIZE / 2;
      ctx.fillStyle = droppingPiece.player === 1 ? '#ff4f7b' : '#f0c040';
      ctx.beginPath();
      ctx.arc(cx, droppingPiece.curY, CELL_SIZE * 0.38, 0, Math.PI * 2);
      ctx.fill();
    }

    // Highlight Winning Line
    if (winningCells.length > 0) {
      ctx.strokeStyle = '#3df5c1';
      ctx.lineWidth = 6;
      ctx.beginPath();
      winningCells.forEach(([r, c], i) => {
        const cx = BOARD_X + c * CELL_SIZE + CELL_SIZE / 2;
        const cy = BOARD_Y + r * CELL_SIZE + CELL_SIZE / 2;
        if (i === 0) ctx.moveTo(cx, cy);
        else ctx.lineTo(cx, cy);
      });
      ctx.stroke();
    }

    // Confetti
    confetti.forEach(c => {
      ctx.fillStyle = c.color;
      ctx.fillRect(c.x, c.y, c.size, c.size);
    });
  }

  let running = true;
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
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('click', onClick);
    }
  };
}
