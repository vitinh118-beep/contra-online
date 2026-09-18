export type WeaponType = 'R' | 'M' | 'S' | 'L' | 'F';

export type PowerUpType = WeaponType | 'B' | 'BOMB';

export type PlayerState = 
  | 'idle' 
  | 'run' 
  | 'jump' 
  | 'prone' 
  | 'swimming' 
  | 'dying' 
  | 'dead';

export interface Player {
  id: 1 | 2;
  name: string;
  color: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  facing: 1 | -1;
  state: PlayerState;
  isGrounded: boolean;
  isAimingUp: boolean;
  isAimingDown: boolean;
  isProne: boolean;
  isSubmerged: boolean; // Diving under water to dodge bullets
  lives: number;
  score: number;
  weapon: WeaponType;
  shootCooldown: number;
  invulnerableTime: number; // ticks
  barrierTime: number; // ticks (invincibility bubble)
  animFrame: number;
  animTimer: number;
  waterSplashTimer: number;
  jumpLock: boolean;
}

export interface Bullet {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  glowColor?: string;
  damage: number;
  isPlayer: boolean;
  playerId?: 1 | 2;
  weaponType?: WeaponType;
  lifetime: number;
  piercing?: boolean;
}

export type EnemyType = 
  | 'soldier' 
  | 'sniper' 
  | 'turret' 
  | 'cannon'
  | 'capsule' 
  | 'wall_sensor'
  | 'scuba'
  | 'boss_core'
  | 'boss_turret';

export interface Enemy {
  id: string;
  type: EnemyType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  scoreValue: number;
  facing: 1 | -1;
  shootTimer: number;
  animTimer: number;
  animFrame: number;
  dropItem?: PowerUpType;
  state?: string;
  active: boolean;
  phase?: number;
}

export interface Platform {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'solid' | 'oneway' | 'water' | 'bridge';
  bridgeExploded?: boolean;
  triggerX?: number;
  explodeTimer?: number;
}

export interface PowerUpItem {
  id: string;
  type: PowerUpType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  grounded: boolean;
  lifetime: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  radius: number;
  alpha: number;
  decay: number;
  type?: 'spark' | 'smoke' | 'debris' | 'ring' | 'water' | 'score';
  text?: string;
}

export type GameStatus = 'title' | 'playing' | 'stage_clear' | 'game_over' | 'victory' | 'paused';
export type GameMode = '1P' | '2P';
export type GameDifficulty = 'easy' | 'normal' | 'hard';

export interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  jump: boolean;
  shoot: boolean;
  prevJump: boolean;
  prevShoot: boolean;
}

export type LevelBgType = 
  | 'jungle' 
  | 'waterfall' 
  | 'desert' 
  | 'halong_beach' 
  | 'cyber_saigon' 
  | 'sondoong_cave' 
  | 'alien';

export type MusicMood = 'epic' | 'boss_rush' | 'chill' | 'jungle_mystic' | 'custom';

export interface BossFaceConfig {
  imageUrl: string;
  name: string;
  title: string;
}

export type NPCType = 'dog' | 'monkey' | 'fish' | 'civilian';

export interface NPC {
  id: string;
  type: NPCType;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  facing: 1 | -1;
  grounded: boolean;
  animTimer: number;
  animFrame: number;
  barkTimer: number;
  dialogue?: string;
  dialogueTimer: number;
  captured: boolean;
  value: number;
}

export interface PlayerInventory {
  fishes: number;
  pets: number;
  civilians: number;
}

export interface LevelConfig {
  id: number;
  name: string;
  subtitle: string;
  length: number;
  groundY: number;
  bgType: LevelBgType;
  platforms: Platform[];
  enemySpawns: {
    triggerX: number;
    type: EnemyType;
    x: number;
    y: number;
    dropItem?: PowerUpType;
  }[];
  npcSpawns?: {
    type: NPCType;
    x: number;
    y: number;
    name?: string;
  }[];
  boss: {
    name: string;
    triggerX: number;
    coreX: number;
    coreY: number;
    coreHp?: number;
    turrets: { x: number; y: number; hp: number }[];
  };
}

export interface BossStatus {
  isActive: boolean;
  name: string;
  isFinalBoss: boolean;
  hp: number;
  maxHp: number;
  hpPercent: number;
  damageDealtPercent: number;
  defeated: boolean;
}
