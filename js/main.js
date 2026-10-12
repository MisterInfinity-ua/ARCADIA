// Arcadia Main Portal Controller & Game Manager
(function(window) {
  const GAMES = [
    {
      id: 'minecraft', emoji: '⛏️', title: 'MINECRAFT 3D', cat: '3d',
      label: '3D VOXEL', isNew: true, isFeat: true,
      desc: 'New full 3D voxel sandbox with procedural biomes, day/night cycle, zombies, pigs, sheep, survival & creative modes, crafting, TNT explosions & synth audio!',
      keys: 'WASD + MOUSE', diff: 2,
      instr: '<span>WASD</span> move · <span>SPACE</span> jump (double-tap fly) · <span>LEFT CLICK</span> mine/attack · <span>RIGHT CLICK</span> place/use · <span>1-9</span> hotbar · <span>E</span> inventory'
    },
    {
      id: 'doom', emoji: '🔫', title: 'DOOM 3D', cat: 'action',
      label: 'RAYCASTER FPS', isNew: true, isFeat: true,
      desc: 'Fast 60 FPS Wolf3D-style raycasting shooter! Blast demonic cyborgs with your shotgun and pistol, hunt for health & ammo, and explore the cyber maze.',
      keys: 'WASD + SPACE/CLICK', diff: 4,
      instr: '<span>WASD</span> move · <span>← →</span> turn · <span>SPACE / LEFT CLICK</span> fire · <span>1 / 2</span> switch weapon · <span>SHIFT</span> sprint'
    },
    {
      id: 'crossy', emoji: '🐸', title: 'CROSSY CYBER', cat: 'arcade',
      label: 'ROAD HOPPER', isNew: true, isFeat: true,
      desc: 'Hop across speeding neon hovercar highways, maglev train tracks, and cyber rivers on floating energy logs! Collect coins and avoid laser walls.',
      keys: 'WASD / ARROWS / TAP', diff: 2,
      instr: '<span>WASD / ARROWS</span> hop forward, back, left, right · Avoid traffic and don’t fall in the water!'
    },
    {
      id: 'dash', emoji: '⚡', title: 'CYBER DASH', cat: 'rhythm',
      label: 'RHYTHM RUNNER', isNew: true, isFeat: true,
      desc: 'High-octane neon rhythm auto-runner! Leap over deadly spikes, bounce on yellow pads, hit jump rings mid-air, and invert gravity through portals.',
      keys: 'SPACE / ↑ / CLICK', diff: 4,
      instr: '<span>SPACE / ↑ / CLICK</span> jump & hit rings · <span>R</span> quick restart · Dodge spikes and reach 100%!'
    },
    {
      id: 'drift', emoji: '🏎️', title: 'RETRO DRIFT', cat: 'rhythm',
      label: 'ARCADE RACER', isNew: true, isFeat: true,
      desc: 'Top-down neon drifting racer with realistic sliding physics, tire smoke particle trails, nitro boost, rival AI racers, and drift multiplier scoring!',
      keys: 'WASD + SPACE (DRIFT)', diff: 3,
      instr: '<span>W / ↑</span> accelerate · <span>A/D / ←→</span> steer · <span>SPACE</span> handbrake drift · <span>SHIFT</span> nitro boost'
    },
    {
      id: 'jumper', emoji: '🚀', title: 'CYBER JUMPER', cat: 'arcade',
      label: 'BOUNCY JUMP', isNew: true, isFeat: false,
      desc: 'Endless vertical bouncy jumper with moving platforms, spring pads, jetpacks, and blaster shooting! Screen-wrap left and right to climb higher.',
      keys: 'A / D + SPACE/CLICK', diff: 2,
      instr: '<span>A / D or ← →</span> move left/right · <span>SPACE / CLICK</span> shoot blasters · Bounce on springs & jetpacks!'
    },
    {
      id: 'surfer', emoji: '🛹', title: 'CYBER SURFER', cat: 'action',
      label: '3-LANE SURFER', isNew: true, isFeat: false,
      desc: 'Fast 3-lane endless hoverboard surfer! Switch lanes, jump over high-voltage barriers, duck under lasers, and grab coin magnets at breakneck speeds.',
      keys: 'A / D / W / S', diff: 3,
      instr: '<span>A / D or ← →</span> switch lane · <span>W / ↑ / SPACE</span> jump · <span>S / ↓</span> duck & slide'
    },
    {
      id: 'archer', emoji: '🏹', title: 'CYBER ARCHER', cat: 'action',
      label: 'BOW DUEL', isNew: true, isFeat: false,
      desc: 'Physics-based ballistic archery duel! Drag and aim your bow trajectory against variable wind speeds. Land headshots for massive bonus points.',
      keys: 'MOUSE DRAG & RELEASE', diff: 3,
      instr: '<span>CLICK & DRAG</span> pull bow string & angle · <span>RELEASE</span> shoot arrow · Watch the wind gauge!'
    },
    {
      id: 'galaga', emoji: '🛸', title: 'GALAGA FIGHTER', cat: 'action',
      label: 'SPACE FIGHTER', isNew: true, isFeat: false,
      desc: 'Classic space combat! Alien insectoid formations swoop down in looping dive patterns. Upgrade to dual laser cannons and clear waves.',
      keys: '← → + SPACE', diff: 3,
      instr: '<span>← → / A/D</span> move fighter · <span>SPACE</span> fire laser salvos · Clear all alien waves'
    },
    {
      id: 'tanks', emoji: '💥', title: 'NEON TANK WAR', cat: 'action',
      label: 'BATTLE TANKS', isNew: true, isFeat: false,
      desc: 'Top-down neon tank combat! Blast destructible brick mazes, ambush enemy heavy tanks, and defend your central base core from enemy shells.',
      keys: 'WASD + SPACE', diff: 3,
      instr: '<span>WASD / ARROWS</span> drive tank · <span>SPACE</span> fire shell · Protect your base core at the bottom!'
    },
    {
      id: 'fruitblade', emoji: '🍉', title: 'FRUIT BLADE', cat: 'action',
      label: 'BLADE SLICER', isNew: true, isFeat: false,
      desc: 'Slice tossed flying watermelons, bananas, oranges, and strawberries with neon blade trails! Build massive combos and dodge dangerous bombs.',
      keys: 'MOUSE SWIPE', diff: 2,
      instr: '<span>DRAG MOUSE / SWIPE</span> slice fruits · Slice multiple fruits at once for combos · Avoid bombs!'
    },
    {
      id: 'simon', emoji: '🧠', title: 'MEMORY MATRIX', cat: 'puzzle',
      label: 'SIMON SEQUENCE', isNew: true, isFeat: false,
      desc: 'High-speed sequence memory challenge! Watch the 4 neon quadrants illuminate and play synthesized tones, then replay the exact melody.',
      keys: 'CLICK / TAP', diff: 2,
      instr: '<span>WATCH</span> the light sequence · <span>REPEAT</span> by clicking quadrants in order · Beat your streak!'
    },
    {
      id: 'stack2048', emoji: '🔢', title: 'STACK 2048', cat: 'puzzle',
      label: 'NUMBER MERGE', isNew: true, isFeat: false,
      desc: 'Tetris meets 2048! Drop numbered blocks into 5 columns. Identical colliding numbers merge and trigger cascading chain reaction combos.',
      keys: 'ARROWS / CLICK', diff: 2,
      instr: '<span>← →</span> aim column · <span>↓ / CLICK</span> drop block · Merge numbers to reach 2048!'
    },
    {
      id: 'lasermaze', emoji: '💡', title: 'LASER MAZE', cat: 'puzzle',
      label: 'OPTICS PUZZLE', isNew: true, isFeat: false,
      desc: 'Optics laser puzzle! Click angled mirrors to rotate them and guide glowing laser beams through the grid into target power crystals.',
      keys: 'MOUSE CLICK', diff: 3,
      instr: '<span>CLICK MIRRORS</span> to rotate 90° · Direct the laser beam into all yellow targets!'
    },
    {
      id: 'ballz', emoji: '⚪', title: 'BALLZ BREAKER', cat: 'arcade',
      label: 'PHYSICS STREAM', isNew: true, isFeat: false,
      desc: 'Launch a stream of 30+ bouncing balls at numbered brick grids! Collect +1 ball powerups and clear all bricks before they hit bottom.',
      keys: 'MOUSE AIM & RELEASE', diff: 2,
      instr: '<span>DRAG</span> to aim trajectory line · <span>RELEASE</span> to fire stream of balls · Destroy numbered bricks'
    },
    {
      id: 'connect4', emoji: '🔴', title: 'CONNECT FOUR', cat: 'puzzle',
      label: 'STRATEGY', isNew: true, isFeat: false,
      desc: 'Classic 4-in-a-row board with smooth disc gravity drops! Challenge the smart Minimax AI across 3 difficulty tiers or play 2-Player local mode.',
      keys: 'MOUSE CLICK', diff: 2,
      instr: '<span>MOUSE MOVE</span> aim column · <span>CLICK</span> drop disc · Connect 4 of your color to win!'
    },
    {
      id: 'chess', emoji: '♟️', title: 'CHESS MASTER', cat: 'puzzle',
      label: 'BOARD STRATEGY', isNew: true, isFeat: false,
      desc: 'Full chess game with legal move validation, pawn promotion, castling, captured pieces tray, checkmate detection, and Minimax AI opponent.',
      keys: 'MOUSE CLICK', diff: 3,
      instr: '<span>CLICK</span> select piece · <span>CLICK</span> highlighted square to move · Checkmate the enemy King!'
    },
    {
      id: 'wordle', emoji: '🟩', title: 'WORD CRAZE', cat: 'puzzle',
      label: 'WORD PUZZLE', isNew: true, isFeat: false,
      desc: 'Guess the hidden 5-letter cyber word in 6 attempts! Green = correct, Yellow = in word, Gray = absent. Keyboard typing & streak tracking included.',
      keys: 'KEYBOARD / CLICK', diff: 2,
      instr: '<span>TYPE</span> 5-letter word · <span>ENTER</span> submit · Use color clues to crack the secret word'
    },
    {
      id: 'towerdefense', emoji: '🏰', title: 'TOWER DEFENSE', cat: 'puzzle',
      label: 'TACTICAL DEFENSE', isNew: true, isFeat: false,
      desc: 'Strategically deploy and upgrade Gatling, Laser, Frost Cryo, and Mortar turrets to eliminate incoming monster waves before they breach base!',
      keys: 'MOUSE CLICK', diff: 3,
      instr: '<span>SELECT TOWER</span> from bottom bar · <span>CLICK GRID</span> to build · Earn gold from enemies'
    },
    {
      id: 'pinball', emoji: '🕹️', title: 'CYBER PINBALL', cat: 'arcade',
      label: 'PHYSICS ARCADE', isNew: true, isFeat: false,
      desc: 'Full 2D physics neon pinball table with spring plunger, responsive flippers, high-score bumpers, slingshots, and score multiplier bonuses!',
      keys: 'A / D / SPACE', diff: 2,
      instr: '<span>SPACE / ↓</span> launch ball · <span>A / ←</span> left flipper · <span>D / →</span> right flipper'
    },
    {
      id: 'sudoku', emoji: '🧩', title: 'SUDOKU MASTER', cat: 'puzzle',
      label: 'LOGIC PUZZLE', isNew: true, isFeat: false,
      desc: 'Interactive 9x9 Sudoku puzzle with conflict detection, matching number highlights, number keypad, undo/erase, hint assistant, and timer.',
      keys: '1-9 / MOUSE', diff: 3,
      instr: '<span>CLICK CELL</span> then <span>1-9</span> to enter number · <span>H</span> hint · Fill all 9x9 boxes correctly'
    },
    {
      id: 'mario', emoji: '🍄', title: 'SUPER MARIO', cat: 'arcade',
      label: 'PLATFORMER', isNew: false, isFeat: true,
      desc: 'Run, jump, and stomp goombas in classic retro platformer levels with coin mystery blocks, super mushrooms, and flagpole castle finish.',
      keys: '← → + SPACE / ↑', diff: 2,
      instr: '<span>← →</span> move · <span>SPACE / ↑</span> jump · <span>↓</span> crouch · stomp enemies & collect coins'
    },
    {
      id: 'snake', emoji: '🐍', title: 'SNAKE ARENA', cat: 'arcade',
      label: 'CLASSIC & IO', isNew: false, isFeat: false,
      desc: 'Play Classic Grid Snake or dive into the massive multiplayer Slither.io arena with AI bots, neon food orbs, speed boosting, and customizable skins!',
      keys: 'ARROWS / MOUSE', diff: 2,
      instr: '<span>↑↓←→ / WASD</span> classic mode · <span>MOUSE</span> arena mode · Eat orbs to grow longer'
    },
    {
      id: 'pacman', emoji: '🟡', title: 'PAC-MAN', cat: 'arcade',
      label: 'ARCADE MAZE', isNew: false, isFeat: false,
      desc: 'Eat all neon dots, outsmart Blinky, Pinky, Inky & Clyde ghosts, and grab glowing energizer pellets to turn the tables in the classic maze!',
      keys: 'ARROWS / WASD', diff: 2,
      instr: '<span>↑↓←→ / WASD</span> move · Eat power energizers to chase frightened ghosts for bonus points!'
    },
    {
      id: 'tetris', emoji: '🟦', title: 'TETRIS', cat: 'puzzle',
      label: 'PUZZLE CLASSIC', isNew: false, isFeat: false,
      desc: 'Stack falling tetrominoes, clear multi-line combos, use hard drop with Space, and test your reflexes as falling speed escalates!',
      keys: 'ARROWS + SPACE', diff: 3,
      instr: '<span>← →</span> move · <span>↑</span> rotate · <span>↓</span> soft drop · <span>SPACE</span> hard drop'
    },
    {
      id: 'flappy', emoji: '🐦', title: 'FLAPPY BIRD', cat: 'arcade',
      label: 'RAGE CLASSIC', isNew: false, isFeat: false,
      desc: 'Tap to flap through endless neon pipes. Notoriously unforgiving, highly addictive! Earn bronze, silver, gold, and platinum score medals.',
      keys: 'SPACE / CLICK', diff: 4,
      instr: '<span>SPACE / CLICK</span> flap wings · Time your flaps carefully to weave between pipes'
    },
    {
      id: 'asteroids', emoji: '🚀', title: 'ASTEROIDS', cat: 'action',
      label: 'VECTOR SHOOTER', isNew: false, isFeat: false,
      desc: 'Pilot through dangerous asteroid fields with inertial thrusters, blaster lasers, splitting rock physics, and UFO boss encounters.',
      keys: 'WASD + SPACE', diff: 3,
      instr: '<span>W</span> thrust · <span>A/D</span> rotate ship · <span>SPACE</span> fire blasters · Score 1000 for upgrades'
    },
    {
      id: 'invaders', emoji: '👾', title: 'SPACE INVADERS', cat: 'action',
      label: 'RETRO SHOOTER', isNew: false, isFeat: false,
      desc: 'Hold the defense line! Blast descending alien formations behind destructible shields and snipe high-speed mystery saucer motherships.',
      keys: '← → + SPACE', diff: 3,
      instr: '<span>← →</span> move cannon · <span>SPACE</span> fire laser · Destroy all alien invaders before they land'
    },
    {
      id: 'breakout', emoji: '🧱', title: 'BREAKOUT', cat: 'arcade',
      label: 'BRICK SMASHER', isNew: false, isFeat: false,
      desc: 'Smash all colored brick rows with your ball! Catch powerup capsules, widen your paddle, and clear all levels without dropping the ball.',
      keys: '← → / MOUSE', diff: 2,
      instr: '<span>← → / MOUSE</span> move paddle · Deflect ball into bricks to clear the board'
    },
    {
      id: '2048', emoji: '🔢', title: '2048 NEON', cat: 'puzzle',
      label: 'SLIDING PUZZLE', isNew: false, isFeat: false,
      desc: 'Slide and merge identical number tiles across the 4x4 grid to reach the elusive 2048 tile! Features smooth slide animations and score tracking.',
      keys: 'ARROWS / WASD', diff: 2,
      instr: '<span>↑↓←→ / WASD</span> slide all tiles · When two identical tiles collide, they merge into one!'
    },
    {
      id: 'pong', emoji: '🏓', title: 'PONG VS AI', cat: 'arcade',
      label: 'VS AI CLASSIC', isNew: false, isFeat: false,
      desc: 'Classic table tennis duel against an adaptive AI opponent! Features fast rally spin deflection physics. First to 10 points wins the match.',
      keys: 'W / S / ARROWS', diff: 1,
      instr: '<span>W / S or ↑↓</span> move paddle · Hit ball with paddle edges to add spin and curve'
    },
    {
      id: 'minesweeper', emoji: '💣', title: 'MINESWEEPER', cat: 'puzzle',
      label: 'LOGIC PUZZLE', isNew: false, isFeat: false,
      desc: 'Reveal safe cells and flag hidden explosive mines with first-click protection, remaining mine counter, and elapsed time tracker.',
      keys: 'L-CLICK / R-CLICK', diff: 2,
      instr: '<span>LEFT CLICK</span> reveal cell · <span>RIGHT CLICK</span> flag mine · Numbers show adjacent mines'
    },
    {
      id: 'runner', emoji: '🏃', title: 'PIXEL RUNNER', cat: 'action',
      label: 'ENDLESS SPRINT', isNew: false, isFeat: false,
      desc: 'Sprint, jump, and duck under neon obstacles in an accelerating endless cyber runner! Collect power crystals and survive day-to-night cycles.',
      keys: 'SPACE / ↑ / ↓', diff: 2,
      instr: '<span>SPACE / ↑</span> jump (double-jump) · <span>↓</span> slide/duck · Dodge obstacles'
    },
    {
      id: 'whack', emoji: '🔨', title: 'WHACK-A-MOLE', cat: 'arcade',
      label: 'REFLEX TEST', isNew: false, isFeat: false,
      desc: 'Smash mischievous cyber moles as they pop out of holes! Hit golden bonus moles for double points and avoid dangerous skull traps.',
      keys: 'MOUSE / TAP', diff: 1,
      instr: '<span>CLICK / TAP</span> moles quickly · Speed escalates over time · Hit golden moles!'
    },
    {
      id: 'typing', emoji: '⌨️', title: 'TYPE RACER', cat: 'action',
      label: 'KEYBOARD SPEED', isNew: false, isFeat: false,
      desc: 'Type falling cyber words before they hit the ground matrix! Tracks real-time Words Per Minute (WPM) and typing accuracy metrics.',
      keys: 'TYPE WORDS', diff: 2,
      instr: '<span>TYPE</span> the falling words on your keyboard · Keep accuracy high to survive!'
    }
  ];

  let currentCategory = 'all';
  let searchQuery = '';
  let activeGame = null;
  let currentGameId = null;
  let playerColors = {};

  const GAME_COLORS = {
    snake: [{n:'Neon Green',v:'#3df5c1'},{n:'Hot Pink',v:'#ff4f7b'},{n:'Gold',v:'#f0c040'},{n:'Violet',v:'#7b5cff'},{n:'Sky',v:'#44aaff'}],
    flappy: [{n:'Yellow',v:'#f0c040'},{n:'Red',v:'#ff4f7b'},{n:'Blue',v:'#44aaff'},{n:'Green',v:'#3df5c1'}],
    breakout: [{n:'Red',v:'#ff4f7b'},{n:'Blue',v:'#44aaff'},{n:'Gold',v:'#f0c040'},{n:'Green',v:'#3df5c1'}],
    asteroids: [{n:'Cyan',v:'#3df5c1'},{n:'Gold',v:'#f0c040'},{n:'Pink',v:'#ff4f7b'},{n:'White',v:'#ffffff'}],
    mario: [{n:'Red/Blue',v:'#ff4f7b'},{n:'Fire White',v:'#ffffff'},{n:'Luigi Green',v:'#3df5c1'}]
  };

  function initPortal() {
    renderGamesGrid();
    setupFilters();
    setupPassport();
    setupBackgroundStars();
    updateMarquee();
    setupVirtualControls();

    // Prevent default scroll on arrow keys/space while modal is open
    window.addEventListener('keydown', (e) => {
      if (document.getElementById('modal-overlay').classList.contains('open')) {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
          e.preventDefault();
        }
      }
    });

    // Sound toggle button in nav
    const sndBtn = document.getElementById('sound-toggle-btn');
    if (sndBtn) {
      sndBtn.onclick = () => window.ArcadiaAudio?.toggleMute();
      if (window.ArcadiaAudio?.muted) {
        sndBtn.innerHTML = '🔇 <span class="nav-btn-text">MUTED</span>';
        sndBtn.classList.add('muted');
      }
    }

    // Surprise Me / Roulette Button
    const randomBtn = document.getElementById('hero-random-btn');
    if (randomBtn) randomBtn.onclick = triggerRoulette;
    const navRand = document.getElementById('nav-random-btn');
    if (navRand) navRand.onclick = triggerRoulette;

    // Listen to iframe exit messages from Minecraft
    window.addEventListener('message', (e) => {
      if (e.data && e.data.type === 'closeMC') {
        closeMC();
      }
    });
  }

  function updateMarquee() {
    const track = document.getElementById('marquee-track');
    if (!track) return;
    const items = GAMES.map(g => `${g.emoji} ${g.title}`).join(' <span class="sep">◆</span> ');
    track.innerHTML = `<span class="mitem">${items} <span class="sep">◆</span> </span><span class="mitem">${items} <span class="sep">◆</span> </span>`;
  }

  function renderGamesGrid() {
    const grid = document.getElementById('games-grid');
    if (!grid) return;

    let filtered = GAMES.filter(g => {
      const matchCat = currentCategory === 'all' ||
        (currentCategory === 'favorites' ? window.ArcadiaPassport?.isFavorite(g.id) : g.cat === currentCategory);
      const matchQuery = !searchQuery ||
        g.title.toLowerCase().includes(searchQuery) ||
        g.desc.toLowerCase().includes(searchQuery) ||
        g.label.toLowerCase().includes(searchQuery);
      return matchCat && matchQuery;
    });

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--dim);font-family:'Press Start 2P',monospace;font-size:11px;">
          ${currentCategory === 'favorites' ? 'NO FAVORITE GAMES YET — CLICK THE ★ ON ANY GAME TO ADD!' : 'NO GAMES FOUND MATCHING YOUR SEARCH'}
        </div>
      `;
      return;
    }

    const passport = window.ArcadiaPassport;
    grid.innerHTML = filtered.map(g => {
      const isFav = passport ? passport.isFavorite(g.id) : false;
      const hs = passport ? passport.getHighScore(g.id) : 0;
      const colorClass = g.cat === '3d' ? 'gc-teal' : g.cat === 'action' ? 'gc-red' : g.cat === 'rhythm' ? 'gc-gold' : g.cat === 'puzzle' ? 'gc-purple' : 'gc-green';
      const bgClass = g.cat === '3d' ? 'bg-teal' : g.cat === 'action' ? 'bg-red' : g.cat === 'rhythm' ? 'bg-gold' : g.cat === 'puzzle' ? 'bg-purple' : 'bg-green';

      return `
        <div class="game-card ${colorClass}" id="card-${g.id}" onclick="window.Arcadia.openGame('${g.id}')">
          <div class="card-thumb">
            <div class="card-thumb-bg ${bgClass}"></div>
            <div class="card-badge-top">
              ${g.isNew ? '<span class="card-tag tag-new">NEW</span>' : ''}
              ${g.isFeat ? '<span class="card-tag tag-feat">FEATURED</span>' : ''}
              <span class="card-tag" style="background:rgba(255,255,255,0.1);">${g.label}</span>
            </div>
            <button class="card-fav-btn ${isFav ? 'active' : ''}" onclick="event.stopPropagation(); window.Arcadia.toggleFav('${g.id}')" title="Favorite">
              ${isFav ? '★' : '☆'}
            </button>
            <div class="card-emoji">${g.emoji}</div>
          </div>
          <div class="card-body">
            <div class="card-title-row">
              <div class="card-title">${g.title}</div>
              <div class="card-hs" id="card-hs-${g.id}">${hs > 0 ? `HI: ${hs.toLocaleString()}` : ''}</div>
            </div>
            <div class="card-desc">${g.desc}</div>
            <div class="card-footer">
              <div class="card-keys">${g.keys}</div>
              <div class="card-play-hint">PLAY ▶</div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  function setupFilters() {
    const searchInput = document.getElementById('game-search-input');
    if (searchInput) {
      searchInput.oninput = (e) => {
        searchQuery = e.target.value.trim().toLowerCase();
        renderGamesGrid();
      };
    }

    const tabs = document.querySelectorAll('.cat-tab');
    tabs.forEach(tab => {
      tab.onclick = () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentCategory = tab.dataset.cat || 'all';
        renderGamesGrid();
        if (window.ArcadiaAudio) window.ArcadiaAudio.playClick();
      };
    });
  }

  function toggleFav(gameId) {
    if (!window.ArcadiaPassport) return;
    window.ArcadiaPassport.toggleFavorite(gameId);
    if (window.ArcadiaAudio) window.ArcadiaAudio.playCoin();
    renderGamesGrid();
  }

  function triggerRoulette() {
    if (window.ArcadiaAudio) window.ArcadiaAudio.playScore();
    const cards = document.querySelectorAll('.game-card');
    if (cards.length === 0) return;

    let index = 0;
    let speed = 60;
    let cycles = 20 + Math.floor(Math.random() * 10);
    let count = 0;

    const interval = () => {
      cards.forEach(c => c.style.transform = '');
      const picked = cards[index % cards.length];
      picked.style.transform = 'scale(1.06) translateY(-10px)';
      picked.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (window.ArcadiaAudio) window.ArcadiaAudio.playTone(600 + (count * 15), 0.04, 'triangle', 0.15);

      index++;
      count++;

      if (count < cycles) {
        speed *= 1.08;
        setTimeout(interval, speed);
      } else {
        setTimeout(() => {
          const gameId = picked.id.replace('card-', '');
          if (window.ArcadiaAudio) window.ArcadiaAudio.playWin();
          openGame(gameId);
        }, 300);
      }
    };
    interval();
  }

  function openGame(id) {
    currentGameId = id;
    if (window.ArcadiaPassport) window.ArcadiaPassport.recordPlay(id);

    if (id === 'minecraft') {
      openMC();
      return;
    }

    const g = GAMES.find(x => x.id === id);
    if (!g) return;

    document.getElementById('modal-overlay').classList.add('open');
    document.body.style.overflow = 'hidden';

    document.getElementById('modal-title').textContent = `${g.emoji} ${g.title}`;
    document.getElementById('game-instr').innerHTML = g.instr;
    hideGover();

    if (activeGame && activeGame.stop) activeGame.stop();
    setScore(0);

    const canvas = document.getElementById('game-canvas');
    const area = document.getElementById('game-canvas-area');
    buildOptions(id);

    const isMob = window.innerWidth <= 800;
    const W = isMob ? area.clientWidth - 8 : Math.min(620, area.clientWidth - 30);

    // Launch Game Dispatcher
    if (id === 'doom') activeGame = gameDoom(canvas, W);
    else if (id === 'crossy') activeGame = gameCrossy(canvas, W);
    else if (id === 'dash') activeGame = gameDash(canvas, W);
    else if (id === 'drift') activeGame = gameDrift(canvas, W);
    else if (id === 'jumper') activeGame = gameJumper(canvas, W);
    else if (id === 'surfer') activeGame = gameSurfer(canvas, W);
    else if (id === 'archer') activeGame = gameArcher(canvas, W);
    else if (id === 'galaga') activeGame = gameGalaga(canvas, W);
    else if (id === 'tanks') activeGame = gameTanks(canvas, W);
    else if (id === 'fruitblade') activeGame = gameFruitBlade(canvas, W);
    else if (id === 'simon') activeGame = gameSimon(canvas, W);
    else if (id === 'stack2048') activeGame = gameStack2048(canvas, W);
    else if (id === 'lasermaze') activeGame = gameLaserMaze(canvas, W);
    else if (id === 'ballz') activeGame = gameBallz(canvas, W);
    else if (id === 'connect4') activeGame = gameConnect4(canvas, W);
    else if (id === 'chess') activeGame = gameChess(canvas, W);
    else if (id === 'wordle') activeGame = gameWordle(canvas, W);
    else if (id === 'towerdefense') activeGame = gameTowerDefense(canvas, W);
    else if (id === 'pinball') activeGame = gamePinball(canvas, W);
    else if (id === 'sudoku') activeGame = gameSudoku(canvas, W);
    // Classic Games:
    else if (id === 'snake' || id === 'snakeio') activeGame = gameSnakeLobby(canvas, W);
    else if (id === 'flappy') activeGame = gameFlappy(canvas, W);
    else if (id === 'breakout') activeGame = gameBreakout(canvas, W);
    else if (id === 'asteroids') activeGame = gameAsteroids(canvas, W);
    else if (id === 'mario') activeGame = gameMario(canvas, W);
    else if (id === '2048') activeGame = game2048(canvas, W);
    else if (id === 'tetris') activeGame = gameTetris(canvas, W);
    else if (id === 'pong') activeGame = gamePong(canvas, W);
    else if (id === 'pacman') activeGame = gamePacman(canvas, W);
    else if (id === 'invaders') activeGame = gameInvaders(canvas, W);
    else if (id === 'minesweeper') activeGame = gameMinesweeper(canvas, W);
    else if (id === 'runner') activeGame = gameRunner(canvas, W);
    else if (id === 'whack') activeGame = gameWhack(canvas, W);
    else if (id === 'typing') activeGame = gameTyping(canvas, W);

    if (window.ArcadiaAudio) window.ArcadiaAudio.playClick();
  }

  function closeModal() {
    document.getElementById('modal-overlay').classList.remove('open');
    document.body.style.overflow = '';
    if (activeGame && activeGame.stop) activeGame.stop();
    activeGame = null;
    hideGover();
  }

  function openMC() {
    const ov = document.getElementById('mc-overlay');
    ov.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (activeGame && activeGame.stop) activeGame.stop();
    activeGame = null;

    const frame = document.getElementById('mc-frame');
    if (frame && (!frame.src || frame.src.indexOf('minecraft/index.html') === -1)) {
      frame.src = 'minecraft/index.html';
    }
  }

  function closeMC() {
    const ov = document.getElementById('mc-overlay');
    ov.classList.remove('open');
    document.body.style.overflow = '';
    if (document.pointerLockElement) document.exitPointerLock();
  }

  function setScore(s) {
    const el = document.getElementById('modal-score');
    if (el) el.textContent = `SCORE: ${s}`;
    if (currentGameId && typeof s === 'number' && window.ArcadiaPassport) {
      window.ArcadiaPassport.recordScore(currentGameId, s);
    }
  }

  function showGover(title, sub, onRestart) {
    const el = document.getElementById('gover');
    if (!el) return;
    document.getElementById('gover-title').textContent = title;
    document.getElementById('gover-sub').textContent = typeof sub === 'number' ? `SCORE: ${sub}` : sub;
    el.classList.add('show');

    if (currentGameId && typeof sub === 'number' && window.ArcadiaPassport) {
      window.ArcadiaPassport.recordScore(currentGameId, sub);
    }

    document.getElementById('gover-restart').onclick = () => {
      el.classList.remove('show');
      if (onRestart) onRestart();
      else if (currentGameId) openGame(currentGameId);
    };
  }

  function hideGover() {
    const el = document.getElementById('gover');
    if (el) el.classList.remove('show');
  }

  function buildOptions(id) {
    const bar = document.getElementById('options-bar');
    if (!bar) return;
    bar.innerHTML = '';

    const colors = GAME_COLORS[id];
    if (colors && colors.length > 0) {
      const clabel = document.createElement('span');
      clabel.className = 'opt-label';
      clabel.textContent = 'THEME:';
      bar.appendChild(clabel);

      colors.forEach(col => {
        const sw = document.createElement('div');
        sw.className = 'color-swatch' + (col.v === playerColors[id] ? ' active' : '');
        sw.style.background = col.v;
        sw.title = col.n;
        sw.onclick = () => {
          bar.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
          sw.classList.add('active');
          playerColors[id] = col.v;
          if (activeGame && activeGame.setColor) activeGame.setColor(col.v);
        };
        bar.appendChild(sw);
      });
    }
  }

  function setupVirtualControls() {
    const bindBtn = (id, keyCode) => {
      const el = document.getElementById(id);
      if (!el) return;
      const sendKey = (type) => {
        window.dispatchEvent(new KeyboardEvent(type, { code: keyCode, key: keyCode, bubbles: true }));
      };
      el.addEventListener('touchstart', (e) => { e.preventDefault(); sendKey('keydown'); });
      el.addEventListener('touchend', (e) => { e.preventDefault(); sendKey('keyup'); });
      el.addEventListener('mousedown', () => sendKey('keydown'));
      el.addEventListener('mouseup', () => sendKey('keyup'));
    };

    bindBtn('vpad-up', 'ArrowUp');
    bindBtn('vpad-down', 'ArrowDown');
    bindBtn('vpad-left', 'ArrowLeft');
    bindBtn('vpad-right', 'ArrowRight');
    bindBtn('vpad-a', 'Space');
    bindBtn('vpad-b', 'ShiftLeft');
  }

  function setupPassport() {
    const openBtn = document.getElementById('passport-btn');
    if (openBtn) openBtn.onclick = openPassport;

    const closeBtn = document.getElementById('passport-close-btn');
    if (closeBtn) closeBtn.onclick = closePassport;

    const modal = document.getElementById('passport-modal');
    if (modal) {
      modal.onclick = (e) => { if (e.target === modal) closePassport(); };
    }

    if (window.ArcadiaPassport) {
      window.ArcadiaPassport.updateProfileUI();
    }
  }

  function openPassport() {
    const modal = document.getElementById('passport-modal');
    if (!modal || !window.ArcadiaPassport) return;
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';

    const p = window.ArcadiaPassport;
    document.getElementById('passport-user-display').textContent = p.username;
    document.getElementById('passport-avatar-display').textContent = p.avatar;
    document.getElementById('passport-level-display').textContent = `LEVEL ${p.getLevel()}`;

    const expCur = p.exp;
    const expNext = p.getExpForNextLevel();
    const fill = document.getElementById('passport-exp-fill');
    if (fill) fill.style.width = `${Math.min(100, (expCur / expNext) * 100)}%`;

    const expText = document.getElementById('passport-exp-text');
    if (expText) expText.textContent = `${expCur} / ${expNext} EXP`;

    // Render achievements
    const achGrid = document.getElementById('passport-achievements-grid');
    if (achGrid) {
      achGrid.innerHTML = p.getAchievementsList().map(a => `
        <div class="ach-card ${a.unlocked ? 'unlocked' : ''}">
          <div class="ach-icon">${a.icon}</div>
          <div class="ach-info">
            <div class="ach-title">${a.title}</div>
            <div class="ach-desc">${a.desc}</div>
          </div>
        </div>
      `).join('');
    }

    if (window.ArcadiaAudio) window.ArcadiaAudio.playClick();
  }

  function closePassport() {
    const modal = document.getElementById('passport-modal');
    if (modal) modal.classList.remove('open');
    document.body.style.overflow = '';
  }

  function setupBackgroundStars() {
    const canvas = document.getElementById('stars');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let W = canvas.width = window.innerWidth;
    let H = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    });

    const numStars = 140;
    const stars = Array.from({ length: numStars }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.8 + 0.2,
      speed: Math.random() * 0.3 + 0.1,
      color: ['#3df5c1', '#f0c040', '#7b5cff', '#ffffff'][Math.floor(Math.random() * 4)]
    }));

    function loop() {
      ctx.clearRect(0, 0, W, H);
      stars.forEach(s => {
        s.y -= s.speed;
        if (s.y < 0) { s.y = H; s.x = Math.random() * W; }
        ctx.fillStyle = s.color;
        ctx.globalAlpha = s.alpha;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  // Global Exports
  window.Arcadia = {
    GAMES,
    openGame,
    closeModal,
    openMC,
    closeMC,
    toggleFav,
    triggerRoulette,
    openPassport,
    closePassport,
    setScore,
    showGover,
    hideGover
  };

  // Expose global aliases for classic games
  window.openGame = openGame;
  window.closeModal = closeModal;
  window.openMC = openMC;
  window.closeMC = closeMC;
  window.setScore = setScore;
  window.showGover = showGover;
  window.hideGover = hideGover;

  window.addEventListener('DOMContentLoaded', initPortal);
})(window);
