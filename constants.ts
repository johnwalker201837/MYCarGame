
import { Card, CardEffect, EffectType, TargetType, Unit, CardRarity, EnemyTier } from './types';

export const MAX_HAND_SIZE = 5;
export const MAX_ENERGY_CAP = 5; 

// --- Image Generators (Updated for 3D Render Style) ---

const getUnitImage = (prompt: string, width = 400, height = 400) => 
  `https://image.pollinations.ai/prompt/3d%20render%20character%20model%20${encodeURIComponent(prompt)}%20blender%20cycles%20unreal%20engine%205%208k%20black%20background%20isolated?width=${width}&height=${height}&nologo=true&seed=${Math.floor(Math.random() * 1000)}`;

const getCardImage = (prompt: string) => 
  `https://image.pollinations.ai/prompt/3d%20fantasy%20icon%20render%20${encodeURIComponent(prompt)}%20game%20asset%20high%20quality?width=300&height=400&nologo=true&seed=${Math.floor(Math.random() * 1000)}`;

const IMAGES = {
  WARRIOR: getUnitImage('futuristic fantasy knight paladin shiny silver armor glowing blue sword shield', 400, 400),
  
  // Enemies (3D Models)
  GOBLIN: getUnitImage('ugly goblin creature green skin leather armor dagger', 350, 350), // Normal
  WOLF: getUnitImage('ferocious dire wolf mechanical cybernetic enhancements glowing red eyes', 400, 400), // Rare
  ORC: getUnitImage('massive orc berserker heavy iron armor giant battle axe', 450, 450), // Elite
  DEMON: getUnitImage('giant diablo demon lord wings fire horns magma skin', 500, 500), // Boss
  
  // Allies
  ARCHER: getUnitImage('elf ranger archer hood glowing bow 3d render', 300, 400),
  HEALER: getUnitImage('cleric healer white gold robes floating staff 3d render', 300, 400),
};

export const INITIAL_PLAYER: Unit = {
  id: 'player',
  name: 'Ironclad',
  maxHp: 100, // Updated to 100
  currentHp: 100,
  block: 0,
  image: IMAGES.WARRIOR,
  isEnemy: false,
  speed: 5,
  status: [],
  burn: 0,
  stun: 0,
  weak: 0
};

// Enemy Definitions by Tier (HP 300 - 1500)
interface EnemyTemplate {
  name: string;
  maxHp: number;
  image: string;
  speed: number;
  tier: EnemyTier;
}

export const ENEMY_POOLS: Record<EnemyTier, EnemyTemplate[]> = {
  NORMAL: [
    { name: 'Scavenger Goblin', maxHp: 300, image: IMAGES.GOBLIN, speed: 7, tier: 'NORMAL' },
    { name: 'Dungeon Grunt', maxHp: 350, image: IMAGES.GOBLIN, speed: 6, tier: 'NORMAL' },
  ],
  RARE: [
     { name: 'Cyber Wolf', maxHp: 500, image: IMAGES.WOLF, speed: 8, tier: 'RARE' },
     { name: 'Shadow Stalker', maxHp: 550, image: IMAGES.WOLF, speed: 9, tier: 'RARE' },
  ],
  ELITE: [
    { name: 'Orc Warlord', maxHp: 800, image: IMAGES.ORC, speed: 5, tier: 'ELITE' },
    { name: 'Steel Guardian', maxHp: 900, image: IMAGES.ORC, speed: 4, tier: 'ELITE' },
  ],
  BOSS: [
    { name: 'Diablo Prime', maxHp: 1500, image: IMAGES.DEMON, speed: 6, tier: 'BOSS' },
    { name: 'The World Eater', maxHp: 1400, image: IMAGES.DEMON, speed: 5, tier: 'BOSS' },
  ]
};

// Card Library
const createCard = (
  name: string, 
  cost: number, 
  desc: string, 
  effects: CardEffect[], 
  target: TargetType,
  imgPrompt: string,
  rarity: CardRarity
): Card => ({
  id: Math.random().toString(36).substring(7),
  name,
  description: desc,
  cost,
  effects,
  targetType: target,
  image: getCardImage(imgPrompt),
  rarity
});

export const BASE_DECK_TEMPLATES: Card[] = [
  // --- GRAY (BASIC) - Cost 0-1 ---
  createCard('Quick Slash', 0, 'Deal 40 dmg.', [{ type: EffectType.DAMAGE, value: 40 }], TargetType.ENEMY, 'simple iron dagger swipe', 'BASIC'),
  createCard('Small Shield', 0, 'Gain 30 Block.', [{ type: EffectType.BLOCK, value: 30 }], TargetType.SELF, 'wooden buckler shield', 'BASIC'),

  // --- WHITE (COMMON) - Cost 1 ---
  createCard('Heavy Strike', 1, 'Deal 80 dmg.', [{ type: EffectType.DAMAGE, value: 80 }], TargetType.ENEMY, 'heavy iron sword smash', 'COMMON'),
  createCard('Guard', 1, 'Gain 60 Block.', [{ type: EffectType.BLOCK, value: 60 }], TargetType.SELF, 'iron shield defense', 'COMMON'),
  createCard('Zap', 1, 'Deal 60 dmg + Stun(1)', [{ type: EffectType.DAMAGE, value: 60 }, { type: EffectType.STUN, value: 1 }], TargetType.ENEMY, 'lightning bolt spark', 'COMMON'),

  // --- GREEN (UNCOMMON) - Cost 1-2 ---
  createCard('Poison Tip', 1, 'Apply 20 Weak.', [{ type: EffectType.WEAK, value: 20 }], TargetType.ENEMY, 'green poison vial dripping', 'UNCOMMON'),
  createCard('Cleave', 2, 'Deal 70 dmg to ALL.', [{ type: EffectType.DAMAGE, value: 70 }], TargetType.ALL_ENEMIES, 'red sweeping blade arc', 'UNCOMMON'),

  // --- BLUE (RARE) - Cost 2 ---
  createCard('Ice Wall', 2, 'Gain 150 Block.', [{ type: EffectType.BLOCK, value: 150 }], TargetType.SELF, 'blue ice glacier wall', 'RARE'),
  createCard('Blizzard', 2, 'Deal 100 dmg to ALL + Weak(5).', [{ type: EffectType.DAMAGE, value: 100 }, { type: EffectType.WEAK, value: 5 }], TargetType.ALL_ENEMIES, 'snow storm ice blizzard', 'RARE'),

  // --- PURPLE (EPIC) - Cost 3 ---
  createCard('Void Strike', 3, 'Deal 300 damage.', [{ type: EffectType.DAMAGE, value: 300 }], TargetType.ENEMY, 'purple black hole void energy', 'EPIC'),
  createCard('Vampirism', 3, 'Heal 100 HP.', [{ type: EffectType.HEAL, value: 100 }], TargetType.SELF, 'red blood life drain', 'EPIC'),

  // --- ORANGE (LEGENDARY) - Cost 4 ---
  createCard('Meteor', 4, 'Deal 500 dmg to ALL.', [{ type: EffectType.DAMAGE, value: 500 }], TargetType.ALL_ENEMIES, 'giant meteor crash explosion orange', 'LEGENDARY'),
  
  // --- GOLD (MYTHIC) - Cost 5 ---
  createCard('Divine Intervention', 5, 'Heal Full & Deal 1000.', [{ type: EffectType.HEAL, value: 500 }, { type: EffectType.DAMAGE, value: 1000 }], TargetType.ENEMY, 'golden god ray holy light', 'MYTHIC'),
];

export const NPC_TEMPLATES: Record<string, Partial<Unit>> = {
  'Archer': { maxHp: 150, image: IMAGES.ARCHER, speed: 9 }, 
  'Healer': { maxHp: 120, image: IMAGES.HEALER, speed: 4 }, 
};
