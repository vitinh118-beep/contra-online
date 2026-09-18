import { Particle } from '../types';

export class ParticleSystem {
  public particles: Particle[] = [];

  public update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;

      if (p.type === 'debris' || p.type === 'water') {
        p.vy += 0.25; // gravity for debris/water
      }

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  public addExplosion(x: number, y: number, isBig: boolean = false) {
    const count = isBig ? 24 : 14;
    const colors = ['#ef4444', '#f97316', '#facc15', '#ffffff'];

    // Expanding shockwave ring
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      radius: isBig ? 22 : 12,
      color: '#facc15',
      alpha: 1,
      decay: 0.06,
      type: 'ring',
    });

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * (isBig ? 4.5 : 2.8) + 0.8;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: colors[Math.floor(Math.random() * colors.length)],
        radius: Math.random() * (isBig ? 4 : 2.5) + 1.5,
        alpha: 1,
        decay: Math.random() * 0.04 + 0.02,
        type: 'spark',
      });
    }

    // Smoke puffs
    for (let i = 0; i < (isBig ? 8 : 4); i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 16,
        y: y + (Math.random() - 0.5) * 16,
        vx: (Math.random() - 0.5) * 1,
        vy: -Math.random() * 1.5 - 0.5,
        color: '#64748b',
        radius: Math.random() * 5 + 3,
        alpha: 0.7,
        decay: 0.02,
        type: 'smoke',
      });
    }
  }

  public addWaterSplash(x: number, y: number) {
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 12,
        y,
        vx: (Math.random() - 0.5) * 2.5,
        vy: -Math.random() * 3.5 - 1.5,
        color: '#38bdf8',
        radius: Math.random() * 2 + 1,
        alpha: 1,
        decay: 0.04,
        type: 'water',
      });
    }
  }

  public addWaterBubbles(x: number, y: number) {
    for (let i = 0; i < 3; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 8,
        y: y + Math.random() * 4,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -Math.random() * 1.2 - 0.4,
        color: '#bae6fd',
        radius: Math.random() * 1.5 + 0.8,
        alpha: 0.85,
        decay: 0.03,
        type: 'smoke',
      });
    }
  }

  public addHitSpark(x: number, y: number) {
    for (let i = 0; i < 5; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 2 + 1;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: '#fef08a',
        radius: 1.5,
        alpha: 1,
        decay: 0.08,
        type: 'spark',
      });
    }
  }

  public addScore(x: number, y: number, points: number) {
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: -0.6,
      color: '#fbbf24',
      radius: 0,
      alpha: 1,
      decay: 0.025,
      type: 'score',
      text: `+${points}`,
    });
  }

  public clear() {
    this.particles = [];
  }
}
