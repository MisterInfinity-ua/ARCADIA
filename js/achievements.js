// Arcadia Player Passport, EXP, High Scores & Achievement System
(function(window) {
  const ACHIEVEMENTS_DEF = [
    { id: 'first_game', icon: '🪙', title: 'Insert Coin', desc: 'Play your very first game on Arcadia', exp: 100 },
    { id: 'minecraft_explorer', icon: '⛏️', title: 'Voxel Pioneer', desc: 'Launch the new Minecraft 3D world engine', exp: 250 },
    { id: 'doom_slayer', icon: '🔫', title: 'Cyber Slayer', desc: 'Defeat demonic cyborgs in DOOM 3D', exp: 200 },
    { id: 'crossy_hopper', icon: '🐸', title: 'Crossy Master', desc: 'Reach Row 30 in Crossy Cyber', exp: 150 },
    { id: 'jumper_orbit', icon: '🚀', title: 'To The Stars', desc: 'Reach 2000+ altitude in Cyber Jumper', exp: 150 },
    { id: 'drift_king', icon: '🏎️', title: 'Neon Drifter', desc: 'Burn rubber and complete laps in Retro Drift', exp: 150 },
    { id: 'dash_rhythm', icon: '⚡', title: 'Cyber Dasher', desc: 'Reach 50%+ progress in Cyber Dash', exp: 200 },
    { id: 'surfer_pro', icon: '🛹', title: 'Subway Surfer', desc: 'Score 1000+ in Cyber Surfer', exp: 150 },
    { id: 'archer_sniper', icon: '🏹', title: 'Bullseye', desc: 'Land accurate bow headshots in Cyber Archer', exp: 150 },
    { id: 'galaga_ace', icon: '🛸', title: 'Galaga Ace', desc: 'Clear a full wave of alien invaders in Galaga', exp: 150 },
    { id: 'tank_commander', icon: '💥', title: 'Tank Marshal', desc: 'Destroy enemy heavy tanks in Neon Tank War', exp: 150 },
    { id: 'fruit_slicer', icon: '🍉', title: 'Blade Master', desc: 'Slice juicy fruits in Fruit Blade', exp: 150 },
    { id: 'simon_master', icon: '🧠', title: 'Memory Savant', desc: 'Reach Level 5 sequence in Memory Matrix', exp: 150 },
    { id: 'stack_combo', icon: '🔢', title: '2048 Cascade', desc: 'Trigger chain reaction merges in Stack 2048', exp: 150 },
    { id: 'laser_optics', icon: '💡', title: 'Photonics Guru', desc: 'Solve optical puzzle stages in Laser Maze', exp: 150 },
    { id: 'ballz_crusher', icon: '⚪', title: 'Ball Stream', desc: 'Fire 30+ balls in Ballz Breaker', exp: 150 },
    { id: 'chess_master', icon: '♟️', title: 'Grandmaster', desc: 'Achieve checkmate in Chess Master', exp: 300 },
    { id: 'connect4_champ', icon: '🔴', title: 'Strategic Connect', desc: 'Win a match in Connect Four', exp: 150 },
    { id: 'wordle_solver', icon: '🟩', title: 'Word Craze', desc: 'Crack the secret 5-letter word in Wordle', exp: 200 },
    { id: 'tower_marshal', icon: '🏰', title: 'Tower Marshal', desc: 'Survive wave 10 in Arcadia Tower Defense', exp: 250 },
    { id: 'pinball_wizard', icon: '🕹️', title: 'Pinball Wizard', desc: 'Score over 10,000 points in Cyber Pinball', exp: 200 },
    { id: 'sudoku_solver', icon: '🧩', title: 'Sudoku Genius', desc: 'Solve a full 9x9 Sudoku board', exp: 250 },
    { id: 'snake_master', icon: '🐍', title: 'Snake King', desc: 'Reach a length of 50 in Snake', exp: 150 },
    { id: 'flappy_ace', icon: '🐦', title: 'Sky Aviator', desc: 'Score 15+ pipes in Flappy Bird', exp: 200 },
    { id: 'arcade_veteran', icon: '👑', title: 'Arcade Legend', desc: 'Play 15 different games in Arcadia', exp: 500 }
  ];

  class ArcadiaPassport {
    constructor() {
      this.load();
    }

    load() {
      this.username = localStorage.getItem('arcadia_user') || 'PLAYER 1';
      this.avatar = localStorage.getItem('arcadia_avatar') || '👾';
      this.exp = parseInt(localStorage.getItem('arcadia_exp') || '0', 10);
      this.highScores = JSON.parse(localStorage.getItem('arcadia_scores') || '{}');
      this.playedGames = JSON.parse(localStorage.getItem('arcadia_played') || '[]');
      this.unlocked = JSON.parse(localStorage.getItem('arcadia_achievements') || '[]');
      this.favorites = JSON.parse(localStorage.getItem('arcadia_favorites') || '[]');
    }

    save() {
      localStorage.setItem('arcadia_user', this.username);
      localStorage.setItem('arcadia_avatar', this.avatar);
      localStorage.setItem('arcadia_exp', String(this.exp));
      localStorage.setItem('arcadia_scores', JSON.stringify(this.highScores));
      localStorage.setItem('arcadia_played', JSON.stringify(this.playedGames));
      localStorage.setItem('arcadia_achievements', JSON.stringify(this.unlocked));
      localStorage.setItem('arcadia_favorites', JSON.stringify(this.favorites));
    }

    getLevel() {
      return Math.floor(Math.sqrt(this.exp / 100)) + 1;
    }

    getExpForNextLevel() {
      const curLvl = this.getLevel();
      return curLvl * curLvl * 100;
    }

    addExp(amount) {
      const oldLvl = this.getLevel();
      this.exp += amount;
      this.save();
      const newLvl = this.getLevel();
      if (newLvl > oldLvl) {
        this.showToast('⭐ LEVEL UP!', `Congratulations! You reached Level ${newLvl}!`, 'level-up');
        if (window.ArcadiaAudio) window.ArcadiaAudio.playPowerup();
      }
      this.updateProfileUI();
    }

    recordScore(gameId, score) {
      if (typeof score !== 'number' || isNaN(score)) return false;
      const prev = this.highScores[gameId] || 0;
      let isNew = false;
      if (score > prev) {
        this.highScores[gameId] = score;
        isNew = true;
        this.addExp(Math.min(500, Math.max(20, Math.floor(score / 5))));
      }
      this.save();
      this.updateCardHighScore(gameId, this.highScores[gameId]);
      return isNew;
    }

    getHighScore(gameId) {
      return this.highScores[gameId] || 0;
    }

    recordPlay(gameId) {
      if (!this.playedGames.includes(gameId)) {
        this.playedGames.push(gameId);
      }
      this.addExp(25);
      this.save();
      
      this.unlock('first_game');
      if (gameId === 'minecraft') this.unlock('minecraft_explorer');
      if (this.playedGames.length >= 15) this.unlock('arcade_veteran');
      this.updateProfileUI();
    }

    toggleFavorite(gameId) {
      const idx = this.favorites.indexOf(gameId);
      if (idx >= 0) {
        this.favorites.splice(idx, 1);
      } else {
        this.favorites.push(gameId);
      }
      this.save();
      return this.isFavorite(gameId);
    }

    isFavorite(gameId) {
      return this.favorites.includes(gameId);
    }

    unlock(achievementId) {
      if (this.unlocked.includes(achievementId)) return;
      const def = ACHIEVEMENTS_DEF.find(a => a.id === achievementId);
      if (!def) return;

      this.unlocked.push(achievementId);
      this.addExp(def.exp);
      this.save();

      this.showToast(`${def.icon} ACHIEVEMENT UNLOCKED!`, `${def.title}: ${def.desc} (+${def.exp} EXP)`, 'achievement');
      if (window.ArcadiaAudio) window.ArcadiaAudio.playWin();
    }

    showToast(title, desc, type = 'normal') {
      let container = document.getElementById('arcadia-toasts');
      if (!container) {
        container = document.createElement('div');
        container.id = 'arcadia-toasts';
        container.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:999999;display:flex;flex-direction:column;gap:12px;pointer-events:none;';
        document.body.appendChild(container);
      }

      const toast = document.createElement('div');
      toast.className = `arcadia-toast toast-${type}`;
      toast.style.cssText = 'background:rgba(13,11,26,0.95);border:2px solid var(--c1);box-shadow:0 8px 32px rgba(240,192,64,0.3);padding:14px 20px;border-radius:4px;color:#f0e8ff;font-family:sans-serif;min-width:280px;max-width:380px;transform:translateX(120%);transition:transform 0.3s cubic-bezier(0.18,0.89,0.32,1.28);pointer-events:auto;';
      toast.innerHTML = `
        <div style="font-family:'Press Start 2P',monospace;font-size:10px;color:var(--c1);margin-bottom:6px;letter-spacing:1px;">${title}</div>
        <div style="font-family:'Rajdhani',sans-serif;font-size:14px;color:#d8d0ee;font-weight:600;">${desc}</div>
      `;
      container.appendChild(toast);

      requestAnimationFrame(() => {
        toast.style.transform = 'translateX(0)';
      });

      setTimeout(() => {
        toast.style.transform = 'translateX(120%)';
        setTimeout(() => toast.remove(), 400);
      }, 4200);
    }

    updateCardHighScore(gameId, score) {
      const el = document.getElementById(`card-hs-${gameId}`);
      if (el) el.textContent = score > 0 ? `HI: ${score.toLocaleString()}` : '';
    }

    updateProfileUI() {
      const lvlEl = document.getElementById('user-level-badge');
      if (lvlEl) lvlEl.textContent = `LVL ${this.getLevel()}`;
      const expEl = document.getElementById('user-exp-text');
      if (expEl) expEl.textContent = `${this.exp} EXP`;
    }

    getAchievementsList() {
      return ACHIEVEMENTS_DEF.map(a => ({
        ...a,
        unlocked: this.unlocked.includes(a.id)
      }));
    }
  }

  window.ArcadiaPassport = new ArcadiaPassport();
})(window);
