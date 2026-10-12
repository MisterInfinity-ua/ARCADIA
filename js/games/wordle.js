// Wordle Arcade / Word Craze for Arcadia
function gameWordle(canvas, W) {
  const H = Math.round(W * 0.85);
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  const WORDS = [
    'PIXEL', 'CYBER', 'ROBOT', 'LASER', 'POWER', 'LEVEL', 'SPEED', 'QUEST',
    'MAGIC', 'GHOST', 'SPACE', 'BLOCK', 'BLAST', 'DRIVE', 'FLAME', 'SWORD',
    'NINJA', 'TITAN', 'STORM', 'SHARP', 'FLASH', 'TURBO', 'CRAFT', 'ARMOR',
    'SOLAR', 'PRISM', 'CHAMP', 'BRAIN', 'SKILL', 'SCORE', 'PULSE', 'RADAR',
    'ORBIT', 'SUPER', 'RETRO', 'ALIEN', 'FORGE', 'SHARD', 'BLADE', 'MECHA'
  ];

  let secret = WORDS[Math.floor(Math.random() * WORDS.length)];
  let guesses = [];
  let currentGuess = '';
  let row = 0;
  let gameOver = false;
  let flipAnims = []; // animations for flipped tiles
  let keyColors = {}; // letter -> 'correct', 'present', 'absent'
  let streak = parseInt(localStorage.getItem('wordle_streak') || '0', 10);

  const KB_ROWS = [
    ['Q','W','E','R','T','Y','U','I','O','P'],
    ['A','S','D','F','G','H','J','K','L'],
    ['ENTER','Z','X','C','V','B','N','M','⌫']
  ];

  function restart() {
    secret = WORDS[Math.floor(Math.random() * WORDS.length)];
    guesses = [];
    currentGuess = '';
    row = 0;
    gameOver = false;
    flipAnims = [];
    keyColors = {};
    hideGover();
  }

  function handleKey(k) {
    if (gameOver) return;

    if (k === 'ENTER') {
      if (currentGuess.length === 5) {
        submitGuess();
      } else {
        if (window.ArcadiaAudio) window.ArcadiaAudio.playTone(180, 0.08, 'sawtooth', 0.2);
      }
    } else if (k === 'BACKSPACE' || k === '⌫') {
      if (currentGuess.length > 0) {
        currentGuess = currentGuess.slice(0, -1);
        if (window.ArcadiaAudio) window.ArcadiaAudio.playClick();
      }
    } else if (/^[A-Z]$/.test(k)) {
      if (currentGuess.length < 5) {
        currentGuess += k;
        if (window.ArcadiaAudio) window.ArcadiaAudio.playClick();
      }
    }
  }

  function submitGuess() {
    const guess = currentGuess.toUpperCase();
    guesses.push(guess);

    // Compute feedback colors
    const res = Array(5).fill('absent');
    const secretArr = secret.split('');
    const guessArr = guess.split('');

    // First pass: Greens (Exact matches)
    for (let i = 0; i < 5; i++) {
      if (guessArr[i] === secretArr[i]) {
        res[i] = 'correct';
        secretArr[i] = null;
        keyColors[guessArr[i]] = 'correct';
      }
    }

    // Second pass: Yellows (Present letters)
    for (let i = 0; i < 5; i++) {
      if (res[i] !== 'correct') {
        const idx = secretArr.indexOf(guessArr[i]);
        if (idx !== -1) {
          res[i] = 'present';
          secretArr[idx] = null;
          if (keyColors[guessArr[i]] !== 'correct') {
            keyColors[guessArr[i]] = 'present';
          }
        } else {
          if (!keyColors[guessArr[i]]) {
            keyColors[guessArr[i]] = 'absent';
          }
        }
      }
    }

    // Sound effect
    if (window.ArcadiaAudio) window.ArcadiaAudio.playCoin();

    currentGuess = '';
    row++;

    if (guess === secret) {
      gameOver = true;
      streak++;
      localStorage.setItem('wordle_streak', String(streak));
      const score = (7 - row) * 150 + streak * 50;
      setScore(score);
      if (window.ArcadiaPassport) window.ArcadiaPassport.unlock('wordle_solver');
      if (window.ArcadiaAudio) window.ArcadiaAudio.playWin();
      setTimeout(() => showGover(`SOLVED IN ${row} GUESSES!`, score), 1200);
    } else if (row >= 6) {
      gameOver = true;
      streak = 0;
      localStorage.setItem('wordle_streak', '0');
      if (window.ArcadiaAudio) window.ArcadiaAudio.playGameOver();
      setTimeout(() => showGover(`WORD WAS: ${secret}`, 0), 1200);
    }
  }

  function onKeyDown(e) {
    let k = e.key.toUpperCase();
    if (e.key === 'Backspace') k = 'BACKSPACE';
    if (e.key === 'Enter') k = 'ENTER';
    handleKey(k);
  }

  function onClick(e) {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    // Check virtual keyboard click
    const kbY = H - 150;
    const keyH = 36;
    KB_ROWS.forEach((r, rIdx) => {
      const keyW = (W - 30) / r.length;
      const startX = 15;
      r.forEach((k, kIdx) => {
        const kx = startX + kIdx * keyW;
        const ky = kbY + rIdx * (keyH + 6);
        if (mx >= kx && mx <= kx + keyW && my >= ky && my <= ky + keyH) {
          handleKey(k);
        }
      });
    });
  }

  window.addEventListener('keydown', onKeyDown);
  canvas.addEventListener('click', onClick);

  function render() {
    ctx.fillStyle = '#080512';
    ctx.fillRect(0, 0, W, H);

    // Title / Streak
    ctx.fillStyle = '#f0c040';
    ctx.font = '11px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`WORD CRAZE · STREAK: ${streak}`, W / 2, 28);

    // Render Grid (6 rows x 5 cols)
    const TILE_SIZE = Math.min(48, (W - 80) / 5);
    const GRID_X = (W - 5 * (TILE_SIZE + 8)) / 2;
    const GRID_Y = 46;

    for (let r = 0; r < 6; r++) {
      const isCurRow = r === row && !gameOver;
      const rowWord = r < guesses.length ? guesses[r] : isCurRow ? currentGuess : '';

      for (let c = 0; c < 5; c++) {
        const tx = GRID_X + c * (TILE_SIZE + 8);
        const ty = GRID_Y + r * (TILE_SIZE + 8);
        const letter = rowWord[c] || '';

        // Determine Tile Color
        let bg = 'rgba(255, 255, 255, 0.05)';
        let border = 'rgba(255, 255, 255, 0.15)';
        let textColor = '#ffffff';

        if (r < guesses.length) {
          // Evaluated row
          const guessL = guesses[r][c];
          const secretL = secret[c];
          if (guessL === secretL) {
            bg = '#3df5c1'; // Green
            border = '#3df5c1';
            textColor = '#06040e';
          } else if (secret.includes(guessL)) {
            bg = '#f0c040'; // Yellow
            border = '#f0c040';
            textColor = '#06040e';
          } else {
            bg = '#251c38'; // Gray
            border = '#251c38';
            textColor = '#8888aa';
          }
        } else if (isCurRow && letter) {
          border = '#7b5cff';
        }

        ctx.fillStyle = bg;
        ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
        ctx.strokeStyle = border;
        ctx.lineWidth = 2;
        ctx.strokeRect(tx, ty, TILE_SIZE, TILE_SIZE);

        if (letter) {
          ctx.fillStyle = textColor;
          ctx.font = 'bold 22px "Rajdhani", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(letter, tx + TILE_SIZE / 2, ty + TILE_SIZE / 2 + 2);
        }
      }
    }

    // Render Virtual Keyboard
    const kbY = H - 145;
    const keyH = 34;

    KB_ROWS.forEach((r, rIdx) => {
      const keyW = (W - 30) / r.length;
      const startX = 15;
      r.forEach((k, kIdx) => {
        const kx = startX + kIdx * keyW;
        const ky = kbY + rIdx * (keyH + 6);

        let bg = '#1a142c';
        let txtColor = '#ffffff';
        const st = keyColors[k];
        if (st === 'correct') { bg = '#3df5c1'; txtColor = '#06040e'; }
        else if (st === 'present') { bg = '#f0c040'; txtColor = '#06040e'; }
        else if (st === 'absent') { bg = '#110b1a'; txtColor = '#555566'; }

        ctx.fillStyle = bg;
        ctx.fillRect(kx + 2, ky, keyW - 4, keyH);
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        ctx.strokeRect(kx + 2, ky, keyW - 4, keyH);

        ctx.fillStyle = txtColor;
        ctx.font = k.length > 1 ? '10px "Press Start 2P"' : 'bold 16px "Rajdhani"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(k, kx + keyW / 2, ky + keyH / 2 + 1);
      });
    });
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
