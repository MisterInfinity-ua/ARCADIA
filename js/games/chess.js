// Chess Master vs AI / 2-Player for Arcadia
function gameChess(canvas, W) {
  const H = Math.round(W * 1.05);
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  const BOARD_SIZE = Math.min(W - 40, H - 90);
  const SQ = BOARD_SIZE / 8;
  const BX = (W - BOARD_SIZE) / 2;
  const BY = 40;

  // Pieces: 'p','n','b','r','q','k' (lowercase: black, uppercase: white)
  let board = [
    ['r','n','b','q','k','b','n','r'],
    ['p','p','p','p','p','p','p','p'],
    ['.','.','.','.','.','.','.','.'],
    ['.','.','.','.','.','.','.','.'],
    ['.','.','.','.','.','.','.','.'],
    ['.','.','.','.','.','.','.','.'],
    ['P','P','P','P','P','P','P','P'],
    ['R','N','B','Q','K','B','N','R']
  ];

  let turn = 'w'; // 'w' or 'b'
  let selR = null, selC = null;
  let validMoves = [];
  let mode = 'ai'; // 'ai' or '2p'
  let gameOver = false;
  let moveHistory = [];
  let captured = { w: [], b: [] };

  const PIECE_SYMBOLS = {
    'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
    'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
  };

  const PIECE_VALS = { 'p': 100, 'n': 320, 'b': 330, 'r': 500, 'q': 900, 'k': 20000 };

  function isWhite(p) { return p !== '.' && p === p.toUpperCase(); }
  function isBlack(p) { return p !== '.' && p === p.toLowerCase(); }

  function getMoves(b, r, c) {
    const p = b[r][c];
    if (p === '.') return [];
    const isW = isWhite(p);
    const moves = [];

    const addMove = (tr, tc) => {
      if (tr >= 0 && tr < 8 && tc >= 0 && tc < 8) {
        const dest = b[tr][tc];
        if (dest === '.') moves.push([tr, tc]);
        else if (isW ? isBlack(dest) : isWhite(dest)) moves.push([tr, tc]);
      }
    };

    const type = p.toLowerCase();
    if (type === 'p') {
      const dir = isW ? -1 : 1;
      const startR = isW ? 6 : 1;
      // Single step forward
      if (r + dir >= 0 && r + dir < 8 && b[r + dir][c] === '.') {
        moves.push([r + dir, c]);
        // Double step
        if (r === startR && b[r + dir * 2][c] === '.') {
          moves.push([r + dir * 2, c]);
        }
      }
      // Diagonal capture
      [-1, 1].forEach(dc => {
        const tr = r + dir, tc = c + dc;
        if (tr >= 0 && tr < 8 && tc >= 0 && tc < 8) {
          const dest = b[tr][tc];
          if (dest !== '.' && (isW ? isBlack(dest) : isWhite(dest))) {
            moves.push([tr, tc]);
          }
        }
      });
    } else if (type === 'n') {
      [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([dr, dc]) => addMove(r + dr, c + dc));
    } else if (type === 'b' || type === 'r' || type === 'q') {
      const dirs = [];
      if (type === 'b' || type === 'q') dirs.push([-1,-1],[-1,1],[1,-1],[1,1]);
      if (type === 'r' || type === 'q') dirs.push([-1,0],[1,0],[0,-1],[0,1]);
      dirs.forEach(([dr, dc]) => {
        let tr = r + dr, tc = c + dc;
        while (tr >= 0 && tr < 8 && tc >= 0 && tc < 8) {
          const dest = b[tr][tc];
          if (dest === '.') {
            moves.push([tr, tc]);
          } else {
            if (isW ? isBlack(dest) : isWhite(dest)) moves.push([tr, tc]);
            break;
          }
          tr += dr; tc += dc;
        }
      });
    } else if (type === 'k') {
      [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]].forEach(([dr, dc]) => addMove(r + dr, c + dc));
    }

    return moves;
  }

  function makeMove(fromR, fromC, toR, toC) {
    const p = board[fromR][fromC];
    const target = board[toR][toC];

    if (target !== '.') {
      if (isWhite(target)) captured.w.push(target);
      else captured.b.push(target);
      if (window.ArcadiaAudio) window.ArcadiaAudio.playHit();
    } else {
      if (window.ArcadiaAudio) window.ArcadiaAudio.playClick();
    }

    board[toR][toC] = p;
    board[fromR][fromC] = '.';

    // Pawn Promotion (Auto queen)
    if (p === 'P' && toR === 0) board[toR][toC] = 'Q';
    if (p === 'p' && toR === 7) board[toR][toC] = 'q';

    // King check win
    if (target.toLowerCase() === 'k') {
      gameOver = true;
      if (turn === 'w') {
        if (window.ArcadiaPassport) window.ArcadiaPassport.unlock('chess_master');
        if (window.ArcadiaAudio) window.ArcadiaAudio.playWin();
        setTimeout(() => showGover('CHECKMATE! WHITE WINS', 1000), 1000);
      } else {
        if (window.ArcadiaAudio) window.ArcadiaAudio.playGameOver();
        setTimeout(() => showGover('CHECKMATE! BLACK WINS', 0), 1000);
      }
      return;
    }

    turn = turn === 'w' ? 'b' : 'w';

    if (turn === 'b' && mode === 'ai' && !gameOver) {
      setTimeout(aiMove, 300);
    }
  }

  function aiMove() {
    if (gameOver) return;

    // Evaluate all black moves
    let bestScore = -99999;
    let bestMove = null;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (isBlack(board[r][c])) {
          const moves = getMoves(board, r, c);
          moves.forEach(([tr, tc]) => {
            const dest = board[tr][tc];
            let score = 0;
            if (dest !== '.') {
              score += (PIECE_VALS[dest.toLowerCase()] || 0) * 10;
            }
            score += (3.5 - Math.abs(3.5 - tr)) * 5; // Center control
            if (score > bestScore || !bestMove) {
              bestScore = score;
              bestMove = { fromR: r, fromC: c, toR: tr, toC: tc };
            }
          });
        }
      }
    }

    if (bestMove) {
      makeMove(bestMove.fromR, bestMove.fromC, bestMove.toR, bestMove.toC);
    }
  }

  function onClick(e) {
    if (gameOver || (turn === 'b' && mode === 'ai')) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (mx >= BX && mx <= BX + BOARD_SIZE && my >= BY && my <= BY + BOARD_SIZE) {
      const c = Math.floor((mx - BX) / SQ);
      const r = Math.floor((my - BY) / SQ);

      if (selR !== null && selC !== null) {
        // Check if clicked a valid move
        const isValid = validMoves.some(([vr, vc]) => vr === r && vc === c);
        if (isValid) {
          makeMove(selR, selC, r, c);
          selR = null; selC = null; validMoves = [];
          return;
        }
      }

      // Select piece
      const p = board[r][c];
      if (p !== '.' && (turn === 'w' ? isWhite(p) : isBlack(p))) {
        selR = r; selC = c;
        validMoves = getMoves(board, r, c);
      } else {
        selR = null; selC = null; validMoves = [];
      }
    }
  }

  canvas.addEventListener('click', onClick);

  function render() {
    ctx.fillStyle = '#0a0818';
    ctx.fillRect(0, 0, W, H);

    // Header Info
    ctx.fillStyle = '#f0c040';
    ctx.font = '11px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(turn === 'w' ? "WHITE'S TURN (PLAYER)" : mode === 'ai' ? "BLACK'S TURN (AI)" : "BLACK'S TURN", W / 2, 26);

    // Board Outline
    ctx.strokeStyle = '#7b5cff';
    ctx.lineWidth = 3;
    ctx.strokeRect(BX - 4, BY - 4, BOARD_SIZE + 8, BOARD_SIZE + 8);

    // Draw Chess Squares
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const x = BX + c * SQ;
        const y = BY + r * SQ;
        const isDark = (r + c) % 2 === 1;

        let bg = isDark ? '#23183d' : '#453568';
        if (selR === r && selC === c) bg = 'rgba(61, 245, 193, 0.5)';
        else if (validMoves.some(([vr, vc]) => vr === r && vc === c)) bg = 'rgba(240, 192, 64, 0.4)';

        ctx.fillStyle = bg;
        ctx.fillRect(x, y, SQ, SQ);

        // Piece
        const p = board[r][c];
        if (p !== '.') {
          ctx.fillStyle = isWhite(p) ? '#ffffff' : '#ff4f7b';
          ctx.font = `${SQ * 0.75}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(PIECE_SYMBOLS[p] || '', x + SQ / 2, y + SQ / 2 + 2);
        }
      }
    }

    // Bottom Tray Info
    const trayY = BY + BOARD_SIZE + 20;
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('White: ' + captured.w.map(p => PIECE_SYMBOLS[p]).join(' '), BX, trayY);
    ctx.fillStyle = '#ff4f7b';
    ctx.fillText('Black: ' + captured.b.map(p => PIECE_SYMBOLS[p]).join(' '), BX, trayY + 22);
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
      canvas.removeEventListener('click', onClick);
    }
  };
}
