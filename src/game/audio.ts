/**
 * Retro NES Chiptune Synthesizer using Web Audio API
 * Generates authentic 8-bit sound effects and background music
 */

import { WeaponType, MusicMood } from '../types';

class RetroAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private bgmInterval: number | null = null;
  private bgmStep: number = 0;
  private isBgmPlaying: boolean = false;
  private currentMood: MusicMood = 'epic';
  private customAudio: HTMLAudioElement | null = null;
  private customAudioUrl: string | null = null;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  public init() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public enableAudio() {
    this.init();
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.3, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // --- SOUND EFFECTS ---

  public playShoot(weapon: WeaponType = 'R') {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;

    switch (weapon) {
      case 'S': {
        // Spread Gun: punchy multi-frequency burst
        [280, 420, 560].forEach((freq, i) => {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(freq, t);
          osc.frequency.exponentialRampToValueAtTime(70, t + 0.12);
          gain.gain.setValueAtTime(0.2, t + i * 0.01);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
          osc.connect(gain);
          gain.connect(this.masterGain!);
          osc.start(t + i * 0.01);
          osc.stop(t + 0.13);
        });
        break;
      }
      case 'L': {
        // Laser Gun: fast frequency sweep
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1200, t);
        osc.frequency.exponentialRampToValueAtTime(180, t + 0.18);
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.18);
        break;
      }
      case 'F': {
        // Flame Gun: low rumble burst with noise
        this.playNoise(0.18, 200, 0.25);
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(160, t);
        osc.frequency.exponentialRampToValueAtTime(60, t + 0.2);
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.2);
        break;
      }
      case 'M': {
        // Machine Gun: rapid sharp pulse
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(360, t);
        osc.frequency.exponentialRampToValueAtTime(90, t + 0.07);
        gain.gain.setValueAtTime(0.22, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.07);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.07);
        break;
      }
      case 'R':
      default: {
        // Default Rifle: crisp classic pulse pop
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(320, t);
        osc.frequency.exponentialRampToValueAtTime(80, t + 0.09);
        gain.gain.setValueAtTime(0.22, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.09);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.09);
        break;
      }
    }
  }

  public playEnemyShoot() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(90, t + 0.1);
    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  public playJump() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(450, t + 0.15);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  public playWaterSplash() {
    if (this.isMuted) return;
    this.playNoise(0.12, 500, 0.16);
  }

  public playExplosion(isBig: boolean = false) {
    if (this.isMuted) return;
    this.playNoise(isBig ? 0.45 : 0.25, isBig ? 120 : 300, isBig ? 0.4 : 0.25);
  }

  public playPlayerHit() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    // Rapid descending arpeggio
    const freqs = [350, 280, 210, 140, 70];
    freqs.forEach((f, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, t + i * 0.05);
      gain.gain.setValueAtTime(0.25, t + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, t + (i + 1) * 0.05);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(t + i * 0.05);
      osc.stop(t + (i + 1) * 0.05);
    });
  }

  public playPowerUp() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    // Ascending victory chime
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25];
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, t + idx * 0.06);
      gain.gain.setValueAtTime(0.2, t + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.01, t + idx * 0.06 + 0.1);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(t + idx * 0.06);
      osc.stop(t + idx * 0.06 + 0.12);
    });
  }

  public playKonamiSecret() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    // 30 Lives fanfare
    const notes = [392, 523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.08);
      gain.gain.setValueAtTime(0.3, t + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, t + idx * 0.08 + 0.18);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(t + idx * 0.08);
      osc.stop(t + idx * 0.08 + 0.2);
    });
  }

  public playBossHit() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(70, t + 0.06);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.06);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.06);
  }

  // Noise generator for retro explosions and percussion
  private playNoise(duration: number, cutoff: number, volume: number = 0.2) {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoff, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start();
    noise.stop(this.ctx.currentTime + duration);
  }

  public playDogBark() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    // Retro playful puppy yip
    [320, 480].forEach((f, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, t + i * 0.08);
      osc.frequency.exponentialRampToValueAtTime(160, t + i * 0.08 + 0.07);
      gain.gain.setValueAtTime(0.22, t + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, t + i * 0.08 + 0.07);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(t + i * 0.08);
      osc.stop(t + i * 0.08 + 0.08);
    });
  }

  public playFishSplash() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    // Bubbly aquatic sparkle
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t + i * 0.04);
      gain.gain.setValueAtTime(0.18, t + i * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.01, t + i * 0.04 + 0.09);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(t + i * 0.04);
      osc.stop(t + i * 0.04 + 0.1);
    });
    this.playNoise(0.12, 1200, 0.15);
  }

  public playCivilianCheer() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    // Cheerful arpeggio fanfare
    [440, 554.37, 659.25, 880].forEach((f, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(f, t + i * 0.05);
      gain.gain.setValueAtTime(0.15, t + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, t + i * 0.05 + 0.14);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(t + i * 0.05);
      osc.stop(t + i * 0.05 + 0.15);
    });
  }

  public playCashRegister() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    // Ka-ching coin chime
    [987.77, 1318.51].forEach((f, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t + i * 0.09);
      gain.gain.setValueAtTime(0.24, t + i * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.01, t + i * 0.09 + 0.28);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(t + i * 0.09);
      osc.stop(t + i * 0.09 + 0.3);
    });
  }

  public play1Up() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    // Classic 1-UP fanfare
    const notes = [659.25, 783.99, 1318.5, 1046.5, 1174.66, 1567.98];
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.07);
      gain.gain.setValueAtTime(0.22, t + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.01, t + idx * 0.07 + 0.12);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(t + idx * 0.07);
      osc.stop(t + idx * 0.07 + 0.14);
    });
  }

  // --- BACKGROUND CHIPTUNE MUSIC & MOOD SELECTOR ---

  public getMood(): MusicMood {
    return this.currentMood;
  }

  public setMood(mood: MusicMood) {
    this.currentMood = mood;
    if (this.isBgmPlaying) {
      this.stopBGM();
      this.startBGM();
    }
  }

  public setCustomMusic(file: File) {
    if (this.customAudioUrl) {
      URL.revokeObjectURL(this.customAudioUrl);
    }
    this.customAudioUrl = URL.createObjectURL(file);
    if (this.customAudio) {
      this.customAudio.pause();
    }
    this.customAudio = new Audio(this.customAudioUrl);
    this.customAudio.loop = true;
    this.customAudio.volume = this.isMuted ? 0 : 0.5;
    this.setMood('custom');
  }

  public startBGM(type: 'stage' | 'boss' = 'stage') {
    if (this.isBgmPlaying) return;
    this.init();
    this.isBgmPlaying = true;
    this.bgmStep = 0;

    // Handle Custom Audio file
    if (this.currentMood === 'custom' && this.customAudio) {
      this.customAudio.volume = this.isMuted ? 0 : 0.5;
      this.customAudio.play().catch(() => {});
      return;
    }

    // Mood-specific musical profiles
    let bassline: number[] = [];
    let melody: number[] = [];
    let stepDuration = 120;
    let snareStep1 = 4;
    let snareStep2 = 12;

    switch (this.currentMood) {
      case 'boss_rush': {
        // High tempo, aggressive driving metal chiptune
        stepDuration = 90;
        bassline = [
          146.83, 146.83, 174.61, 146.83, 196.0, 174.61, 220.0, 196.0,
          146.83, 146.83, 174.61, 146.83, 130.81, 146.83, 164.81, 174.61
        ];
        melody = [
          587.33, 0, 698.46, 587.33, 783.99, 0, 698.46, 587.33,
          523.25, 0, 587.33, 698.46, 783.99, 880.0, 783.99, 698.46
        ];
        snareStep1 = 2;
        snareStep2 = 10;
        break;
      }
      case 'chill': {
        // Relaxing, dreamy Synthwave adventure
        stepDuration = 160;
        bassline = [
          130.81, 0, 130.81, 0, 164.81, 0, 196.0, 0,
          146.83, 0, 146.83, 0, 174.61, 0, 220.0, 0
        ];
        melody = [
          523.25, 0, 659.25, 0, 783.99, 0, 659.25, 523.25,
          587.33, 0, 698.46, 0, 880.0, 0, 783.99, 698.46
        ];
        snareStep1 = 6;
        snareStep2 = 14;
        break;
      }
      case 'jungle_mystic': {
        // Highland Pentatonic Vietnamese / Ancient forest flute synth
        stepDuration = 130;
        bassline = [
          110, 0, 110, 130.81, 110, 0, 146.83, 0,
          98, 0, 110, 0, 130.81, 146.83, 110, 98
        ];
        melody = [
          440, 493.88, 523.25, 0, 659.25, 0, 523.25, 440,
          392, 0, 440, 523.25, 659.25, 0, 783.99, 659.25
        ];
        snareStep1 = 4;
        snareStep2 = 12;
        break;
      }
      case 'epic':
      default: {
        // Authentic Contra Jungle theme rhythm bass & lead
        stepDuration = 120;
        bassline = [
          110, 110, 130.81, 110, 146.83, 110, 164.81, 146.83,
          110, 110, 130.81, 110, 98, 110, 123.47, 130.81
        ];
        melody = [
          440, 0, 440, 523.25, 0, 587.33, 523.25, 440,
          392, 0, 440, 0, 523.25, 0, 587.33, 659.25
        ];
        snareStep1 = 4;
        snareStep2 = 12;
        break;
      }
    }

    this.bgmInterval = window.setInterval(() => {
      if (this.isMuted || !this.ctx || !this.masterGain) return;
      const t = this.ctx.currentTime;
      const stepIdx = this.bgmStep % bassline.length;

      // Bass note
      const bassFreq = bassline[stepIdx];
      if (bassFreq > 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = this.currentMood === 'boss_rush' ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(bassFreq, t);
        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.11);
      }

      // Melody note
      const melFreq = melody[stepIdx];
      if (melFreq > 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = this.currentMood === 'jungle_mystic' ? 'sine' : 'square';
        osc.frequency.setValueAtTime(melFreq, t);
        gain.gain.setValueAtTime(0.13, t);
        gain.gain.exponentialRampToValueAtTime(0.005, t + 0.15);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.16);
      }

      // Percussion snare
      if (stepIdx === snareStep1 || stepIdx === snareStep2) {
        this.playNoise(0.05, 800, 0.08);
      }

      this.bgmStep++;
    }, stepDuration);
  }

  public stopBGM() {
    if (this.customAudio) {
      this.customAudio.pause();
    }
    if (this.bgmInterval !== null) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
    this.isBgmPlaying = false;
  }
}

export const audio = new RetroAudioEngine();
