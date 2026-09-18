/**
 * Pixel Art Procedural Sprite Renderer
 * Accurately mimics NES Contra aesthetics using crisp pixel scaling
 */

import { Player, Enemy, Bullet, PowerUpItem, Particle, Platform, NPC } from '../types';

export class SpriteRenderer {
  /**
   * Draw Player (Bill or Lance)
   */
  public static drawPlayer(ctx: CanvasRenderingContext2D, p: Player) {
    if (p.state === 'dead') return;

    // Blink when invulnerable after respawning
    if (p.invulnerableTime > 0 && Math.floor(p.invulnerableTime / 4) % 2 === 0) {
      return;
    }

    ctx.save();
    ctx.translate(Math.round(p.x), Math.round(p.y));

    // Flip horizontally based on facing
    if (p.facing === -1) {
      ctx.scale(-1, 1);
    }

    const isLance = p.id === 2;
    const pantsColor = isLance ? '#22c55e' : '#3b82f6'; // Lance green/Bill blue pants
    const hairColor = isLance ? '#1e293b' : '#f59e0b'; // Lance black / Bill blonde
    const bandanaColor = isLance ? '#dc2626' : '#2563eb'; // Lance red / Bill blue
    const skinColor = '#fed7aa';
    const gunColor = '#94a3b8';

    // 1. SOMERSAULT SPIN JUMP (Classic Contra Jump Animation)
    if (p.state === 'jump') {
      const angle = (p.animTimer * 0.45) % (Math.PI * 2);
      ctx.rotate(angle);

      // Tucked ball body
      ctx.fillStyle = bandanaColor;
      ctx.beginPath();
      ctx.arc(0, 0, 11, 0, Math.PI * 2);
      ctx.fill();

      // Inner details
      ctx.fillStyle = pantsColor;
      ctx.beginPath();
      ctx.arc(-2, 2, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = skinColor;
      ctx.beginPath();
      ctx.arc(2, -2, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // Render barrier shield if active
      if (p.barrierTime > 0) {
        this.drawBarrierShield(ctx, p.x, p.y, p.barrierTime);
      }
      return;
    }

    // 2. PRONE (LYING DOWN)
    if (p.state === 'prone') {
      // Body on ground
      ctx.fillStyle = pantsColor;
      ctx.fillRect(-12, -7, 14, 7); // legs

      ctx.fillStyle = skinColor;
      ctx.fillRect(2, -8, 8, 7); // torso

      ctx.fillStyle = hairColor;
      ctx.fillRect(6, -11, 6, 5); // head

      ctx.fillStyle = bandanaColor;
      ctx.fillRect(4, -9, 8, 2);

      // Gun pointed forward along the ground
      ctx.fillStyle = gunColor;
      ctx.fillRect(8, -5, 14, 3);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(16, -6, 2, 2);

      ctx.restore();
      if (p.barrierTime > 0) {
        this.drawBarrierShield(ctx, p.x, p.y, p.barrierTime);
      }
      return;
    }

    // 3. SWIMMING IN WATER
    if (p.state === 'swimming') {
      if (p.isSubmerged) {
        // Submerged diving under water (dodging bullets like classic NES Contra!)
        // Underwater silhouette
        ctx.fillStyle = 'rgba(2, 132, 199, 0.7)';
        ctx.fillRect(-5, 2, 10, 8);
        ctx.fillStyle = 'rgba(3, 105, 161, 0.8)';
        ctx.fillRect(-4, 0, 8, 4);

        // Water surface foam ripples
        ctx.fillStyle = '#38bdf8';
        const wave = Math.sin(p.animTimer * 0.2) * 1.5;
        ctx.fillRect(-12, -2 + wave, 24, 2);
        ctx.fillStyle = '#e0f2fe';
        ctx.fillRect(-8, -1 + wave, 16, 1);

        // Air bubbles rising to the water surface
        const b1 = (p.animTimer % 24) * 0.35;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-2 + Math.sin(p.animTimer * 0.3) * 2, -2 - b1, 2, 2);
        if (p.animTimer % 36 > 18) {
          const b2 = ((p.animTimer + 12) % 24) * 0.35;
          ctx.fillRect(3 + Math.cos(p.animTimer * 0.3) * 2, -2 - b2, 2, 2);
        }

        ctx.restore();
        if (p.barrierTime > 0) {
          this.drawBarrierShield(ctx, p.x, p.y, p.barrierTime);
        }
        return;
      }

      // Surfaced Swimming
      // Head and bandana above water
      ctx.fillStyle = hairColor;
      ctx.fillRect(-4, -14, 8, 6);

      ctx.fillStyle = bandanaColor;
      ctx.fillRect(-5, -12, 10, 3);

      ctx.fillStyle = skinColor;
      ctx.fillRect(-3, -8, 7, 5); // face

      // Gun sticking out of water
      if (p.isAimingUp) {
        ctx.fillStyle = gunColor;
        ctx.fillRect(0, -22, 3, 14);
      } else {
        ctx.fillStyle = gunColor;
        ctx.fillRect(2, -9, 12, 3);
      }

      // Water ripples at surface
      ctx.fillStyle = '#38bdf8';
      const wave = Math.sin(p.animTimer * 0.15) * 2;
      ctx.fillRect(-10, -2 + wave, 20, 2);
      ctx.fillStyle = '#bae6fd';
      ctx.fillRect(-7, -1 + wave, 14, 1);

      ctx.restore();
      if (p.barrierTime > 0) {
        this.drawBarrierShield(ctx, p.x, p.y, p.barrierTime);
      }
      return;
    }

    // 4. STANDING OR RUNNING ON PLATFORMS
    // Legs animation
    const frame = p.state === 'run' ? Math.floor(p.animFrame) % 4 : 0;

    ctx.fillStyle = pantsColor;
    if (frame === 0) {
      ctx.fillRect(-6, 0, 5, 12);
      ctx.fillRect(1, 0, 5, 12);
    } else if (frame === 1) {
      ctx.fillRect(-9, 0, 5, 11);
      ctx.fillRect(2, 0, 6, 12);
    } else if (frame === 2) {
      ctx.fillRect(-4, 0, 5, 12);
      ctx.fillRect(1, 0, 5, 11);
    } else {
      ctx.fillRect(-2, 0, 6, 12);
      ctx.fillRect(4, 0, 5, 10);
    }

    // Boots
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-6, 10, 5, 3);
    ctx.fillRect(2, 10, 5, 3);

    // Torso & Bare Chest / Muscles
    ctx.fillStyle = skinColor;
    ctx.fillRect(-5, -12, 10, 12);

    // Ammo belt across chest
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-4, -10, 8, 2);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(-2, -10, 2, 2);
    ctx.fillRect(2, -10, 2, 2);

    // Head
    ctx.fillStyle = hairColor;
    ctx.fillRect(-4, -20, 8, 7);

    // Bandana & trailing ribbon
    ctx.fillStyle = bandanaColor;
    ctx.fillRect(-5, -17, 10, 3);
    const ribbonWave = Math.sin(p.animTimer * 0.2) * 2;
    ctx.fillRect(-8, -17 + ribbonWave, 4, 2);

    // Face
    ctx.fillStyle = skinColor;
    ctx.fillRect(-2, -14, 6, 4);

    // Gun Rendering based on 8-way aiming
    ctx.fillStyle = gunColor;
    if (p.isAimingUp) {
      if (p.state === 'run') {
        // Diagonal up-forward
        ctx.fillRect(1, -20, 4, 12);
        ctx.fillRect(4, -22, 4, 4);
        ctx.fillRect(7, -24, 3, 3);
      } else {
        // Straight up
        ctx.fillRect(1, -28, 4, 18);
        ctx.fillRect(2, -30, 2, 3);
      }
    } else if (p.isAimingDown && !p.isGrounded) {
      // Diagonal down-forward while jumping
      ctx.fillRect(3, -4, 5, 8);
      ctx.fillRect(6, 3, 4, 4);
      ctx.fillRect(8, 6, 3, 3);
    } else {
      // Straight forward
      ctx.fillRect(2, -9, 16, 4);
      ctx.fillStyle = '#334155';
      ctx.fillRect(6, -6, 3, 4); // handle
      ctx.fillRect(14, -8, 2, 2); // sight
    }

    ctx.restore();

    // Barrier Shield Effect
    if (p.barrierTime > 0) {
      this.drawBarrierShield(ctx, p.x, p.y, p.barrierTime);
    }
  }

  /**
   * Sparkling shield around player
   */
  private static drawBarrierShield(ctx: CanvasRenderingContext2D, x: number, y: number, time: number) {
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));

    const numOrbs = 6;
    const radius = 22;
    const baseAngle = time * 0.15;

    for (let i = 0; i < numOrbs; i++) {
      const angle = baseAngle + (i * Math.PI * 2) / numOrbs;
      const ox = Math.cos(angle) * radius;
      const oy = Math.sin(angle) * radius * 1.2;

      const colors = ['#f43f5e', '#38bdf8', '#fbbf24', '#a855f7'];
      ctx.fillStyle = colors[(i + Math.floor(time / 4)) % colors.length];
      ctx.beginPath();
      ctx.arc(ox, oy, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  /**
   * Draw Enemies: Foot Soldiers, Snipers, Turrets, Capsules, Bosses
   */
  public static drawEnemy(
    ctx: CanvasRenderingContext2D, 
    e: Enemy, 
    customBossImg?: HTMLImageElement | null, 
    customBossName?: string
  ) {
    if (!e.active) return;

    ctx.save();
    ctx.translate(Math.round(e.x), Math.round(e.y));

    switch (e.type) {
      case 'soldier': {
        if (e.facing === 1) ctx.scale(-1, 1);
        const frame = Math.floor(e.animFrame) % 4;

        // Red soldier uniform
        ctx.fillStyle = '#dc2626';
        if (frame === 0) {
          ctx.fillRect(-5, 0, 4, 11);
          ctx.fillRect(1, 0, 4, 11);
        } else {
          ctx.fillRect(-7, 0, 5, 10);
          ctx.fillRect(2, 0, 5, 10);
        }

        // Helmet & head
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(-4, -18, 8, 6);
        ctx.fillStyle = '#fca5a5';
        ctx.fillRect(-2, -14, 5, 3);

        // Torso
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(-4, -11, 8, 11);

        // Rifle
        ctx.fillStyle = '#475569';
        ctx.fillRect(1, -8, 11, 3);
        break;
      }

      case 'sniper': {
        if (e.facing === 1) ctx.scale(-1, 1);
        // Crouched sniper in blue gear
        ctx.fillStyle = '#1e3a8a';
        ctx.fillRect(-6, -6, 12, 8); // body
        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(-3, -12, 6, 6); // helmet

        // Long barrel rifle
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(2, -7, 16, 2.5);
        ctx.fillRect(6, -5, 2, 3);
        break;
      }

      case 'turret': {
        // Concrete bunker with rotating dual barrel
        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.arc(0, 0, 13, 0, Math.PI, true);
        ctx.fill();

        ctx.fillStyle = '#334155';
        ctx.fillRect(-14, 0, 28, 4);

        // Rotating cannon
        ctx.save();
        ctx.rotate(e.animFrame); // angle pointing to player
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(0, -4, 16, 3);
        ctx.fillRect(0, 1, 16, 3);
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        break;
      }

      case 'capsule': {
        // Red winged flying sensor blimp
        const flap = Math.sin(e.animTimer * 0.3) * 4;

        // Wings
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(-12, 0);
        ctx.lineTo(-20, -6 + flap);
        ctx.lineTo(-12, -2);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(12, 0);
        ctx.lineTo(20, -6 + flap);
        ctx.lineTo(12, -2);
        ctx.fill();

        // Glowing center core
        ctx.fillStyle = '#f87171';
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-2, -2, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Power-up badge on capsule
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(e.dropItem || 'S', 0, 0);
        break;
      }

      case 'wall_sensor': {
        // Hexagonal wall-mounted power-up container
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(-8, -8, 16, 16);
        ctx.fillStyle = '#f87171';
        ctx.fillRect(-6, -6, 12, 12);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-3, -3, 6, 6);
        break;
      }

      case 'boss_core': {
        const pulse = Math.sin(e.animTimer * 0.15) * 3;
        const isDamaged = (e.hp / e.maxHp) < 0.3;

        if (customBossImg && customBossImg.complete && customBossImg.naturalWidth > 0) {
          // --- CUSTOM USER UPLOADED BOSS FACE ---
          const size = 36 + pulse;
          
          // Outer Cybernetic Armor Rim
          ctx.fillStyle = isDamaged ? '#ef4444' : '#0284c7';
          ctx.beginPath();
          ctx.arc(0, 0, size / 2 + 5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(0, 0, size / 2 + 3, 0, Math.PI * 2);
          ctx.fill();

          // Rotating metallic armor notches
          const rot = e.animTimer * 0.05;
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 2;
          for (let i = 0; i < 4; i++) {
            const a = rot + (i * Math.PI) / 2;
            ctx.beginPath();
            ctx.moveTo(Math.cos(a) * (size / 2 + 1), Math.sin(a) * (size / 2 + 1));
            ctx.lineTo(Math.cos(a) * (size / 2 + 5), Math.sin(a) * (size / 2 + 5));
            ctx.stroke();
          }

          // Clip image into circular boss portal
          ctx.save();
          ctx.beginPath();
          ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
          ctx.clip();
          
          // Center crop custom photo
          const imgAspect = customBossImg.naturalWidth / customBossImg.naturalHeight;
          let dw = size;
          let dh = size;
          if (imgAspect > 1) {
            dw = size * imgAspect;
          } else {
            dh = size / imgAspect;
          }
          ctx.drawImage(customBossImg, -dw / 2, -dh / 2, dw, dh);

          // Hit flash overlay
          if (isDamaged) {
            ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
            ctx.fillRect(-size / 2, -size / 2, size, size);
          }
          ctx.restore();

          // Glowing energy reticle ring
          ctx.strokeStyle = isDamaged ? '#ef4444' : '#38bdf8';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
          ctx.stroke();

          // Boss Name tag above core
          if (customBossName) {
            ctx.fillStyle = '#000000';
            ctx.fillRect(-35, -size / 2 - 14, 70, 11);
            ctx.strokeStyle = '#eab308';
            ctx.lineWidth = 1;
            ctx.strokeRect(-35, -size / 2 - 14, 70, 11);
            ctx.fillStyle = '#fef08a';
            ctx.font = 'bold 8px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(customBossName.slice(0, 14), 0, -size / 2 - 8);
          }
        } else {
          // --- DEFAULT CLASSIC RETRO BOSS CORE ---
          ctx.fillStyle = isDamaged ? '#ef4444' : '#b91c1c';
          ctx.beginPath();
          ctx.arc(0, 0, 18 + pulse, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.arc(0, 0, 10 + pulse * 0.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(-3, -3, 4, 0, Math.PI * 2);
          ctx.fill();

          // Organic alien veins
          ctx.strokeStyle = '#7f1d1d';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(-16, -10);
          ctx.lineTo(-8, -4);
          ctx.lineTo(-12, 12);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(14, -8);
          ctx.lineTo(8, -2);
          ctx.lineTo(10, 10);
          ctx.stroke();
        }
        break;
      }

      case 'boss_turret': {
        // Heavy armored cannon on boss wall
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-12, -10, 24, 20);

        ctx.fillStyle = '#475569';
        ctx.fillRect(-8, -7, 16, 14);

        // Gun barrel
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-22, -4, 14, 8);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-22, -2, 2, 4);
        break;
      }
    }

    ctx.restore();
  }

  /**
   * Draw NPCs: Dogs, Monkeys, Jumping Fish, Civilians
   */
  public static drawNPC(ctx: CanvasRenderingContext2D, npc: NPC) {
    if (npc.captured) return;

    ctx.save();
    ctx.translate(Math.round(npc.x), Math.round(npc.y));
    if (npc.facing === -1) {
      ctx.scale(-1, 1);
    }

    switch (npc.type) {
      case 'dog': {
        // Golden Vietnamese Phu Quoc / Corgi dog
        const legWalk = Math.sin(npc.animTimer * 0.4) * 3;
        const tailWag = Math.sin(npc.animTimer * 0.6) * 4;

        // Dog Body
        ctx.fillStyle = '#d97706'; // Golden amber
        ctx.fillRect(-8, -6, 16, 8);

        // Legs
        ctx.fillStyle = '#b45309';
        ctx.fillRect(-6, 2, 3, 4 + legWalk);
        ctx.fillRect(3, 2, 3, 4 - legWalk);

        // Head & Snout
        ctx.fillStyle = '#d97706';
        ctx.fillRect(4, -11, 7, 7);
        ctx.fillStyle = '#fed7aa'; // Snout
        ctx.fillRect(8, -8, 4, 4);
        ctx.fillStyle = '#18181b'; // Nose
        ctx.fillRect(11, -8, 2, 2);

        // Floppy Ear
        ctx.fillStyle = '#92400e';
        ctx.fillRect(4, -13, 3, 4);

        // Red collar
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(4, -5, 2, 4);

        // Wagging tail
        ctx.fillStyle = '#d97706';
        ctx.beginPath();
        ctx.moveTo(-8, -4);
        ctx.lineTo(-13, -8 + tailWag);
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#d97706';
        ctx.stroke();

        // Bark bubble if barking
        if (npc.barkTimer > 0) {
          ctx.save();
          if (npc.facing === -1) ctx.scale(-1, 1);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(2, -22, 28, 10);
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 7px monospace';
          ctx.fillText('GÂU!', 6, -15);
          ctx.restore();
        }
        break;
      }

      case 'monkey': {
        // Playful Jungle Monkey
        const armWave = Math.sin(npc.animTimer * 0.3) * 4;
        ctx.fillStyle = '#78350f';
        ctx.fillRect(-5, -6, 10, 10);
        ctx.fillStyle = '#fed7aa'; // Peach belly
        ctx.fillRect(-3, -4, 6, 6);

        // Head
        ctx.fillStyle = '#78350f';
        ctx.fillRect(-4, -13, 8, 7);
        ctx.fillStyle = '#fed7aa';
        ctx.fillRect(-2, -11, 5, 4);
        ctx.fillStyle = '#000000';
        ctx.fillRect(1, -10, 1.5, 1.5);

        // Curly tail
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(-7, -4, 4, 0, Math.PI);
        ctx.stroke();

        // Arm
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(3, -4);
        ctx.lineTo(8, -8 + armWave);
        ctx.stroke();
        break;
      }

      case 'fish': {
        // Jumping Fish
        const finWiggle = Math.sin(npc.animTimer * 0.5) * 3;
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.ellipse(0, 0, 7, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.ellipse(1, 1, 5, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(3, -2, 2, 2);
        ctx.fillStyle = '#000000';
        ctx.fillRect(4, -1, 1, 1);

        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.moveTo(-6, 0);
        ctx.lineTo(-10, -3 + finWiggle);
        ctx.lineTo(-10, 3 - finWiggle);
        ctx.fill();

        if (Math.abs(npc.vy) > 1) {
          ctx.fillStyle = '#bae6fd';
          ctx.fillRect(-3, 6, 2, 2);
          ctx.fillRect(3, 5, 1.5, 1.5);
        }
        break;
      }

      case 'civilian': {
        // Vietnamese civilian with Nón Lá
        const walk = Math.sin(npc.animTimer * 0.3) * 2;
        const wave = Math.sin(npc.animTimer * 0.4) * 4;

        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-4, 0, 3, 6 + walk);
        ctx.fillRect(1, 0, 3, 6 - walk);

        ctx.fillStyle = '#0284c7';
        ctx.fillRect(-5, -8, 10, 8);

        ctx.fillStyle = '#fed7aa';
        ctx.fillRect(-3, -14, 6, 6);

        // Nón Lá (Conical Hat)
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.moveTo(0, -18);
        ctx.lineTo(8, -13);
        ctx.lineTo(-8, -13);
        ctx.fill();
        ctx.strokeStyle = '#ca8a04';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Waving Hand
        ctx.strokeStyle = '#fed7aa';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(4, -6);
        ctx.lineTo(8, -10 + wave);
        ctx.stroke();

        // Dialogue bubble if active
        if (npc.dialogueTimer > 0 && npc.dialogue) {
          ctx.save();
          if (npc.facing === -1) ctx.scale(-1, 1);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(-22, -28, 52, 11);
          ctx.strokeStyle = '#0284c7';
          ctx.lineWidth = 1;
          ctx.strokeRect(-22, -28, 52, 11);
          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 7px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(npc.dialogue, 4, -20);
          ctx.restore();
        }
        break;
      }
    }

    ctx.restore();
  }

  /**
   * Draw Floating Power-Up Item Capsule on Ground
   */
  public static drawPowerUpItem(ctx: CanvasRenderingContext2D, item: PowerUpItem) {
    ctx.save();
    ctx.translate(Math.round(item.x), Math.round(item.y));

    // Winged falcon badge
    const colors: Record<string, { bg: string; border: string; text: string }> = {
      S: { bg: '#dc2626', border: '#fca5a5', text: '#ffffff' }, // Spread
      M: { bg: '#d97706', border: '#fde68a', text: '#ffffff' }, // Machine
      L: { bg: '#0284c7', border: '#bae6fd', text: '#ffffff' }, // Laser
      F: { bg: '#ea580c', border: '#ffedd5', text: '#ffffff' }, // Flame
      B: { bg: '#0d9488', border: '#ccfbf1', text: '#ffffff' }, // Barrier
      R: { bg: '#7c3aed', border: '#ede9fe', text: '#ffffff' }, // Rapid
      BOMB: { bg: '#e11d48', border: '#ffe4e6', text: '#ffffff' }, // Screen Bomb
    };

    const c = colors[item.type] || colors.S;

    // Glowing border
    ctx.fillStyle = c.border;
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, Math.PI * 2);
    ctx.fill();

    // Center capsule
    ctx.fillStyle = c.bg;
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.fill();

    // Letter
    ctx.fillStyle = c.text;
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.type === 'BOMB' ? '!' : item.type, 0, 0.5);

    ctx.restore();
  }

  /**
   * Draw Bullets (Player & Enemy)
   */
  public static drawBullet(ctx: CanvasRenderingContext2D, b: Bullet) {
    ctx.save();
    ctx.translate(Math.round(b.x), Math.round(b.y));

    if (b.isPlayer) {
      switch (b.weaponType) {
        case 'S': {
          // Spread: fiery orange pellet with red core
          ctx.fillStyle = '#ea580c';
          ctx.beginPath();
          ctx.arc(0, 0, b.radius + 1.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case 'L': {
          // Laser: elongated electric cyan beam
          const angle = Math.atan2(b.vy, b.vx);
          ctx.rotate(angle);
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(-12, -2.5, 24, 5);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(-10, -1, 20, 2);
          break;
        }

        case 'F': {
          // Flame: rotating fireball
          const angle = b.lifetime * 0.3;
          ctx.rotate(angle);
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.arc(0, 0, 5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(2, 0, 3, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case 'M':
        case 'R':
        default: {
          // Normal bullet: bright yellow rounded pellet
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(-0.5, -0.5, b.radius * 0.5, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
      }
    } else {
      // Enemy bullet: glowing red energy pellet
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(0, 0, b.radius + 1, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * Draw Platforms, Water, and Bridges
   */
  public static drawPlatform(ctx: CanvasRenderingContext2D, p: Platform, tick: number) {
    if (p.type === 'bridge' && p.bridgeExploded) return;

    ctx.save();

    if (p.type === 'water') {
      // Flowing water animated ripples
      ctx.fillStyle = '#0369a1';
      ctx.fillRect(p.x, p.y, p.width, p.height);

      ctx.fillStyle = '#38bdf8';
      for (let x = p.x; x < p.x + p.width; x += 16) {
        const wave = Math.sin((tick * 0.1) + (x * 0.05)) * 2;
        ctx.fillRect(x, p.y + wave, 10, 2);
      }
    } else if (p.type === 'bridge') {
      // Wooden suspension bridge with rope
      ctx.fillStyle = '#78350f';
      ctx.fillRect(p.x, p.y, p.width, p.height);

      // Planks
      ctx.fillStyle = '#92400e';
      for (let x = p.x; x < p.x + p.width; x += 8) {
        ctx.fillRect(x, p.y, 6, p.height);
        ctx.fillStyle = '#451a03';
        ctx.fillRect(x + 6, p.y, 2, p.height);
      }

      // Warning flicker if bridge is about to explode
      if (p.explodeTimer && p.explodeTimer > 0) {
        if (Math.floor(p.explodeTimer / 4) % 2 === 0) {
          ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
          ctx.fillRect(p.x, p.y - 4, p.width, p.height + 8);
        }
      }
    } else {
      // Solid ground or island ledge
      // Top grassy/foliage layer
      ctx.fillStyle = '#15803d';
      ctx.fillRect(p.x, p.y, p.width, 4);

      // Rock body
      ctx.fillStyle = '#3f3f46';
      ctx.fillRect(p.x, p.y + 4, p.width, p.height - 4);

      // Texture notches
      ctx.fillStyle = '#27272a';
      for (let x = p.x + 4; x < p.x + p.width - 4; x += 14) {
        ctx.fillRect(x, p.y + 6, 6, p.height - 8);
      }
    }

    ctx.restore();
  }

  /**
   * Draw Particle FX (Explosions, Smoke, Sparks, Water Splashes)
   */
  public static drawParticle(ctx: CanvasRenderingContext2D, pt: Particle) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, pt.alpha);
    ctx.fillStyle = pt.color;

    if (pt.type === 'score' && pt.text) {
      ctx.font = 'bold 9px monospace';
      ctx.fillStyle = '#fef08a';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeText(pt.text, pt.x, pt.y);
      ctx.fillText(pt.text, pt.x, pt.y);
    } else if (pt.type === 'ring') {
      ctx.strokeStyle = pt.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
