
export enum TargetType {
  ENEMY = 'ENEMY',
  SELF = 'SELF',
  ALL_ENEMIES = 'ALL_ENEMIES',
  ALL_ALLIES = 'ALL_ALLIES',
  NONE = 'NONE'
}

export enum EffectType {
  DAMAGE = 'DAMAGE',
  HEAL = 'HEAL',
  BLOCK = 'BLOCK',
  SUMMON = 'SUMMON', // Spawns helper NPC
  DRAW = 'DRAW',
  BURN = 'BURN',
  STUN = 'STUN',
  WEAK = 'WEAK',
  ENERGY = 'ENERGY'
}

export interface CardEffect {
  type: EffectType;
  value: number;
  meta?: string; // For summon names or specific logic
}

// Seven rarities as requested:
// Gray (BASIC), White (COMMON), Green (UNCOMMON), Blue (RARE), Purple (EPIC), Orange (LEGENDARY), Gold (MYTHIC)
export type CardRarity = 'BASIC' | 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'MYTHIC';

export interface Card {
  id: string;
  name: string;
  description: string;
  cost: number;
  image: string;
  effects: CardEffect[];
  targetType: TargetType;
  rarity: CardRarity;
}

export type EnemyTier = 'NORMAL' | 'RARE' | 'ELITE' | 'BOSS';

export interface Unit {
  id: string;
  name: string;
  maxHp: number;
  currentHp: number;
  block: number;
  image: string;
  isEnemy: boolean;
  tier?: EnemyTier; // Only relevant for enemies
  speed: number; // 1-10, determines turn order or evasion chance
  status: string[]; 
  turnsRemaining?: number; // For temporary summons, undefined for permanent units
  burn: number;
  stun: number;
  weak: number;
}

export interface GameState {
  turn: number;
  energy: number;
  maxEnergy: number; // Grows from 1 to 5
  player: Unit;
  allies: Unit[];
  enemies: Unit[];
  hand: Card[];
  deck: Card[];
  discard: Card[];
  battleLog: string[];
  commentary: string;
  isGameOver: boolean;
  victory: boolean;
}
