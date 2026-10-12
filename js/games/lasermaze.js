// Laser Maze / Optics Light Puzzle for Arcadia
function gameLaserMaze(canvas, W) {
  const H = Math.round(W * 1.0);
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  let running = true;
  const GRID_SIZE = 7;
  const CELL = (W - 40) / GRID_SIZE;
  const BX = 20, BY = 60;

  let currentLevel = 0;
  let score = 0;

  const LEVELS = [
    {
      emitter: { r: 1, c: 0, dir: 'right' },
      targets: [{ r: 5, c: 5, lit: false }],
      grid: [
        ['.','.','.','.','.','.','.'],
        ['.','.','/','.','.','.','.'],
        ['.','.','.','.','.','.','.'],
        ['.','.','.','.','.','.','.'],
        ['.','.','.','.','\\','.','.'],
        ['.','.','.','.','.','T','.'],
        ['.','.','.','.','.','.','.']
      ]
    },
    {
      emitter: { r: 0, c: 2, dir: 'down' },
      targets: [{ r: 3, c: 6, lit: false }, { r: 6, c: 2, lit: false }],
      grid: [
        ['.','.','E','.','.','.','.'],
        ['.','.','\\','.','.','.','.'],
        ['.','.','.','.','/','.','.'],
        ['.','.','.','.','.','.','T'],
        ['.','.','.','.','.','.','.'],
        ['.','.','\\','.','.','.','.'],
        ['.','.','T','.','.','.','.']
      ]
    },
    {
      emitter: { r: 2, c: 0, dir: 'right' },
      targets: [{ r: 1, c: 5, lit: false }, { r: 5, c: 3, lit: false }],
      grid: [
        ['.','.','.','.','.','.','.'],
        ['.','.','.','.','.','T','.'],
        ['.','.','/','.','.','.','.'],
        ['.','.','.','.','/','.','.'],
        ['.','.','.','\\','.','.','.'],
        ['.','.','.','T','.','.','.'],
        ['.','.','.','.','.','.','.']
      ]
    }
  ];

  let board = JSON.parse(JSON.stringify(LEVELS[0]));
  let laserBeams = [];

  function traceBeams() {
    laserBeams = [];
    board.targets.forEach(t => t.lit = false);

    let curR = board.emitter.r;
    let curC = board.emitter.c;
    let dir = board.emitter.dir;

    let points = [{ x: BX + curC * CELL + CELL / 2, y: BY + curR * CELL + CELL / 2 }];

    for (let step = 0; step < 30; step++) {
      let dr = 0, dc = 0;
      if (dir === 'up') dr = -1;
      else if (dir === 'down') dr = 1;
      else if (dir === 'left') dc = -1;
      else if (dir === 'right') dc = 1;

      curR += dr;
      curC += dc;

      if (curR < 0 || curR >= GRID_SIZE || curC < 0 || curC >= GRID_SIZE) {
        // Beam hit boundary wall
        points.push({ x: BX + (curC - dc) * CELL + CELL / 2 + dc * (CELL / 2), y: BY + (curR - dr) * CELL + CELL / 2 + dr * (CELL / 2) });
        break;
      }

      const cell = board.grid[curR][curC];
      const px = BX + curC * CELL + CELL / 2;
      const py = BY + curR * CELL + CELL / 2;
      points.push({ x: px, y: py });

      // Check Targets
      board.targets.forEach(t => {
        if (t.r === curR && t.c === curC) {
          t.lit = true;
        }
      });

      // Check Mirrors
      if (cell === '/') {
        if (dir === 'right') dir = 'up';
        else if (dir === 'down') dir = 'left';
        else if (dir === 'left') dir = 'down';
        else if (dir === 'up') dir = 'right';
      } else if (cell === '\\') {
        if (dir === 'right') dir = 'down';
        else if (dir === 'up') dir = 'left';
        else if (dir === 'left') dir = 'up';
        else if (dir === 'down') dir = 'right';
      }
    }

    laserBeams.push(points);

    // Check Win
    const allLit = board.targets.every(t => t.lit);
    if (allLit) {
      score += 250;
      setScore(score);
      if (window.ArcadiaAudio) window.ArcadiaAudio.playWin();

      currentLevel++;
      if (currentLevel < LEVELS.length) {
        setTimeout(() => {
          board = JSON.parse(JSON.stringify(LEVELS[currentLevel]));
          traceBeams();
        }, 800);
      } else {
        setTimeout(() => {
          showGover('ALL PUZZLES SOLVED!', score);
        }, 800);
      }
    }
  }

  traceBeams();

  function onClick(e) {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const c = Math.floor((mx - BX) / CELL);
    const r = Math.floor((my - BY) / CELL);

    if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
      const cell = board.grid[r][c];
      if (cell === '/') {
        board.grid[r][c] = '\\';
        if (window.ArcadiaAudio) window.ArcadiaAudio.playClick();
        traceBeams();
      } else if (cell === '\\') {
        board.grid[r][c] = '/';
        if (window.ArcadiaAudio) window.ArcadiaAudio.playClick();
        traceBeams();
      }
    }
  }

  canvas.addEventListener('click', onClick);

  function render() {
    ctx.fillStyle = '#080512';
    ctx.fillRect(0, 0, W, H);

    // Grid Outline
    ctx.fillStyle = '#110d24';
    ctx.fillRect(BX, BY, GRID_SIZE * CELL, GRID_SIZE * CELL);
    ctx.strokeStyle = '#7b5cff';
    ctx.lineWidth = 3;
    ctx.strokeRect(BX, BY, GRID_SIZE * CELL, GRID_SIZE * CELL);

    // Grid Cells
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const cx = BX + c * CELL;
        const cy = BY + r * CELL;
        const cell = board.grid[r][c];

        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 1;
        ctx.strokeRect(cx, cy, CELL, CELL);

        // Mirrors
        if (cell === '/' || cell === '\\') {
          ctx.fillStyle = 'rgba(123,92,255,0.2)';
          ctx.fillRect(cx + 4, cy + 4, CELL - 8, CELL - 8);

          ctx.strokeStyle = '#3df5c1';
          ctx.lineWidth = 4;
          ctx.beginPath();
          if (cell === '/') {
            ctx.moveTo(cx + 10, cy + CELL - 10);
            ctx.lineTo(cx + CELL - 10, cy + 10);
          } else {
            ctx.moveTo(cx + 10, cy + 10);
            ctx.lineTo(cx + CELL - 10, cy + CELL - 10);
          }
          ctx.stroke();
        }
      }
    }

    // Laser Emitter
    const ex = BX + board.emitter.c * CELL + CELL / 2;
    const ey = BY + board.emitter.r * CELL + CELL / 2;
    ctx.fillStyle = '#ff2255';
    ctx.beginPath(); ctx.arc(ex, ey, 12, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();

    // Targets
    board.targets.forEach(t => {
      const tx = BX + t.c * CELL + CELL / 2;
      const ty = BY + t.r * CELL + CELL / 2;
      ctx.fillStyle = t.lit ? '#ffff00' : '#442200';
      ctx.beginPath(); ctx.arc(tx, ty, 14, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = t.lit ? '#ffffff' : '#f0c040';
      ctx.lineWidth = 2.5; ctx.stroke();
    });

    // Render Glowing Laser Beams
    laserBeams.forEach(pts => {
      if (pts.length < 2) return;
      ctx.strokeStyle = '#ff2255';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#ff2255';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();

      // White beam core
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.shadowBlur = 0;
    });

    // Top HUD
    ctx.fillStyle = '#f0c040';
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`LEVEL ${currentLevel + 1}/${LEVELS.length}`, 20, 28);
    ctx.fillStyle = '#3df5c1';
    ctx.textAlign = 'right';
    ctx.fillText(`SCORE: ${score}`, W - 20, 28);
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
