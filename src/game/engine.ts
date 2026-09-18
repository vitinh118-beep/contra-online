/**
 * Contra Game Engine
 * Handles 60 FPS physics, player controls, enemy AI, collision detection,
 * multi-weapon ballistics, camera scrolling, audio, and level progression.
 */

import {
  Player,
  Bullet,
  Enemy,
  Platform,
  PowerUpItem,
  GameStatus,
  GameMode,
  GameDifficulty,
  InputState,
  LevelConfig,
  WeaponType,
  PowerUpType,
  NPC,
  PlayerInventory,
  BossFaceConfig,
  BossStatus,
} from '../types';
import { LEVELS } from './levels';
import { SpriteRenderer } from './sprites';
import { ParticleSystem } from './particles';
import { audio } from './audio';
import { network } from './network';

export class ContraGameEngine {
  public status: GameStatus = 'title';
  public mode: GameMode = '1P';
  public difficulty: GameDifficulty = 'normal';
  public levelIndex: number = 0;
  public levels: LevelConfig[] = LEVELS;
  public currentLevel: LevelConfig = LEVELS[0];

  // Multiplayer Network State
  public isNetworkHost: boolean = false;
  public isNetworkGuest: boolean = false;
  public networkPlayerId: 1 | 2 | null = null;

  public players: Player[] = [];
  public bullets: Bullet[] = [];
  public enemies: Enemy[] = [];
  public platforms: Platform[] = [];
  public powerUps: PowerUpItem[] = [];
  public npcs: NPC[] = [];
  public inventory: PlayerInventory = { fishes: 0, pets: 0, civilians: 0 };
  public particles: ParticleSystem = new ParticleSystem();

  // Flying Capsule Notification & Counter per Level (3 capsules per level)
  public capsuleNoticeTimer: number = 0;
  public capsuleNoticeText: string = '';
  public capsulesSpawnedInLevel: number = 0;

  // Custom Boss Upload Settings
  public customBossConfig: BossFaceConfig | null = null;
  public customBossImg: HTMLImageElement | null = null;

  // Screen virtual resolution (Authentic 16:9 NES retro arcade pixel scale)
  public readonly viewWidth: number = 480;
  public readonly viewHeight: number = 270;

  // Camera
  public cameraX: number = 0;
  public cameraY: number = 0;
  public screenShake: number = 0;

  // Score & Highscore
  public highScore: number = 20000;

  // Input states
  public p1Input: InputState = {
    left: false,
    right: false,
    up: false,
    down: false,
    jump: false,
    shoot: false,
    prevJump: false,
    prevShoot: false,
  };

  public p2Input: InputState = {
    left: false,
    right: false,
    up: false,
    down: false,
    jump: false,
    shoot: false,
    prevJump: false,
    prevShoot: false,
  };

  // Konami Code Detector
  private konamiSequence: string[] = [];
  private readonly konamiTarget = [
    'ArrowUp',
    'ArrowUp',
    'ArrowDown',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'ArrowLeft',
    'ArrowRight',
    'b',
    'a',
  ];
  public konamiActivated: boolean = false;

  // Game Loop Timers
  public tick: number = 0;
  private stageClearTimer: number = 0;
  private bossDefeated: boolean = false;
  private bossDefeatTimer: number = 0;

  constructor() {
    // Load highscore from localStorage
    try {
      const saved = localStorage.getItem('contra_highscore');
      if (saved) {
        this.highScore = parseInt(saved, 10) || 20000;
      }
      const savedBoss = localStorage.getItem('contra_custom_boss');
      if (savedBoss) {
        const parsed = JSON.parse(savedBoss);
        this.setCustomBoss(parsed);
      }
    } catch {
      // ignore
    }

    // Attach Network Listeners for Multiplayer
    network.onPeerInput = (input, playerId) => {
      if (this.isNetworkHost && playerId === 2) {
        this.p2Input = { ...input };
      }
    };

    network.onStateSync = (snapshot) => {
      if (this.isNetworkGuest) {
        this.applySnapshot(snapshot);
      }
    };

    network.onGameStarted = (config) => {
      this.isNetworkGuest = true;
      this.isNetworkHost = false;
      this.networkPlayerId = 2;
      this.start('2P', config?.initialLives ?? 3, config?.difficulty ?? 'normal', config?.stageIndex ?? 0);
    };
  }

  public setCustomBoss(config: BossFaceConfig) {
    this.customBossConfig = config;
    try {
      localStorage.setItem('contra_custom_boss', JSON.stringify(config));
    } catch {}

    const img = new Image();
    img.src = config.imageUrl;
    img.onload = () => {
      this.customBossImg = img;
    };
  }

  public clearCustomBoss() {
    this.customBossConfig = null;
    this.customBossImg = null;
    try {
      localStorage.removeItem('contra_custom_boss');
    } catch {}
  }

  /**
   * Exchange / Rescue Shop: Trade collected fish & pets or turn in rescued civilians
   */
  public exchangeItem(dealId: string): boolean {
    const p = this.players[0];
    if (!p || p.state === 'dead') return false;

    switch (dealId) {
      case 'sell_fish_weapon': {
        if (this.inventory.fishes >= 2) {
          this.inventory.fishes -= 2;
          p.weapon = 'S'; // Spread Gun
          p.score += 1500;
          this.particles.addExplosion(p.x, p.y - 10);
          audio.playCashRegister();
          audio.playPowerUp();
          return true;
        }
        return false;
      }
      case 'sell_fish_laser': {
        if (this.inventory.fishes >= 2) {
          this.inventory.fishes -= 2;
          p.weapon = 'L'; // Laser Gun
          p.score += 2000;
          this.particles.addExplosion(p.x, p.y - 10);
          audio.playCashRegister();
          audio.playPowerUp();
          return true;
        }
        return false;
      }
      case 'rescue_pet_life': {
        if (this.inventory.pets >= 2) {
          this.inventory.pets -= 2;
          p.lives++;
          p.score += 2500;
          audio.playCashRegister();
          audio.play1Up();
          return true;
        }
        return false;
      }
      case 'rescue_pet_barrier': {
        if (this.inventory.pets >= 1) {
          this.inventory.pets -= 1;
          p.barrierTime = 900; // 15s invincibility shield
          p.score += 1000;
          audio.playCashRegister();
          audio.playPowerUp();
          return true;
        }
        return false;
      }
      case 'reward_civilian': {
        if (this.inventory.civilians >= 1) {
          this.inventory.civilians -= 1;
          p.score += 5000;
          p.lives += 1;
          // Clear screen of foot soldiers
          this.enemies.forEach(e => {
            if (e.type !== 'boss_core') {
              e.active = false;
              this.particles.addExplosion(e.x, e.y);
            }
          });
          audio.playCashRegister();
          audio.play1Up();
          return true;
        }
        return false;
      }
      default:
        return false;
    }
  }

  /**
   * Start or Restart the Game
   */
  public start(mode: GameMode = '1P', initialLives: number = 3, diff: GameDifficulty = 'normal', stageIndex: number = 0) {
    this.mode = mode;
    this.difficulty = diff;
    this.levelIndex = stageIndex;
    this.currentLevel = this.levels[this.levelIndex] || this.levels[0];
    this.status = 'playing';
    this.cameraX = 0;
    this.cameraY = 0;
    this.tick = 0;
    this.stageClearTimer = 0;
    this.bossDefeated = false;
    this.bossDefeatTimer = 0;
    this.capsulesSpawnedInLevel = 0;
    this.capsuleNoticeTimer = 0;
    this.capsuleNoticeText = '';
    this.particles.clear();
    this.bullets = [];
    this.powerUps = [];

    // Spawn Level NPCs
    this.npcs = (this.currentLevel.npcSpawns || []).map((s, idx) => ({
      id: `npc_${this.levelIndex}_${idx}_${s.type}`,
      type: s.type,
      name: s.name || s.type,
      x: s.x,
      y: s.y,
      vx: s.type === 'fish' ? 0 : 0.6,
      vy: 0,
      width: s.type === 'dog' ? 16 : s.type === 'fish' ? 12 : 14,
      height: s.type === 'dog' ? 12 : s.type === 'fish' ? 8 : 18,
      facing: 1,
      grounded: true,
      animTimer: Math.floor(Math.random() * 60),
      animFrame: 0,
      barkTimer: 0,
      dialogue: s.type === 'civilian' ? 'CỨU VỚI!' : undefined,
      dialogueTimer: 0,
      captured: false,
      value: s.type === 'fish' ? 500 : s.type === 'dog' ? 1000 : 1500,
    }));

    // Clone platforms and reset explode states
    this.platforms = this.currentLevel.platforms.map(p => ({ ...p, bridgeExploded: false, explodeTimer: 0 }));

    // Reset enemies
    this.enemies = [];

    // Initialize Player 1 (Bill)
    this.players = [
      this.createPlayer(1, 'BILL', '#3b82f6', 60, 180, initialLives),
    ];

    // Initialize Player 2 (Lance) if 2-Player mode
    if (mode === '2P') {
      this.players.push(
        this.createPlayer(2, 'LANCE', '#dc2626', 30, 180, initialLives)
      );
    }

    // Start Retro BGM
    audio.startBGM('stage');
  }

  private createPlayer(
    id: 1 | 2,
    name: string,
    color: string,
    x: number,
    y: number,
    lives: number
  ): Player {
    return {
      id,
      name,
      color,
      x,
      y,
      vx: 0,
      vy: 0,
      width: 14,
      height: 28,
      facing: 1,
      state: 'idle',
      isGrounded: true,
      isAimingUp: false,
      isAimingDown: false,
      isProne: false,
      isSubmerged: false,
      lives,
      score: 0,
      weapon: 'R',
      shootCooldown: 0,
      invulnerableTime: 60,
      barrierTime: 0,
      animFrame: 0,
      animTimer: 0,
      waterSplashTimer: 0,
      jumpLock: false,
    };
  }

  /**
   * Handle Konami Code key tracking
   */
  public handleKeyDown(key: string) {
    const normalizedKey = key.toLowerCase() === 'b' ? 'b' : key.toLowerCase() === 'a' ? 'a' : key;
    this.konamiSequence.push(normalizedKey);
    if (this.konamiSequence.length > this.konamiTarget.length) {
      this.konamiSequence.shift();
    }

    // Check if match
    if (this.konamiSequence.length === this.konamiTarget.length) {
      const match = this.konamiSequence.every((k, i) => k === this.konamiTarget[i]);
      if (match) {
        this.activate30Lives();
        this.konamiSequence = [];
      }
    }
  }

  public activate30Lives() {
    this.konamiActivated = true;
    this.players.forEach(p => {
      p.lives = Math.max(p.lives, 30);
    });
    audio.playKonamiSecret();
    this.screenShake = 8;
  }

  /**
   * Main Fixed Physics Update (Runs at 60Hz)
   */
  public update(deltaTime: number) {
    if (this.status !== 'playing') return;

    this.tick++;

    // Decay screen shake
    if (this.screenShake > 0) {
      this.screenShake *= 0.85;
      if (this.screenShake < 0.2) this.screenShake = 0;
    }

    // Decay flying capsule notice timer
    if (this.capsuleNoticeTimer > 0) {
      this.capsuleNoticeTimer--;
    }

    // Update Particles
    this.particles.update();

    // In Network Guest Mode: Send input to Host, rely on Host authoritative state sync
    if (this.isNetworkGuest) {
      network.sendInput(this.p2Input);
      return;
    }

    // 1. Update Players
    this.players.forEach(p => {
      const input = p.id === 1 ? this.p1Input : this.p2Input;
      this.updatePlayer(p, input);
    });

    // Broadcast state from Host to Guest every 2 frames (~30 FPS)
    if (this.isNetworkHost && this.tick % 2 === 0) {
      network.sendStateSync(this.exportSnapshot());
    }

    // 2. Camera Tracking (Progressive rightward lock like NES Contra)
    const activePlayers = this.players.filter(p => p.state !== 'dead');
    if (activePlayers.length > 0) {
      const avgX = activePlayers.reduce((sum, p) => sum + p.x, 0) / activePlayers.length;
      const targetCamX = Math.max(this.cameraX, avgX - this.viewWidth * 0.4);
      const maxCamX = Math.max(0, this.currentLevel.length - this.viewWidth);
      this.cameraX = Math.min(targetCamX, maxCamX);
    }

    // 3. Platform & Collapsing Bridges Update
    this.updatePlatforms();

    // 4. Enemy Spawning & AI
    this.updateEnemies();

    // 5. Bullets physics & collisions
    this.updateBullets();

    // 6. Power-up Items
    this.updatePowerUps();

    // 7. NPCs & Animal Interactions
    this.updateNPCs();

    // 8. Check Boss & Stage Completion
    this.checkStageProgress();

    // 8. Check Game Over
    const allDead = this.players.every(p => p.lives <= 0 && p.state === 'dead');
    if (allDead) {
      this.status = 'game_over';
      audio.stopBGM();
      audio.playPlayerHit();
    }
  }

  /**
   * Update Player Physics and Movement
   */
  private updatePlayer(p: Player, input: InputState) {
    if (p.state === 'dead') return;

    p.animTimer++;
    if (p.invulnerableTime > 0) p.invulnerableTime--;
    if (p.barrierTime > 0) p.barrierTime--;
    if (p.shootCooldown > 0) p.shootCooldown--;

    // Determine if player is in water trench
    const waterPlat = this.getWaterPlatform(p);

    if (waterPlat) {
      // If jumping upward, let player ascend in the air
      if (p.vy < 0) {
        p.isGrounded = false;
        p.isSubmerged = false;
      } else if (p.y >= waterPlat.y - 4) {
        // Landing or swimming in water
        if (p.state !== 'swimming') {
          this.particles.addWaterSplash(p.x, waterPlat.y);
          audio.playWaterSplash();
        }
        p.state = 'swimming';
        p.isGrounded = true;
        p.vy = 0;
        p.y = waterPlat.y + 4; // Authentic water line
      }
    } else if (p.state === 'swimming') {
      // Stepped or jumped out of water boundaries
      p.isGrounded = false;
      p.state = 'jump';
      p.isSubmerged = false;
    }

    const inWater = p.state === 'swimming';
    const speed = inWater ? 1.5 : 2.2;

    // Movement & Prone / Diving
    if (inWater) {
      p.isProne = false;
      if (input.down) {
        // Dive underwater to dodge bullets!
        p.isSubmerged = true;
        p.vx = 0;
        if (p.animTimer % 14 === 0) {
          this.particles.addWaterBubbles(p.x, p.y - 6);
        }
      } else {
        p.isSubmerged = false;
        if (input.left) {
          p.vx = -speed;
          p.facing = -1;
        } else if (input.right) {
          p.vx = speed;
          p.facing = 1;
        } else {
          p.vx = 0;
        }
      }
    } else {
      p.isSubmerged = false;
      if (input.left && !p.isProne) {
        p.vx = -speed;
        p.facing = -1;
        if (p.isGrounded) p.state = 'run';
      } else if (input.right && !p.isProne) {
        p.vx = speed;
        p.facing = 1;
        if (p.isGrounded) p.state = 'run';
      } else {
        p.vx = 0;
        if (p.isGrounded && !p.isProne) p.state = 'idle';
      }

      // Prone / Ducking on land
      if (input.down && p.isGrounded) {
        p.isProne = true;
        p.state = 'prone';
        p.vx = 0;
      } else {
        p.isProne = false;
      }
    }

    // Aiming Directions
    p.isAimingUp = input.up;
    p.isAimingDown = input.down && !p.isGrounded && !inWater;

    // Jumping (higher snappy jump, works both on land and out of water)
    const justPressedJump = input.jump && !input.prevJump;
    input.prevJump = input.jump;

    if (justPressedJump) {
      if (inWater) {
        // Jump out of water!
        p.vy = -7.4;
        p.isGrounded = false;
        p.state = 'jump';
        p.isSubmerged = false;
        audio.playJump();
        this.particles.addWaterSplash(p.x, waterPlat ? waterPlat.y : p.y);
      } else if (input.down && p.isGrounded) {
        // Drop through one-way platform
        p.y += 6;
        p.isGrounded = false;
        p.vy = 1;
      } else if (p.isGrounded) {
        // Higher jump on ground
        p.vy = -7.4;
        p.isGrounded = false;
        p.state = 'jump';
        audio.playJump();
      }
    }

    // Gravity
    if (!p.isGrounded && p.state !== 'swimming') {
      p.vy += 0.35; // slightly lower gravity for higher jump arc
      if (p.vy > 7.5) p.vy = 7.5; // terminal velocity
      p.state = 'jump';
    }

    // Apply Velocity
    p.x += p.vx;
    p.y += p.vy;

    // Camera Left Boundary Constraint
    const minX = this.cameraX + 8;
    if (p.x < minX) p.x = minX;

    // Stepping from water onto riverbank
    if (p.state === 'swimming' && p.vx !== 0) {
      for (const plat of this.platforms) {
        if (plat.type === 'water') continue;
        if (plat.type === 'bridge' && plat.bridgeExploded) continue;

        // Is platform a ground bank adjacent to the water?
        const isBankHeight = Math.abs(plat.y - (waterPlat ? waterPlat.y : 232)) <= 26;
        if (!isBankHeight) continue;

        // Swimming right onto bank
        if (p.vx > 0 && p.x + p.width / 2 >= plat.x && p.x <= plat.x + 20) {
          p.x = plat.x + p.width / 2 + 1;
          p.y = plat.y;
          p.vy = 0;
          p.isGrounded = true;
          p.state = 'run';
          p.isSubmerged = false;
          break;
        }
        // Swimming left onto bank
        if (p.vx < 0 && p.x - p.width / 2 <= plat.x + plat.width && p.x >= plat.x + plat.width - 20) {
          p.x = plat.x + plat.width - p.width / 2 - 1;
          p.y = plat.y;
          p.vy = 0;
          p.isGrounded = true;
          p.state = 'run';
          p.isSubmerged = false;
          break;
        }
      }
    }

    // Platform Collisions (when airborne or landing)
    if (p.state !== 'swimming') {
      this.handlePlayerPlatformCollisions(p);
    }

    // Pit fall check
    if (p.y > this.viewHeight + 40) {
      this.killPlayer(p);
    }

    // Shooting (cannot shoot while diving submerged)
    const wantsToShoot = p.weapon === 'M' ? input.shoot : input.shoot && !input.prevShoot;
    input.prevShoot = input.shoot;

    if (wantsToShoot && p.shootCooldown <= 0 && !p.isSubmerged) {
      this.firePlayerWeapon(p);
    }

    // Animation frame cycling
    if (p.state === 'run') {
      p.animFrame += 0.22;
    } else {
      p.animFrame = 0;
    }
  }

  private getWaterPlatform(p: Player): Platform | undefined {
    return this.platforms.find(
      plat =>
        plat.type === 'water' &&
        p.x >= plat.x - 4 &&
        p.x <= plat.x + plat.width + 4 &&
        p.y >= plat.y - 16 &&
        p.y <= plat.y + plat.height + 12
    );
  }

  private isPlayerInWater(p: Player): boolean {
    return !!this.getWaterPlatform(p);
  }

  private handlePlayerPlatformCollisions(p: Player) {
    if (p.vy < 0) {
      p.isGrounded = false;
      return;
    }

    let landed = false;
    for (const plat of this.platforms) {
      if (plat.type === 'water') continue;
      if (plat.type === 'bridge' && plat.bridgeExploded) continue;

      const prevY = p.y - p.vy;
      const isWithinX = p.x + p.width / 2 >= plat.x && p.x - p.width / 2 <= plat.x + plat.width;
      if (!isWithinX) continue;

      // Normal landing from above
      const normalLand = prevY <= plat.y + 6 && p.y >= plat.y && p.y <= plat.y + 14;

      // Step up / landing onto bank from water
      const waterStepUp = p.state === 'swimming' && p.y >= plat.y && p.y <= plat.y + 26;

      if (normalLand || waterStepUp) {
        p.y = plat.y;
        p.vy = 0;
        p.isGrounded = true;
        landed = true;

        if (p.state === 'jump' || p.state === 'swimming') {
          p.state = p.vx !== 0 ? 'run' : 'idle';
          p.isSubmerged = false;
        }

        // Trigger Bridge Explosion timer if stepping on bridge
        if (plat.type === 'bridge' && !plat.explodeTimer) {
          plat.explodeTimer = 45; // explodes after 45 frames (0.75 seconds)
        }
        break;
      }
    }

    if (!landed && p.y < this.viewHeight && p.state !== 'swimming') {
      p.isGrounded = false;
    }
  }

  /**
   * Fire Player Bullets based on Weapon Type
   */
  private firePlayerWeapon(p: Player) {
    if (p.isSubmerged) return;

    // Cooldown rates
    const cooldowns: Record<WeaponType, number> = {
      R: 12,
      M: 6,
      S: 18,
      L: 14,
      F: 16,
    };
    p.shootCooldown = cooldowns[p.weapon] || 12;

    // Calculate bullet spawn position and velocity based on player direction
    let spawnX = p.x + (p.facing === 1 ? 16 : -16);
    let spawnY = p.y - 10;

    let dirX: number = p.facing;
    let dirY: number = 0;

    if (p.state === 'swimming') {
      spawnY = p.y - 8;
      if (p.isAimingUp) {
        dirX = 0;
        dirY = -1;
        spawnX = p.x;
        spawnY = p.y - 20;
      }
    } else if (p.isProne) {
      spawnY = p.y - 4;
      dirY = 0;
    } else if (p.isAimingUp) {
      if (p.state === 'run') {
        // Diagonal Up-Forward
        dirX = p.facing * 0.7071;
        dirY = -0.7071;
        spawnX = p.x + (p.facing === 1 ? 12 : -12);
        spawnY = p.y - 20;
      } else {
        // Straight Up
        dirX = 0;
        dirY = -1;
        spawnX = p.x;
        spawnY = p.y - 26;
      }
    } else if (p.isAimingDown && !p.isGrounded) {
      // Diagonal Down-Forward while airborne
      dirX = p.facing * 0.7071;
      dirY = 0.7071;
      spawnX = p.x + (p.facing === 1 ? 12 : -12);
      spawnY = p.y + 4;
    }

    const bulletSpeed = 7.5;

    switch (p.weapon) {
      case 'S': {
        // SPREAD GUN: Iconic 5-directional fan burst!
        const baseAngle = Math.atan2(dirY, dirX);
        const spreadOffsets = [-0.28, -0.14, 0, 0.14, 0.28];

        spreadOffsets.forEach((offset, idx) => {
          const angle = baseAngle + offset;
          this.bullets.push({
            id: `b_p${p.id}_${this.tick}_${idx}`,
            x: spawnX,
            y: spawnY,
            vx: Math.cos(angle) * (bulletSpeed + 0.5),
            vy: Math.sin(angle) * (bulletSpeed + 0.5),
            radius: 3.5,
            color: '#ea580c',
            damage: 1,
            isPlayer: true,
            playerId: p.id,
            weaponType: 'S',
            lifetime: 70,
          });
        });
        break;
      }

      case 'L': {
        // LASER GUN: Piercing continuous beam segment
        this.bullets.push({
          id: `b_p${p.id}_${this.tick}`,
          x: spawnX,
          y: spawnY,
          vx: dirX * (bulletSpeed + 4),
          vy: dirY * (bulletSpeed + 4),
          radius: 4,
          color: '#38bdf8',
          damage: 3,
          isPlayer: true,
          playerId: p.id,
          weaponType: 'L',
          lifetime: 60,
          piercing: true,
        });
        break;
      }

      case 'F': {
        // FLAME GUN: Exploding rotating fireball
        this.bullets.push({
          id: `b_p${p.id}_${this.tick}`,
          x: spawnX,
          y: spawnY,
          vx: dirX * (bulletSpeed - 1.5),
          vy: dirY * (bulletSpeed - 1.5),
          radius: 5.5,
          color: '#f97316',
          damage: 2.5,
          isPlayer: true,
          playerId: p.id,
          weaponType: 'F',
          lifetime: 80,
        });
        break;
      }

      case 'M':
      case 'R':
      default: {
        // MACHINE GUN / RIFLE
        this.bullets.push({
          id: `b_p${p.id}_${this.tick}`,
          x: spawnX,
          y: spawnY,
          vx: dirX * bulletSpeed,
          vy: dirY * bulletSpeed,
          radius: 2.5,
          color: '#facc15',
          damage: 1,
          isPlayer: true,
          playerId: p.id,
          weaponType: p.weapon,
          lifetime: 65,
        });
        break;
      }
    }

    audio.playShoot(p.weapon);
  }

  public killPlayer(p: Player) {
    if (p.barrierTime > 0 || p.invulnerableTime > 0) return;

    p.lives--;
    this.particles.addExplosion(p.x, p.y, true);
    audio.playPlayerHit();
    this.screenShake = 12;

    if (p.lives > 0) {
      // Respawn at safe height
      p.x = Math.max(this.cameraX + 50, p.x - 40);
      p.y = 80;
      p.vx = 0;
      p.vy = 0;
      p.state = 'jump';
      p.weapon = 'R'; // resets to default rifle on death
      p.invulnerableTime = 120; // 2 seconds invulnerability
    } else {
      p.state = 'dead';
    }
  }

  /**
   * Update Bridges (Explode with smoke and sound)
   */
  private updatePlatforms() {
    this.platforms.forEach(plat => {
      if (plat.type === 'bridge' && plat.explodeTimer && !plat.bridgeExploded) {
        plat.explodeTimer--;
        if (plat.explodeTimer <= 0) {
          plat.bridgeExploded = true;
          audio.playExplosion(true);
          this.screenShake = 10;
          // Spawn explosions across bridge
          for (let x = plat.x; x < plat.x + plat.width; x += 30) {
            this.particles.addExplosion(x, plat.y, true);
          }
        }
      }
    });
  }

  /**
   * Update Enemy Spawns & Behaviors
   */
  private updateEnemies() {
    // 1. Spawn from level triggers as camera advances
    this.currentLevel.enemySpawns.forEach((spawn, spawnIdx) => {
      const spawnId = `sp_${spawn.triggerX}_${spawn.type}_${spawnIdx}`;
      if (this.enemies.some(e => e.id === spawnId)) return;

      if (spawn.type === 'capsule') {
        // Flying bullet capsule flies out when player reaches this checkpoint (3 per level)
        if (this.cameraX >= spawn.triggerX - 100) {
          this.capsulesSpawnedInLevel++;
          // Alternate direction: wave 1 and 3 fly from left, wave 2 from right
          const flyFromLeft = this.capsulesSpawnedInLevel % 2 !== 0;
          const startX = flyFromLeft ? this.cameraX - 12 : this.cameraX + this.viewWidth + 12;
          const vx = flyFromLeft ? 2.2 : -2.2;

          this.enemies.push({
            id: spawnId,
            type: 'capsule',
            x: startX,
            y: spawn.y,
            vx,
            vy: 0,
            width: 24,
            height: 16,
            hp: 1,
            maxHp: 1,
            scoreValue: 500,
            facing: flyFromLeft ? 1 : -1,
            shootTimer: 0,
            animTimer: 0,
            animFrame: 0,
            dropItem: spawn.dropItem || 'S',
            active: true,
          });

          this.capsuleNoticeTimer = 110;
          this.capsuleNoticeText = `✈️ ĐẠN MỚI BAY TỚI [${this.capsulesSpawnedInLevel}/3]: [${spawn.dropItem || 'S'}]!`;
          audio.playPowerUp();
        }
      } else {
        if (this.cameraX + this.viewWidth >= spawn.triggerX) {
          const hpMap: Record<string, number> = {
            soldier: 1,
            sniper: 2,
            turret: 6,
            wall_sensor: 3,
          };

          this.enemies.push({
            id: spawnId,
            type: spawn.type,
            x: spawn.x,
            y: spawn.y,
            vx: spawn.type === 'soldier' ? -1.4 : 0,
            vy: 0,
            width: 16,
            height: 26,
            hp: hpMap[spawn.type] || 1,
            maxHp: hpMap[spawn.type] || 1,
            scoreValue: spawn.type === 'turret' ? 500 : spawn.type === 'sniper' ? 300 : 100,
            facing: -1,
            shootTimer: Math.floor(Math.random() * 60),
            animTimer: 0,
            animFrame: 0,
            dropItem: spawn.dropItem,
            active: true,
          });
        }
      }
    });

    // 2. Spawn Boss Arena Core & Turrets when approaching boss trigger
    const bossConfig = this.currentLevel.boss;
    if (
      this.cameraX >= bossConfig.triggerX - 60 &&
      !this.enemies.some(e => e.id === 'boss_core')
    ) {
      const coreHp = bossConfig.coreHp || (this.levelIndex === 4 ? 100 : 60);
      // Boss Core
      this.enemies.push({
        id: 'boss_core',
        type: 'boss_core',
        x: bossConfig.coreX,
        y: bossConfig.coreY,
        vx: 0,
        vy: 0,
        width: 38,
        height: 38,
        hp: coreHp,
        maxHp: coreHp,
        scoreValue: 5000,
        facing: -1,
        shootTimer: 0,
        animTimer: 0,
        animFrame: 0,
        active: true,
      });

      // Boss Turrets
      bossConfig.turrets.forEach((turret, idx) => {
        this.enemies.push({
          id: `boss_turret_${idx}`,
          type: 'boss_turret',
          x: turret.x,
          y: turret.y,
          vx: 0,
          vy: 0,
          width: 28,
          height: 20,
          hp: turret.hp,
          maxHp: turret.hp,
          scoreValue: 1000,
          facing: -1,
          shootTimer: idx * 30,
          animTimer: 0,
          animFrame: 0,
          active: true,
        });
      });
    }

    // 3. Update Existing Enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (!e.active) continue;

      e.animTimer++;

      // Closest active player
      const targetPlayer = this.getClosestPlayer(e.x, e.y);

      switch (e.type) {
        case 'soldier': {
          e.x += e.vx;
          e.animFrame += 0.2;
          // Jump off edges or fall
          const onGround = this.platforms.some(
            plat =>
              plat.type !== 'water' &&
              e.x >= plat.x &&
              e.x <= plat.x + plat.width &&
              Math.abs(e.y - plat.y) < 6
          );
          if (!onGround) {
            e.y += 2.5;
          }
          break;
        }

        case 'sniper': {
          if (targetPlayer) {
            e.facing = targetPlayer.x < e.x ? -1 : 1;
          }
          e.shootTimer++;
          if (e.shootTimer >= 100 && targetPlayer) {
            e.shootTimer = 0;
            this.fireEnemyBullet(e.x + e.facing * 12, e.y - 6, targetPlayer);
          }
          break;
        }

        case 'turret': {
          if (targetPlayer) {
            const angle = Math.atan2(targetPlayer.y - e.y, targetPlayer.x - e.x);
            e.animFrame = angle;
          }
          e.shootTimer++;
          if (e.shootTimer >= 90 && targetPlayer) {
            e.shootTimer = 0;
            this.fireEnemyBullet(e.x, e.y, targetPlayer);
          }
          break;
        }

        case 'capsule': {
          // Sine wave flying flight path
          e.x += e.vx;
          e.y += Math.sin(e.animTimer * 0.08) * 1.5;
          break;
        }

        case 'boss_turret': {
          e.shootTimer++;
          if (e.shootTimer >= 80 && targetPlayer) {
            e.shootTimer = 0;
            this.fireEnemyBullet(e.x - 14, e.y, targetPlayer, 4.5);
          }
          break;
        }

        case 'boss_core': {
          e.shootTimer++;
          if (e.shootTimer >= 110 && targetPlayer) {
            e.shootTimer = 0;
            // 3-way burst from boss core
            const angleToPlayer = Math.atan2(targetPlayer.y - e.y, targetPlayer.x - e.x);
            [-0.2, 0, 0.2].forEach(offset => {
              const speed = 4;
              this.bullets.push({
                id: `eb_${this.tick}_${Math.random()}`,
                x: e.x - 10,
                y: e.y,
                vx: Math.cos(angleToPlayer + offset) * speed,
                vy: Math.sin(angleToPlayer + offset) * speed,
                radius: 4,
                color: '#ef4444',
                damage: 1,
                isPlayer: false,
                lifetime: 140,
              });
            });
            audio.playEnemyShoot();
          }
          break;
        }
      }

      // Check contact with players
      if (targetPlayer && targetPlayer.barrierTime <= 0 && targetPlayer.invulnerableTime <= 0 && !targetPlayer.isSubmerged) {
        if (
          Math.abs(e.x - targetPlayer.x) < (e.width + targetPlayer.width) / 2 &&
          Math.abs(e.y - targetPlayer.y) < (e.height + targetPlayer.height) / 2
        ) {
          this.killPlayer(targetPlayer);
        }
      }

      // Despawn if far behind camera
      if (e.x < this.cameraX - 100 || e.x > this.cameraX + this.viewWidth + 200) {
        if (e.type !== 'boss_core' && e.type !== 'boss_turret') {
          e.active = false;
        }
      }
    }
  }

  private fireEnemyBullet(x: number, y: number, target: Player, speed: number = 3.5) {
    const angle = Math.atan2(target.y - y, target.x - x);
    this.bullets.push({
      id: `eb_${this.tick}_${Math.random()}`,
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 3,
      color: '#ef4444',
      damage: 1,
      isPlayer: false,
      lifetime: 120,
    });
    audio.playEnemyShoot();
  }

  private getClosestPlayer(x: number, y: number): Player | null {
    const active = this.players.filter(p => p.state !== 'dead');
    if (active.length === 0) return null;
    let closest = active[0];
    let minDist = Infinity;
    active.forEach(p => {
      const dist = Math.hypot(p.x - x, p.y - y);
      if (dist < minDist) {
        minDist = dist;
        closest = p;
      }
    });
    return closest;
  }

  /**
   * Update Bullets & Collisions with enemies and players
   */
  private updateBullets() {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += b.vx;
      b.y += b.vy;
      b.lifetime--;

      // Remove out of bounds or dead bullets
      if (
        b.lifetime <= 0 ||
        b.x < this.cameraX - 20 ||
        b.x > this.cameraX + this.viewWidth + 40 ||
        b.y < -20 ||
        b.y > this.viewHeight + 30
      ) {
        this.bullets.splice(i, 1);
        continue;
      }

      // Player Bullets hitting Enemies
      if (b.isPlayer) {
        let bulletHit = false;
        for (const e of this.enemies) {
          if (!e.active) continue;
          if (
            b.x >= e.x - e.width / 2 &&
            b.x <= e.x + e.width / 2 &&
            b.y >= e.y - e.height / 2 &&
            b.y <= e.y + e.height / 2
          ) {
            e.hp -= b.damage;
            this.particles.addHitSpark(b.x, b.y);
            audio.playBossHit();

            if (e.hp <= 0) {
              e.active = false;
              this.particles.addExplosion(e.x, e.y, e.type === 'boss_core');
              audio.playExplosion(e.type === 'boss_core');

              // Award Score to player
              if (b.playerId) {
                const shooter = this.players.find(p => p.id === b.playerId);
                if (shooter) {
                  shooter.score += e.scoreValue;
                  if (shooter.score > this.highScore) {
                    this.highScore = shooter.score;
                    try {
                      localStorage.setItem('contra_highscore', this.highScore.toString());
                    } catch {}
                  }
                }
              }

              // Drop Power-up item if configured
              if (e.dropItem) {
                this.powerUps.push({
                  id: `pw_${this.tick}`,
                  type: e.dropItem,
                  x: e.x,
                  y: e.y,
                  vx: 0,
                  vy: -2,
                  width: 14,
                  height: 14,
                  grounded: false,
                  lifetime: 360,
                });
              }

              // If Boss Core was killed, trigger victory/stage clear sequence!
              if (e.type === 'boss_core') {
                this.bossDefeated = true;
                this.bossDefeatTimer = 180;
                this.screenShake = 20;
              }
            }

            if (!b.piercing) {
              bulletHit = true;
              break;
            }
          }
        }

        if (bulletHit) {
          this.bullets.splice(i, 1);
          continue;
        }
      } else {
        // Enemy Bullets hitting Players
        for (const p of this.players) {
          if (p.state === 'dead' || p.barrierTime > 0 || p.invulnerableTime > 0 || p.isSubmerged) continue;

          // If prone on ground, player hitbox is lower (dodges high bullets!)
          const pTop = p.isProne ? p.y - 8 : p.y - p.height;
          const pBottom = p.y;
          const pLeft = p.x - p.width / 2;
          const pRight = p.x + p.width / 2;

          if (b.x >= pLeft && b.x <= pRight && b.y >= pTop && b.y <= pBottom) {
            this.killPlayer(p);
            this.bullets.splice(i, 1);
            break;
          }
        }
      }
    }
  }

  /**
   * Update Power-Up Items on Ground & Pickup
   */
  private updatePowerUps() {
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const item = this.powerUps[i];
      item.lifetime--;

      if (!item.grounded) {
        item.vy += 0.2;
        item.y += item.vy;

        // Platform landing
        for (const plat of this.platforms) {
          if (
            plat.type !== 'water' &&
            item.x >= plat.x &&
            item.x <= plat.x + plat.width &&
            item.y >= plat.y - 8 &&
            item.y <= plat.y + 4
          ) {
            item.y = plat.y - 7;
            item.grounded = true;
            item.vy = 0;
            break;
          }
        }
      }

      // Check pickup by players
      for (const p of this.players) {
        if (p.state === 'dead') continue;
        if (Math.hypot(p.x - item.x, p.y - 10 - item.y) < 18) {
          this.applyPowerUp(p, item.type);
          audio.playPowerUp();
          this.particles.addHitSpark(item.x, item.y);
          this.powerUps.splice(i, 1);
          break;
        }
      }

      if (item.lifetime <= 0) {
        this.powerUps.splice(i, 1);
      }
    }
  }

  private applyPowerUp(p: Player, type: PowerUpType) {
    if (type === 'B') {
      p.barrierTime = 900; // 15 seconds invincibility
    } else if (type === 'BOMB') {
      // Clear active soldiers & turrets
      this.enemies.forEach(e => {
        if (e.type !== 'boss_core') {
          e.active = false;
          this.particles.addExplosion(e.x, e.y);
        }
      });
      audio.playExplosion(true);
      this.screenShake = 15;
    } else {
      p.weapon = type;
    }
  }

  /**
   * Update roaming NPCs, animals, dogs, monkeys, leaping fish, and civilians
   */
  private updateNPCs() {
    this.npcs.forEach(npc => {
      if (npc.captured) return;

      npc.animTimer++;
      if (npc.barkTimer > 0) npc.barkTimer--;
      if (npc.dialogueTimer > 0) npc.dialogueTimer--;

      // Behavior per NPC type
      switch (npc.type) {
        case 'dog': {
          // Wander along ground
          npc.x += npc.vx;
          if (Math.random() < 0.008) {
            npc.vx = -npc.vx;
            npc.facing = npc.vx > 0 ? 1 : -1;
          }
          // Random bark
          if (npc.barkTimer === 0 && Math.random() < 0.004) {
            npc.barkTimer = 60;
            if (Math.abs(npc.x - this.cameraX - this.viewWidth / 2) < this.viewWidth / 2) {
              audio.playDogBark();
            }
          }
          break;
        }

        case 'monkey': {
          // Playful hops
          if (Math.random() < 0.015 && npc.grounded) {
            npc.vy = -3;
            npc.grounded = false;
          }
          if (!npc.grounded) {
            npc.y += npc.vy;
            npc.vy += 0.2;
            if (npc.y >= 170) {
              npc.y = 170;
              npc.vy = 0;
              npc.grounded = true;
            }
          }
          break;
        }

        case 'fish': {
          // Periodic high arc leap from water
          if (npc.animTimer % 180 === 0) {
            npc.vy = -4.5;
            npc.grounded = false;
            if (Math.abs(npc.x - this.cameraX - this.viewWidth / 2) < this.viewWidth / 2) {
              audio.playFishSplash();
              this.particles.addWaterSplash(npc.x, npc.y + 4);
            }
          }
          if (!npc.grounded) {
            npc.y += npc.vy;
            npc.vy += 0.18;
            if (npc.y >= 210) {
              npc.y = 210;
              npc.vy = 0;
              npc.grounded = true;
              this.particles.addWaterSplash(npc.x, 214);
            }
          }
          break;
        }

        case 'civilian': {
          // Paces and waves for help
          npc.x += npc.vx * 0.4;
          if (Math.random() < 0.01) {
            npc.vx = -npc.vx;
            npc.facing = npc.vx > 0 ? 1 : -1;
          }
          if (npc.dialogueTimer === 0 && Math.random() < 0.006) {
            npc.dialogueTimer = 90;
            const cries = ['CỨU VỚI!', 'CỐ LÊN!', 'ANH HÙNG!'];
            npc.dialogue = cries[Math.floor(Math.random() * cries.length)];
          }
          break;
        }
      }

      // Check collision with players
      this.players.forEach(p => {
        if (p.state === 'dead') return;

        const pBox = {
          x: p.x - p.width / 2,
          y: p.y - p.height,
          w: p.width,
          h: p.height,
        };

        const npcBox = {
          x: npc.x - npc.width / 2,
          y: npc.y - npc.height,
          w: npc.width,
          h: npc.height,
        };

        const overlap =
          pBox.x < npcBox.x + npcBox.w &&
          pBox.x + pBox.w > npcBox.x &&
          pBox.y < npcBox.y + npcBox.h &&
          pBox.y + pBox.h > npcBox.y;

        if (overlap) {
          if (npc.type === 'dog') {
            // Playful puppy bite & capture
            if (npc.barkTimer === 0) {
              npc.barkTimer = 45;
              audio.playDogBark();
            }
            npc.captured = true;
            this.inventory.pets++;
            audio.playCivilianCheer();
            this.particles.addScore(p.x, p.y - 20, 1000);
            p.score += 1000;
          } else if (npc.type === 'fish') {
            npc.captured = true;
            this.inventory.fishes++;
            audio.playFishSplash();
            audio.playPowerUp();
            this.particles.addScore(p.x, p.y - 20, 500);
            p.score += 500;
          } else if (npc.type === 'civilian') {
            npc.captured = true;
            this.inventory.civilians++;
            audio.playCivilianCheer();
            this.particles.addScore(p.x, p.y - 26, 1500);
            p.score += 1500;
          } else if (npc.type === 'monkey') {
            npc.captured = true;
            this.inventory.pets++;
            audio.playCivilianCheer();
            this.particles.addScore(p.x, p.y - 20, 800);
            p.score += 800;
          }
        }
      });
    });
  }

  /**
   * Check Boss Defeat & Level Completion Sequence
   */
  private checkStageProgress() {
    if (this.bossDefeated) {
      this.bossDefeatTimer--;

      // Secondary fireworks across boss arena
      if (this.bossDefeatTimer % 12 === 0) {
        const rx = this.cameraX + Math.random() * this.viewWidth;
        const ry = Math.random() * (this.viewHeight - 60) + 30;
        this.particles.addExplosion(rx, ry, true);
        audio.playExplosion(false);
      }

      if (this.bossDefeatTimer <= 0) {
        // Advance to next stage or Victory!
        if (this.levelIndex + 1 < this.levels.length) {
          this.levelIndex++;
          this.currentLevel = this.levels[this.levelIndex];
          this.start(this.mode, this.players[0].lives, this.difficulty, this.levelIndex);
        } else {
          this.status = 'victory';
          audio.stopBGM();
          audio.playKonamiSecret();
        }
      }
    }
  }

  /**
   * Get Real-time Boss Battle Status (HP, %, Defeat progress)
   */
  public getBossStatus(): BossStatus {
    const bossConfig = this.currentLevel.boss;
    const isFinalBoss = this.levelIndex === 4;
    const bossCore = this.enemies.find(e => e.type === 'boss_core');

    const defaultName = this.customBossConfig?.name || bossConfig.name;
    const displayName = isFinalBoss
      ? (this.customBossConfig?.name ? `TRÙM CUỐI: ${this.customBossConfig.name.toUpperCase()}` : 'TRÙM CUỐI: TRÁI TIM QUÁI VẬT NGOÀI HÀNH TINH')
      : defaultName;

    if (!bossCore) {
      return {
        isActive: false,
        name: displayName,
        isFinalBoss,
        hp: 0,
        maxHp: bossConfig.coreHp || (isFinalBoss ? 100 : 60),
        hpPercent: 0,
        damageDealtPercent: 100,
        defeated: this.bossDefeated,
      };
    }

    const maxHp = bossCore.maxHp || (bossConfig.coreHp || (isFinalBoss ? 100 : 60));
    const currentHp = Math.max(0, bossCore.hp);
    const hpPercent = Math.max(0, Math.min(100, Math.round((currentHp / maxHp) * 100)));
    const damageDealtPercent = 100 - hpPercent;

    return {
      isActive: (bossCore.active || this.bossDefeatTimer > 0) && (this.cameraX >= bossConfig.triggerX - 100),
      name: displayName,
      isFinalBoss,
      hp: currentHp,
      maxHp,
      hpPercent,
      damageDealtPercent,
      defeated: this.bossDefeated || currentHp <= 0,
    };
  }

  /**
   * Main Canvas Render (Translates by Camera and Shake)
   */
  public render(ctx: CanvasRenderingContext2D) {
    ctx.save();

    // Screen shake offset
    const shakeX = (Math.random() - 0.5) * this.screenShake;
    const shakeY = (Math.random() - 0.5) * this.screenShake;
    ctx.translate(shakeX, shakeY);

    // 1. Parallax Retro Background
    this.renderBackground(ctx);

    // 2. Camera Viewport Translation
    ctx.save();
    ctx.translate(-Math.round(this.cameraX), -Math.round(this.cameraY));

    // Draw Platforms & Water
    this.platforms.forEach(plat => {
      // Draw if within visible camera bounds
      if (plat.x + plat.width >= this.cameraX && plat.x <= this.cameraX + this.viewWidth) {
        SpriteRenderer.drawPlatform(ctx, plat, this.tick);
      }
    });

    // Draw Boss Fortress Wall structure if near boss
    this.renderBossStructures(ctx);

    // Draw NPCs & Animals (Dogs, Monkeys, Leaping Fish, Civilians)
    this.npcs.forEach(npc => {
      if (npc.x >= this.cameraX - 40 && npc.x <= this.cameraX + this.viewWidth + 40) {
        SpriteRenderer.drawNPC(ctx, npc);
      }
    });

    // Draw Enemies (including custom uploaded boss face)
    this.enemies.forEach(e => {
      if (e.x >= this.cameraX - 40 && e.x <= this.cameraX + this.viewWidth + 40) {
        SpriteRenderer.drawEnemy(
          ctx, 
          e, 
          this.customBossImg, 
          this.customBossConfig?.name || this.currentLevel.boss.name
        );
      }
    });

    // Draw Power-Up items
    this.powerUps.forEach(item => {
      SpriteRenderer.drawPowerUpItem(ctx, item);
    });

    // Draw Bullets
    this.bullets.forEach(b => {
      SpriteRenderer.drawBullet(ctx, b);
    });

    // Draw Players
    this.players.forEach(p => {
      SpriteRenderer.drawPlayer(ctx, p);
    });

    // Draw Particles
    this.particles.particles.forEach(pt => {
      SpriteRenderer.drawParticle(ctx, pt);
    });

    ctx.restore();
    ctx.restore();

    // 3. Screen-Space Retro Arcade Overlays (Boss Health Bar & Flying Ammo Alerts)
    this.renderBossHealthBar(ctx);
    this.renderCapsuleNotice(ctx);
  }

  /**
   * Render Retro Arcade Boss Health Bar at Top of Canvas
   */
  private renderBossHealthBar(ctx: CanvasRenderingContext2D) {
    const status = this.getBossStatus();
    if (!status.isActive) return;

    ctx.save();
    const barW = 280;
    const barH = 26;
    const startX = Math.round((this.viewWidth - barW) / 2);
    const startY = 8;

    // Outer Frame Background with dark glass
    ctx.fillStyle = 'rgba(9, 14, 28, 0.94)';
    ctx.fillRect(startX, startY, barW, barH);

    // Border (red if critical/final boss, amber otherwise)
    ctx.strokeStyle = status.hpPercent <= 20 || status.isFinalBoss ? '#ef4444' : '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(startX, startY, barW, barH);

    // Header: Boss Title
    ctx.font = 'bold 8px monospace';
    ctx.fillStyle = status.isFinalBoss ? '#f87171' : '#fbbf24';
    ctx.textAlign = 'left';
    const bossTitle = status.isFinalBoss ? `⚠️ TRÙM CUỐI: ${status.name}` : `⚠️ ${status.name}`;
    ctx.fillText(bossTitle.length > 32 ? bossTitle.slice(0, 31) + '...' : bossTitle, startX + 6, startY + 9);

    // Header Right: HP & % info
    ctx.textAlign = 'right';
    if (status.defeated) {
      ctx.fillStyle = '#34d399';
      ctx.fillText('💥 TIÊU DIỆT 100%!', startX + barW - 6, startY + 9);
    } else {
      ctx.fillStyle = '#e2e8f0';
      ctx.fillText(`MÁU: ${status.hpPercent}% (ĐÃ DIỆT ${status.damageDealtPercent}%)`, startX + barW - 6, startY + 9);
    }

    // Health Bar Gauge Container
    const gaugeX = startX + 6;
    const gaugeY = startY + 13;
    const gaugeW = barW - 12;
    const gaugeH = 8;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(gaugeX, gaugeY, gaugeW, gaugeH);

    // Gauge Fill with color gradient depending on HP
    const fillW = Math.max(0, Math.round((status.hpPercent / 100) * gaugeW));
    if (fillW > 0) {
      let gradColor1 = '#10b981';
      let gradColor2 = '#34d399';
      if (status.hpPercent <= 20) {
        // Red flashing
        gradColor1 = this.tick % 10 < 5 ? '#ef4444' : '#b91c1c';
        gradColor2 = '#f87171';
      } else if (status.hpPercent <= 50) {
        gradColor1 = '#d97706';
        gradColor2 = '#fbbf24';
      }

      const grad = ctx.createLinearGradient(gaugeX, gaugeY, gaugeX + fillW, gaugeY);
      grad.addColorStop(0, gradColor1);
      grad.addColorStop(1, gradColor2);
      ctx.fillStyle = grad;
      ctx.fillRect(gaugeX, gaugeY, fillW, gaugeH);

      // Glass highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(gaugeX, gaugeY, fillW, 2);
    }

    // Gauge Segment tick marks (every 20%)
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.lineWidth = 1;
    for (let p = 0.2; p < 1; p += 0.2) {
      const tx = gaugeX + gaugeW * p;
      ctx.beginPath();
      ctx.moveTo(tx, gaugeY);
      ctx.lineTo(tx, gaugeY + gaugeH);
      ctx.stroke();
    }

    // Gauge Inner Border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.strokeRect(gaugeX, gaugeY, gaugeW, gaugeH);

    ctx.restore();
  }

  /**
   * Render Flying Ammo / Capsule Arrival Alert Banner
   */
  private renderCapsuleNotice(ctx: CanvasRenderingContext2D) {
    if (this.capsuleNoticeTimer <= 0) return;

    ctx.save();
    const noticeW = 220;
    const noticeH = 18;
    const nx = Math.round((this.viewWidth - noticeW) / 2);
    const ny = 38;

    // Glowing Pill Banner
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(nx, ny, noticeW, noticeH);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    ctx.strokeRect(nx, ny, noticeW, noticeH);

    ctx.font = 'bold 8px monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'center';
    ctx.fillText(this.capsuleNoticeText, this.viewWidth / 2, ny + 12);

    ctx.restore();
  }

  /**
   * Render Multi-Layer Parallax Background
   */
  private renderBackground(ctx: CanvasRenderingContext2D) {
    const bgType = this.currentLevel.bgType;

    if (bgType === 'jungle') {
      // Stage 1: Rừng Nhiệt Đới Tây Nguyên & Thác Dray Nur
      const skyGrad = ctx.createLinearGradient(0, 0, 0, this.viewHeight);
      skyGrad.addColorStop(0, '#020617');
      skyGrad.addColorStop(0.5, '#0f172a');
      skyGrad.addColorStop(0.85, '#14532d');
      skyGrad.addColorStop(1, '#052e16');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, this.viewWidth, this.viewHeight);

      // Distant stars
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 35; i++) {
        const sx = ((i * 47) - this.cameraX * 0.05) % this.viewWidth;
        const sy = (i * 29) % 110;
        ctx.fillRect(sx < 0 ? sx + this.viewWidth : sx, sy, 1.5, 1.5);
      }

      // Parallax Mountains (Distant, slow scroll)
      ctx.fillStyle = '#064e3b';
      for (let x = -60; x < this.viewWidth + 120; x += 90) {
        const mx = x - ((this.cameraX * 0.15) % 90);
        ctx.beginPath();
        ctx.moveTo(mx, 220);
        ctx.lineTo(mx + 45, 120);
        ctx.lineTo(mx + 90, 220);
        ctx.fill();
      }

      // Mid-ground Palm Tree Silhouettes (Medium scroll)
      ctx.fillStyle = '#022c22';
      for (let x = -40; x < this.viewWidth + 100; x += 110) {
        const tx = x - ((this.cameraX * 0.35) % 110);
        ctx.fillRect(tx + 20, 150, 4, 70);
        ctx.beginPath();
        ctx.arc(tx + 22, 150, 18, Math.PI, 0);
        ctx.fill();
      }
    } else if (bgType === 'desert') {
      // Stage 2: Đồi Cát Mũi Né & Sa Mạc Sahara
      const skyGrad = ctx.createLinearGradient(0, 0, 0, this.viewHeight);
      skyGrad.addColorStop(0, '#431407');
      skyGrad.addColorStop(0.35, '#9a3412');
      skyGrad.addColorStop(0.7, '#ea580c');
      skyGrad.addColorStop(1, '#fde047');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, this.viewWidth, this.viewHeight);

      // Blazing Giant Sunset Sun
      const sunX = (this.viewWidth * 0.7 - this.cameraX * 0.05) % this.viewWidth;
      const sunGrad = ctx.createRadialGradient(sunX, 85, 5, sunX, 85, 45);
      sunGrad.addColorStop(0, '#ffffff');
      sunGrad.addColorStop(0.3, '#fef08a');
      sunGrad.addColorStop(0.7, '#f59e0b');
      sunGrad.addColorStop(1, 'rgba(234, 88, 12, 0)');
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(sunX, 85, 45, 0, Math.PI * 2);
      ctx.fill();

      // Ancient Champa Poshanu Tower Silhouette
      ctx.fillStyle = '#7c2d12';
      const towerX = (150 - this.cameraX * 0.12) % (this.viewWidth + 100);
      ctx.fillRect(towerX, 120, 32, 70);
      ctx.fillRect(towerX + 4, 98, 24, 22);
      ctx.fillRect(towerX + 8, 80, 16, 18);
      ctx.fillRect(towerX + 13, 70, 6, 10);

      // Parallax Dunes - Layer 1 (Far)
      ctx.fillStyle = '#c2410c';
      for (let x = -80; x < this.viewWidth + 120; x += 140) {
        const dx = x - ((this.cameraX * 0.2) % 140);
        ctx.beginPath();
        ctx.moveTo(dx, 220);
        ctx.bezierCurveTo(dx + 40, 150, dx + 100, 160, dx + 140, 220);
        ctx.fill();
      }

      // Parallax Dunes - Layer 2 (Near)
      ctx.fillStyle = '#ea580c';
      for (let x = -60; x < this.viewWidth + 120; x += 110) {
        const dx = x - ((this.cameraX * 0.4) % 110);
        ctx.beginPath();
        ctx.moveTo(dx, 230);
        ctx.bezierCurveTo(dx + 30, 175, dx + 80, 185, dx + 110, 230);
        ctx.fill();
      }
    } else if (bgType === 'halong_beach') {
      // Stage 3: Vịnh Hạ Long & Hawaii Emerald Bay
      const skyGrad = ctx.createLinearGradient(0, 0, 0, this.viewHeight);
      skyGrad.addColorStop(0, '#0284c7');
      skyGrad.addColorStop(0.55, '#38bdf8');
      skyGrad.addColorStop(0.8, '#bae6fd');
      skyGrad.addColorStop(1, '#059669');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, this.viewWidth, this.viewHeight);

      // Fluffy tropical clouds
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      for (let i = 0; i < 4; i++) {
        const cx = ((i * 130 + 30) - this.cameraX * 0.08) % (this.viewWidth + 80);
        const cy = 35 + (i * 18) % 40;
        ctx.beginPath();
        ctx.arc(cx, cy, 14, 0, Math.PI * 2);
        ctx.arc(cx + 12, cy - 4, 18, 0, Math.PI * 2);
        ctx.arc(cx + 26, cy, 12, 0, Math.PI * 2);
        ctx.fill();
      }

      // Iconic Halong Limestone Karsts (Hòn Trống Mái / Ti Tốp)
      ctx.fillStyle = '#065f46';
      for (let x = -50; x < this.viewWidth + 120; x += 120) {
        const kx = x - ((this.cameraX * 0.22) % 120);
        ctx.beginPath();
        ctx.moveTo(kx, 220);
        ctx.lineTo(kx + 15, 105);
        ctx.lineTo(kx + 35, 95);
        ctx.lineTo(kx + 50, 115);
        ctx.lineTo(kx + 65, 220);
        ctx.fill();
        // Vegetation highlights on peaks
        ctx.fillStyle = '#047857';
        ctx.fillRect(kx + 18, 100, 28, 8);
        ctx.fillStyle = '#065f46';
      }

      // Traditional Vietnamese Red Junk Boat with Crimson Sails
      const boatX = (240 - this.cameraX * 0.3) % (this.viewWidth + 120);
      const boatBob = Math.sin(this.tick * 0.06) * 3;
      ctx.fillStyle = '#78350f';
      ctx.fillRect(boatX, 175 + boatBob, 28, 6);
      ctx.fillStyle = '#dc2626'; // Red sail
      ctx.beginPath();
      ctx.moveTo(boatX + 14, 150 + boatBob);
      ctx.lineTo(boatX + 26, 172 + boatBob);
      ctx.lineTo(boatX + 14, 172 + boatBob);
      ctx.fill();

      // Seabirds gliding
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.2;
      for (let i = 0; i < 3; i++) {
        const bx = (i * 90 + 70 - this.cameraX * 0.4) % this.viewWidth;
        const by = 50 + i * 16 + Math.sin(this.tick * 0.05 + i) * 4;
        ctx.beginPath();
        ctx.moveTo(bx - 6, by - 2);
        ctx.quadraticCurveTo(bx - 2, by - 6, bx, by);
        ctx.quadraticCurveTo(bx + 2, by - 6, bx + 6, by - 2);
        ctx.stroke();
      }
    } else if (bgType === 'cyber_saigon') {
      // Stage 4: Sài Gòn & Tokyo Cyberpunk Metropolis
      const skyGrad = ctx.createLinearGradient(0, 0, 0, this.viewHeight);
      skyGrad.addColorStop(0, '#020617');
      skyGrad.addColorStop(0.5, '#1e1b4b');
      skyGrad.addColorStop(0.85, '#312e81');
      skyGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, this.viewWidth, this.viewHeight);

      // Distant Neon Grid Stars
      ctx.fillStyle = '#38bdf8';
      for (let i = 0; i < 25; i++) {
        const sx = ((i * 53) - this.cameraX * 0.04) % this.viewWidth;
        const sy = (i * 23) % 90;
        ctx.fillRect(sx < 0 ? sx + this.viewWidth : sx, sy, 1.5, 1.5);
      }

      // Skyline: Landmark 81 & Bitexco Silhouettes
      const lmX = (110 - this.cameraX * 0.15) % (this.viewWidth + 80);
      ctx.fillStyle = '#0f172a';
      // Landmark 81 Spire
      ctx.fillRect(lmX, 60, 24, 140);
      ctx.fillRect(lmX + 6, 35, 12, 25);
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(lmX + 11, 15, 2, 20); // Spire Antenna

      // Bitexco Helipad Tower
      const bitX = (270 - this.cameraX * 0.18) % (this.viewWidth + 80);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(bitX, 80, 28, 120);
      // Helipad cantilever dish
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(bitX + 18, 110, 16, 5);

      // Cyber Neon Signs: "SÀI GÒN", "PHỞ BÒ", "CONTRA"
      ctx.fillStyle = '#f43f5e';
      ctx.font = 'bold 8px monospace';
      ctx.fillText('SÀI GÒN', lmX - 10, 110);
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('PHỞ 24', bitX + 34, 130);

      // Light trails along expressway
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, 195);
      ctx.lineTo(this.viewWidth, 195);
      ctx.stroke();
      ctx.strokeStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(0, 198);
      ctx.lineTo(this.viewWidth, 198);
      ctx.stroke();
    } else if (bgType === 'sondoong_cave') {
      // Stage 5: Hang Sơn Đoòng Subterranean Megacave
      const skyGrad = ctx.createLinearGradient(0, 0, 0, this.viewHeight);
      skyGrad.addColorStop(0, '#020617');
      skyGrad.addColorStop(0.6, '#09090b');
      skyGrad.addColorStop(0.9, '#064e3b');
      skyGrad.addColorStop(1, '#022c22');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, this.viewWidth, this.viewHeight);

      // Colossal Prehistoric Stalactites hanging from roof
      ctx.fillStyle = '#18181b';
      for (let x = -20; x < this.viewWidth + 60; x += 55) {
        const sx = x - ((this.cameraX * 0.2) % 55);
        const h = 35 + ((x * 13) % 40);
        ctx.beginPath();
        ctx.moveTo(sx, 0);
        ctx.lineTo(sx + 14, 0);
        ctx.lineTo(sx + 7, h);
        ctx.fill();
      }

      // Heavenly Doline Skylight Beam (Ánh Sáng Giếng Trời Sơn Đoòng)
      const rayX = (210 - this.cameraX * 0.25) % (this.viewWidth + 100);
      const rayGrad = ctx.createLinearGradient(rayX, 0, rayX + 60, this.viewHeight);
      rayGrad.addColorStop(0, 'rgba(254, 240, 138, 0.45)');
      rayGrad.addColorStop(0.4, 'rgba(253, 224, 71, 0.25)');
      rayGrad.addColorStop(1, 'rgba(20, 83, 45, 0.05)');
      ctx.fillStyle = rayGrad;
      ctx.beginPath();
      ctx.moveTo(rayX - 25, 0);
      ctx.lineTo(rayX + 35, 0);
      ctx.lineTo(rayX + 110, this.viewHeight);
      ctx.lineTo(rayX - 10, this.viewHeight);
      ctx.fill();

      // Underground Emerald Lake Shimmer
      ctx.fillStyle = 'rgba(5, 150, 105, 0.3)';
      ctx.fillRect(0, 195, this.viewWidth, 25);
    } else if (bgType === 'waterfall') {
      // Waterfall mountain gorge
      const skyGrad = ctx.createLinearGradient(0, 0, 0, this.viewHeight);
      skyGrad.addColorStop(0, '#0c4a6e');
      skyGrad.addColorStop(1, '#082f49');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, this.viewWidth, this.viewHeight);

      // Cascading Waterfall in background
      ctx.fillStyle = '#38bdf8';
      const wfx = (180 - this.cameraX * 0.2) % this.viewWidth;
      ctx.fillRect(wfx, 40, 28, 180);
      ctx.fillStyle = '#bae6fd';
      for (let y = 40; y < 220; y += 16) {
        const anim = (this.tick * 3 + y) % 180 + 40;
        ctx.fillRect(wfx + 4, anim, 20, 4);
      }
    } else {
      // Alien Lair / Organic Hive
      const skyGrad = ctx.createLinearGradient(0, 0, 0, this.viewHeight);
      skyGrad.addColorStop(0, '#450a0a');
      skyGrad.addColorStop(1, '#1c1917');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, this.viewWidth, this.viewHeight);
    }
  }

  /**
   * Export compact authoritative snapshot for Network Guest
   */
  public exportSnapshot(): any {
    return {
      tick: this.tick,
      status: this.status,
      cameraX: Math.round(this.cameraX),
      cameraY: Math.round(this.cameraY),
      screenShake: Math.round(this.screenShake * 10) / 10,
      levelIndex: this.levelIndex,
      highScore: this.highScore,
      inventory: this.inventory,
      capsuleNoticeText: this.capsuleNoticeText,
      capsuleNoticeTimer: this.capsuleNoticeTimer,
      players: this.players.map(p => ({
        id: p.id,
        x: Math.round(p.x * 10) / 10,
        y: Math.round(p.y * 10) / 10,
        vx: Math.round(p.vx * 10) / 10,
        vy: Math.round(p.vy * 10) / 10,
        facing: p.facing,
        state: p.state,
        lives: p.lives,
        score: p.score,
        weapon: p.weapon,
        isProne: p.isProne,
        isAimingUp: p.isAimingUp,
        isAimingDown: p.isAimingDown,
        isSubmerged: p.isSubmerged,
        animFrame: p.animFrame,
        barrierTime: p.barrierTime,
        invulnerableTime: p.invulnerableTime,
      })),
      bullets: this.bullets.map(b => ({
        id: b.id,
        x: Math.round(b.x),
        y: Math.round(b.y),
        vx: b.vx,
        vy: b.vy,
        radius: b.radius,
        color: b.color,
        isPlayer: b.isPlayer,
        playerId: b.playerId,
        weaponType: b.weaponType,
      })),
      enemies: this.enemies.filter(e => e.active).map(e => ({
        id: e.id,
        type: e.type,
        x: Math.round(e.x),
        y: Math.round(e.y),
        hp: e.hp,
        maxHp: e.maxHp,
        facing: e.facing,
        animFrame: e.animFrame,
        active: e.active,
      })),
      powerUps: this.powerUps.map(pu => ({
        id: pu.id,
        type: pu.type,
        x: Math.round(pu.x),
        y: Math.round(pu.y),
      })),
      npcs: this.npcs.map(n => ({
        id: n.id,
        type: n.type,
        x: Math.round(n.x),
        y: Math.round(n.y),
        facing: n.facing,
        dialogue: n.dialogue,
        captured: n.captured,
      })),
    };
  }

  /**
   * Apply authoritative snapshot on Network Guest
   */
  public applySnapshot(s: any) {
    if (!s) return;
    this.status = s.status || this.status;
    this.cameraX = s.cameraX ?? this.cameraX;
    this.cameraY = s.cameraY ?? this.cameraY;
    this.screenShake = s.screenShake ?? 0;
    this.highScore = s.highScore ?? this.highScore;
    this.capsuleNoticeText = s.capsuleNoticeText || '';
    this.capsuleNoticeTimer = s.capsuleNoticeTimer || 0;
    if (s.inventory) this.inventory = s.inventory;

    if (s.levelIndex !== undefined && s.levelIndex !== this.levelIndex) {
      this.levelIndex = s.levelIndex;
      this.currentLevel = this.levels[this.levelIndex] || this.levels[0];
      this.platforms = this.currentLevel.platforms.map(p => ({ ...p, bridgeExploded: false, explodeTimer: 0 }));
    }

    // Sync Players
    if (Array.isArray(s.players)) {
      if (this.players.length === 0) {
        this.players = [
          this.createPlayer(1, 'BILL', '#3b82f6', 60, 180, 3),
          this.createPlayer(2, 'LANCE', '#dc2626', 30, 180, 3),
        ];
      }
      s.players.forEach((sp: any) => {
        let p = this.players.find(pl => pl.id === sp.id);
        if (!p) {
          p = this.createPlayer(sp.id, sp.id === 1 ? 'BILL' : 'LANCE', sp.id === 1 ? '#3b82f6' : '#dc2626', sp.x, sp.y, sp.lives);
          this.players.push(p);
        }
        Object.assign(p, sp);
      });
    }

    // Sync Bullets
    if (Array.isArray(s.bullets)) {
      this.bullets = s.bullets.map((sb: any) => ({
        ...sb,
        damage: 1,
        lifetime: 100,
      }));
    }

    // Sync Enemies
    if (Array.isArray(s.enemies)) {
      this.enemies = s.enemies.map((se: any) => ({
        id: se.id,
        type: se.type,
        x: se.x,
        y: se.y,
        vx: 0,
        vy: 0,
        width: 24,
        height: 32,
        hp: se.hp,
        maxHp: se.maxHp,
        scoreValue: 100,
        facing: se.facing,
        shootTimer: 0,
        animTimer: 0,
        animFrame: se.animFrame,
        active: se.active,
      }));
    }

    // Sync PowerUps & NPCs
    if (Array.isArray(s.powerUps)) {
      this.powerUps = s.powerUps.map((pu: any) => ({
        id: pu.id,
        type: pu.type,
        x: pu.x,
        y: pu.y,
        vx: 0,
        vy: 0,
        width: 16,
        height: 12,
        grounded: true,
        lifetime: 300,
      }));
    }

    if (Array.isArray(s.npcs)) {
      this.npcs = s.npcs.map((n: any) => ({
        id: n.id,
        type: n.type,
        name: n.type,
        x: n.x,
        y: n.y,
        vx: 0,
        vy: 0,
        width: 14,
        height: 14,
        facing: n.facing,
        grounded: true,
        animTimer: 0,
        animFrame: 0,
        barkTimer: 0,
        dialogue: n.dialogue,
        dialogueTimer: 60,
        captured: n.captured,
        value: 500,
      }));
    }
  }

  /**
   * Render Boss Fortress Architecture
   */
  private renderBossStructures(ctx: CanvasRenderingContext2D) {
    const boss = this.currentLevel.boss;
    if (this.cameraX + this.viewWidth >= boss.triggerX) {
      // Draw fortified wall plates of the Defense Wall Fortress
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(boss.coreX - 30, 40, 60, 180);

      // Armored rivets & steel girder beams
      ctx.fillStyle = '#334155';
      ctx.fillRect(boss.coreX - 26, 45, 52, 10);
      ctx.fillRect(boss.coreX - 26, 110, 52, 10);
      ctx.fillRect(boss.coreX - 26, 175, 52, 10);

      // Warning hazard stripes
      for (let y = 55; y < 175; y += 12) {
        ctx.fillStyle = '#eab308';
        ctx.fillRect(boss.coreX - 26, y, 6, 6);
        ctx.fillStyle = '#000000';
        ctx.fillRect(boss.coreX - 20, y, 6, 6);
      }
    }
  }
}
