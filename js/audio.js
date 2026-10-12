// Arcadia Unified Web Audio Sound System
// Pure Web Audio API synthesized retro sound effects & chiptune audio
(function(window) {
  class SoundSystem {
    constructor() {
      this.ctx = null;
      this.master = null;
      this.muted = localStorage.getItem('arcadia_muted') === 'true';
      this.volume = parseFloat(localStorage.getItem('arcadia_vol') || '0.35');
      this.bgmPlaying = false;
      this.bgmTimer = null;
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        this.ctx = new AudioCtx();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : this.volume;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    setMuted(m) {
      this.muted = m;
      localStorage.setItem('arcadia_muted', String(m));
      if (this.master) {
        this.master.gain.value = this.muted ? 0 : this.volume;
      }
      const btn = document.getElementById('sound-toggle-btn');
      if (btn) {
        btn.innerHTML = this.muted ? '🔇 <span class="nav-btn-text">MUTED</span>' : '🔊 <span class="nav-btn-text">SOUND ON</span>';
        btn.classList.toggle('muted', this.muted);
      }
    }

    toggleMute() {
      this.setMuted(!this.muted);
      if (!this.muted) this.playClick();
      return this.muted;
    }

    playTone(freq, duration = 0.1, type = 'square', gain = 0.3) {
      if (this.muted) return;
      this.init();
      if (!this.ctx || !this.master) return;
      try {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        const now = this.ctx.currentTime;
        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);
        g.gain.setValueAtTime(gain, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + duration);
        osc.connect(g);
        g.connect(this.master);
        osc.start(now);
        osc.stop(now + duration);
      } catch(e){}
    }

    playClick() {
      this.playTone(880, 0.04, 'triangle', 0.2);
    }

    playScore() {
      this.playTone(587.33, 0.08, 'square', 0.18);
      setTimeout(() => this.playTone(880, 0.1, 'square', 0.2), 60);
    }

    playCoin() {
      if (this.muted) return;
      this.init();
      if (!this.ctx || !this.master) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(987.77, now); // B5
        osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6
        g.gain.setValueAtTime(0.3, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(g);
        g.connect(this.master);
        osc.start(now);
        osc.stop(now + 0.35);
      } catch(e){}
    }

    playLaser() {
      if (this.muted) return;
      this.init();
      if (!this.ctx || !this.master) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.12);
        g.gain.setValueAtTime(0.25, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(g);
        g.connect(this.master);
        osc.start(now);
        osc.stop(now + 0.12);
      } catch(e){}
    }

    playJump() {
      if (this.muted) return;
      this.init();
      if (!this.ctx || !this.master) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.14);
        g.gain.setValueAtTime(0.25, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        osc.connect(g);
        g.connect(this.master);
        osc.start(now);
        osc.stop(now + 0.14);
      } catch(e){}
    }

    playHit() {
      if (this.muted) return;
      this.init();
      if (!this.ctx || !this.master) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);
        g.gain.setValueAtTime(0.3, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.connect(g);
        g.connect(this.master);
        osc.start(now);
        osc.stop(now + 0.1);
      } catch(e){}
    }

    playExplosion() {
      if (this.muted) return;
      this.init();
      if (!this.ctx || !this.master) return;
      try {
        const now = this.ctx.currentTime;
        const bufferSize = this.ctx.sampleRate * 0.35;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(500, now);
        filter.frequency.exponentialRampToValueAtTime(60, now + 0.35);
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.5, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        noise.connect(filter);
        filter.connect(g);
        g.connect(this.master);
        noise.start(now);
      } catch(e){}
    }

    playPowerup() {
      if (this.muted) return;
      const notes = [330, 392, 493.88, 587.33, 659.25, 783.99];
      notes.forEach((f, idx) => {
        setTimeout(() => this.playTone(f, 0.08, 'triangle', 0.2), idx * 45);
      });
    }

    playGameOver() {
      if (this.muted) return;
      const notes = [440, 415.3, 392, 349.23];
      notes.forEach((f, idx) => {
        setTimeout(() => this.playTone(f, 0.2, 'sawtooth', 0.25), idx * 120);
      });
    }

    playWin() {
      if (this.muted) return;
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((f, idx) => {
        setTimeout(() => this.playTone(f, 0.22, 'sine', 0.28), idx * 80);
      });
    }

    playCombo() {
      this.playTone(1046.5, 0.12, 'square', 0.22);
    }
  }

  window.ArcadiaAudio = new SoundSystem();
})(window);
