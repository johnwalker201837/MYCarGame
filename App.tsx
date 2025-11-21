
import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { INITIAL_PLAYER, BASE_DECK_TEMPLATES, MAX_HAND_SIZE, MAX_ENERGY_CAP, NPC_TEMPLATES, ENEMY_POOLS } from './constants';
import { Card, Unit, GameState, TargetType, EffectType, EnemyTier, CardEffect } from './types';
import { getBattleCommentary } from './services/geminiService';
import Card3D from './components/Card3D';
import Unit3D from './components/Unit3D';
import { RotateCcw, Sparkles, Swords, Heart } from 'lucide-react';

const App = () => {
  const [gameState, setGameState] = useState<GameState>({
    turn: 1,
    energy: 1, // Start with 1 energy
    maxEnergy: 1, // Start with 1 max energy
    player: { ...INITIAL_PLAYER },
    allies: [],
    enemies: [],
    hand: [],
    deck: [],
    discard: [],
    battleLog: ["Entering the dungeon..."],
    commentary: "Prepare yourself.",
    isGameOver: false,
    victory: false
  });

  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const battleLogRef = useRef<HTMLDivElement>(null);

  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    initializeGame();
    
    const handleResize = () => {
        setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (battleLogRef.current) {
      battleLogRef.current.scrollTop = battleLogRef.current.scrollHeight;
    }
  }, [gameState.battleLog]);

  const generateEncounter = (): Unit[] => {
      const roll = Math.random();
      let encounterTier: 'NORMAL' | 'RARE' | 'ELITE' | 'BOSS';

      // Adjusted probabilities for varied gameplay
      if (roll < 0.4) encounterTier = 'NORMAL';
      else if (roll < 0.7) encounterTier = 'RARE';
      else if (roll < 0.9) encounterTier = 'ELITE';
      else encounterTier = 'BOSS';

      const enemies: Unit[] = [];
      
      const createUnit = (poolKey: EnemyTier, idSuffix: number): Unit => {
          const pool = ENEMY_POOLS[poolKey];
          const template = (!pool || pool.length === 0) 
            ? ENEMY_POOLS['NORMAL'][0] 
            : pool[Math.floor(Math.random() * pool.length)];
          
          return {
            id: `enemy-${poolKey.toLowerCase()}-${idSuffix}-${Date.now()}`,
            name: template.name,
            maxHp: template.maxHp,
            currentHp: template.maxHp,
            block: 0,
            image: template.image,
            isEnemy: true,
            speed: template.speed,
            tier: template.tier,
            status: [],
            burn: 0,
            stun: 0,
            weak: 0
          };
      };

      if (encounterTier === 'BOSS') {
          enemies.push(createUnit('BOSS', 1));
      } else {
          // Spawn 1 to 3 enemies for non-boss tiers
          const count = Math.floor(Math.random() * 3) + 1; 
          // If Elite/Rare, maybe spawn fewer to balance
          const adjustedCount = encounterTier === 'ELITE' ? Math.min(count, 2) : count;

          for (let i = 0; i < adjustedCount; i++) {
              // Mix tiers slightly? No, keep consistent for now
              enemies.push(createUnit(encounterTier, i + 1));
          }
      }
      return enemies;
  };

  const initializeGame = () => {
    const deckSource = [...BASE_DECK_TEMPLATES].map((c, i) => ({ ...c, id: `card-${i}-${Date.now()}` }));
    let shuffledDeck = deckSource.sort(() => Math.random() - 0.5);

    // --- RIGGED HAND LOGIC ---
    // Ensure player has 1-2 low cost cards (0 or 1 energy) in opening hand because max energy starts at 1.
    const lowCostCards = shuffledDeck.filter(c => c.cost <= 1);
    const highCostCards = shuffledDeck.filter(c => c.cost > 1);
    
    const guaranteedCount = Math.floor(Math.random() * 2) + 1; // 1 or 2 cards
    const hand: Card[] = [];
    
    // Take guaranteed cards
    for(let i=0; i<guaranteedCount; i++) {
        if(lowCostCards.length > 0) {
            hand.push(lowCostCards.pop()!);
        }
    }
    
    // Fill rest of hand (up to 5)
    const remainingPool = [...lowCostCards, ...highCostCards].sort(() => Math.random() - 0.5);
    while(hand.length < MAX_HAND_SIZE && remainingPool.length > 0) {
        hand.push(remainingPool.pop()!);
    }
    
    const deck = remainingPool;
    const generatedEnemies = generateEncounter();
    const bossName = generatedEnemies.find(e => e.tier === 'BOSS')?.name;
    const introText = bossName ? `BOSS WARNING: ${bossName} approaches!` : "Enemies sighted ahead.";

    setGameState({
      turn: 1,
      energy: 1, // Turn 1 = 1 Energy
      maxEnergy: 1,
      player: { ...INITIAL_PLAYER, currentHp: INITIAL_PLAYER.maxHp, block: 0 },
      allies: [],
      enemies: generatedEnemies,
      hand: hand,
      deck: deck,
      discard: [],
      battleLog: [introText],
      commentary: "The climb begins.",
      isGameOver: false,
      victory: false
    });
  };

  const log = (message: string) => {
    setGameState(prev => ({
      ...prev,
      battleLog: [...prev.battleLog, message]
    }));
  };

  // Helper to create a fresh card instance from templates
  const generateRandomCard = (): Card => {
      const template = BASE_DECK_TEMPLATES[Math.floor(Math.random() * BASE_DECK_TEMPLATES.length)];
      return {
          ...template,
          id: `gen-${Date.now()}-${Math.random().toString(36).substring(7)}`
      };
  };

  const drawCards = (count: number, currentDeck: Card[], currentDiscard: Card[], currentHand: Card[]) => {
      let deck = [...currentDeck];
      let discard = [...currentDiscard];
      let hand = [...currentHand];

      for(let i=0; i<count; i++) {
          if (hand.length >= MAX_HAND_SIZE) break;
          
          // If deck is empty, try to shuffle discard OR generate new cards
          if (deck.length === 0) {
              if (discard.length > 0) {
                  // Shuffle discard back into deck
                  // Regenerate IDs to ensure React sees them as new cards (visual refresh)
                  deck = discard
                    .sort(() => Math.random() - 0.5)
                    .map(c => ({...c, id: `${c.id.split('-reshuffle')[0]}-reshuffle-${Date.now()}-${Math.random().toString(36).substring(7)}`}));
                  discard = [];
                  log("Deck reshuffled.");
              } else {
                  // If both deck and discard are empty, GENERATE a new random card
                  // This ensures the player never runs out of cards and always gets a new one
                  const newCard = generateRandomCard();
                  deck.push(newCard);
              }
          }
          
          const cardToDraw = deck.shift();
          if (cardToDraw) {
              hand.push(cardToDraw);
          }
      }
      return { deck, discard, hand };
  };

  const handleCardClick = (card: Card) => {
    if (isProcessing || gameState.isGameOver) return;
    if (selectedCard?.id === card.id) {
        setSelectedCard(null);
        return;
    }
    if (gameState.energy < card.cost) {
      log(`Need ${card.cost} Energy!`);
      return;
    }
    if (card.targetType === TargetType.ENEMY || card.targetType === TargetType.SELF) {
      setSelectedCard(card);
    } else {
      playCard(card);
    }
  };

  const handleUnitClick = (unit: Unit) => {
    if (!selectedCard) return;
    const isEnemyTarget = selectedCard.targetType === TargetType.ENEMY;
    const isFriendlyTarget = selectedCard.targetType === TargetType.SELF;

    if (isEnemyTarget && unit.isEnemy) {
        playCard(selectedCard, unit);
        setSelectedCard(null);
    } else if (isFriendlyTarget && !unit.isEnemy) {
        playCard(selectedCard, unit);
        setSelectedCard(null);
    }
  };

  const playCard = (card: Card, target?: Unit) => {
    setIsProcessing(true);
    log(`> Played ${card.name}`);

    setGameState(prev => {
        let player = { ...prev.player };
        let enemies = prev.enemies.map(e => ({...e}));
        let allies = prev.allies.map(a => ({...a}));
        
        const applyToUnit = (u: Unit, effect: CardEffect) => {
            if (effect.type === EffectType.DAMAGE) {
                let dmg = effect.value;
                if (u.weak > 0) dmg = Math.floor(dmg * 0.75);
                const blocked = Math.min(u.block, dmg);
                u.block -= blocked;
                u.currentHp -= (dmg - blocked);
            } else if (effect.type === EffectType.HEAL) {
                u.currentHp = Math.min(u.maxHp, u.currentHp + effect.value);
            } else if (effect.type === EffectType.BLOCK) {
                u.block += effect.value;
            } else if (effect.type === EffectType.BURN) {
                u.burn += effect.value;
            } else if (effect.type === EffectType.WEAK) {
                u.weak += effect.value;
            } else if (effect.type === EffectType.STUN) {
                u.stun += effect.value;
            }
        };

        card.effects.forEach(eff => {
            if (target && (card.targetType === TargetType.ENEMY || card.targetType === TargetType.SELF)) {
                if (target.id === player.id) applyToUnit(player, eff);
                else {
                    const eIdx = enemies.findIndex(e => e.id === target.id);
                    if (eIdx >= 0) applyToUnit(enemies[eIdx], eff);
                    const aIdx = allies.findIndex(a => a.id === target.id);
                    if (aIdx >= 0) applyToUnit(allies[aIdx], eff);
                }
            } else if (card.targetType === TargetType.ALL_ENEMIES) {
                enemies.forEach(e => applyToUnit(e, eff));
            } else if (card.targetType === TargetType.NONE || (!target && card.targetType === TargetType.SELF)) {
                if (eff.type === EffectType.DRAW) {
                    // Handled in draw logic below
                } else if (eff.type === EffectType.ENERGY) {
                    // Handled in energy logic below
                } else if (eff.type === EffectType.SUMMON) {
                     if (eff.meta && NPC_TEMPLATES[eff.meta]) {
                        const tpl = NPC_TEMPLATES[eff.meta]!;
                        allies.push({
                            ...INITIAL_PLAYER,
                            id: `ally-${Date.now()}`,
                            name: eff.meta,
                            maxHp: tpl.maxHp || 10,
                            currentHp: tpl.maxHp || 10,
                            image: tpl.image || '',
                            isEnemy: false,
                            speed: 5
                        });
                        log(`Summoned ${eff.meta}!`);
                     }
                } else {
                    applyToUnit(player, eff);
                }
            }
        });

        const aliveEnemies = enemies.filter(e => e.currentHp > 0);
        if (aliveEnemies.length < enemies.length) log("Target eliminated.");
        const victory = aliveEnemies.length === 0;

        // --- CARD REPLENISH LOGIC ---
        // 1. Remove played card from current hand
        let currentHand = prev.hand.filter(c => c.id !== card.id);
        // 2. Add played card to discard pile
        let currentDiscard = [...prev.discard, card];
        let currentDeck = [...prev.deck];

        // 3. Determine how many cards to draw:
        //    - Always draw 1 to replenish the card just played.
        //    - Plus any cards specified by the Card Effect (e.g. "Draw 2").
        let drawCount = 1; 
        const drawEffect = card.effects.find(e => e.type === EffectType.DRAW);
        if (drawEffect) {
            drawCount += drawEffect.value;
        }

        // 4. Execute the draw
        const res = drawCards(drawCount, currentDeck, currentDiscard, currentHand);
        
        let hand = res.hand;
        let deck = res.deck;
        let discard = res.discard;

        // FAILSAFE: Ensure hand is replenished to MAX_HAND_SIZE - 1 + drawCount (usually just MAX_HAND_SIZE)
        // Actually, we just want to ensure we didn't lose cards due to deck running out logic failure.
        // If we are below max hand size and deck/discard were empty, we force generation.
        while (hand.length < MAX_HAND_SIZE && hand.length < (prev.hand.length - 1 + drawCount)) {
             hand.push(generateRandomCard());
        }
        // Also if we played 1, we expect at least 1 back.
        if (hand.length < currentHand.length + 1) {
             hand.push(generateRandomCard());
        }

        // 5. Handle Energy Costs
        let energy = prev.energy - card.cost;
        const energyEffect = card.effects.find(e => e.type === EffectType.ENERGY);
        if (energyEffect) energy += energyEffect.value;

        // Only trigger commentary rarely (5% chance) or if it's a win, to save API quota
        if (Math.random() > 0.95 && !victory) { 
            getBattleCommentary(prev.battleLog, player.currentHp, aliveEnemies.length)
                .then(c => setGameState(s => ({...s, commentary: c})));
        }

        return {
            ...prev,
            player,
            enemies: aliveEnemies,
            allies,
            hand,
            deck,
            discard,
            energy,
            victory,
            isGameOver: victory
        };
    });
    
    setTimeout(() => setIsProcessing(false), 400);
  };

  const endTurn = () => {
      setIsProcessing(true);
      setSelectedCard(null);
      log("--- Enemy Phase ---");

      setTimeout(() => {
          setGameState(prev => {
              let player = { ...prev.player };
              let enemies = prev.enemies.map(e => ({...e}));
              let allies = prev.allies.map(a => ({...a}));

              enemies.forEach(e => {
                  if (e.burn > 0) {
                      e.currentHp -= e.burn;
                      e.burn = Math.max(0, e.burn - 1); 
                  }
                  if (e.currentHp <= 0) return;
                  if (e.stun > 0) {
                      e.stun--;
                      log(`${e.name} is frozen.`);
                      return;
                  }
                  if (e.weak > 0) e.weak--;

                  // Bosses hit harder
                  const baseDmg = e.tier === 'BOSS' ? 35 : (e.tier === 'ELITE' ? 20 : 12);
                  const dmg = Math.floor(baseDmg + Math.random() * 5);
                  const target = allies.length > 0 && Math.random() > 0.5 ? allies[0] : player;
                  
                  const blocked = Math.min(target.block, dmg);
                  target.block -= blocked;
                  target.currentHp -= (dmg - blocked);
                  log(`${e.name} hits ${target.name} for ${dmg - blocked}.`);
              });

              enemies = enemies.filter(e => e.currentHp > 0);
              allies = allies.filter(a => a.currentHp > 0);
              
              player.block = 0;
              enemies.forEach(e => e.block = 0);
              allies.forEach(a => a.block = 0); // Allies lose block too

              if (player.currentHp <= 0) {
                  return { ...prev, player, enemies, allies, isGameOver: true, commentary: "Game Over." };
              }

              // Start next turn logic
              // NEW: Retain existing hand and refill to MAX_HAND_SIZE
              const cardsToDraw = Math.max(0, MAX_HAND_SIZE - prev.hand.length);
              const { deck, discard, hand } = drawCards(cardsToDraw, prev.deck, prev.discard, prev.hand);

              // INCREASE MAX ENERGY GRADUALLY TO 5
              const nextMaxEnergy = Math.min(MAX_ENERGY_CAP, prev.maxEnergy + 1);

              return {
                  ...prev,
                  turn: prev.turn + 1,
                  energy: nextMaxEnergy,
                  maxEnergy: nextMaxEnergy,
                  player, enemies, allies,
                  deck, discard, hand,
                  isGameOver: enemies.length === 0
              };
          });
          setIsProcessing(false);
      }, 1200);
  };

  const renderScene3D = () => {
    const SCENE_TILT = 15; 
    const BASE_WIDTH = 1300; 
    const BASE_HEIGHT = 900; 
    
    const scale = Math.min(windowSize.width / BASE_WIDTH, windowSize.height / BASE_HEIGHT);
    const safeScale = Math.max(0.4, Math.min(1.3, scale));

    return (
      <div className="absolute inset-0 bg-[#020202] overflow-hidden perspective-1000 flex items-center justify-center">
          <div 
            className="relative w-[1200px] h-[800px] preserve-3d transition-transform duration-75 ease-out"
            style={{ transform: `scale(${safeScale}) rotateX(${SCENE_TILT}deg)` }}
          >
              {/* FLOOR */}
              <div 
                className="absolute top-1/2 left-1/2 w-[200%] h-[200%] bg-zinc-950 origin-center"
                style={{
                    transform: 'translate(-50%, -50%) translateZ(-200px)',
                    backgroundImage: `
                        radial-gradient(circle at 50% 50%, rgba(40,40,50,0.4), transparent 60%),
                        linear-gradient(to bottom, rgba(0,0,0,1) 0%, transparent 10%, transparent 90%, rgba(0,0,0,1) 100%),
                        repeating-linear-gradient(0deg, #1a1a20 0px, #1a1a20 1px, transparent 1px, transparent 100px),
                        repeating-linear-gradient(90deg, #1a1a20 0px, #1a1a20 1px, transparent 1px, transparent 100px)
                    `,
                    backgroundSize: '100% 100%, 100% 100%, 100px 100px, 100px 100px',
                    boxShadow: 'inset 0 0 300px #000'
                }}
              />

              {/* BACK WALL */}
              <div 
                 className="absolute top-0 left-1/2 w-[150%] h-[800px]"
                 style={{
                     background: 'linear-gradient(to top, #000 0%, #111 100%)',
                     transform: 'translate(-50%, -100%) translateZ(-400px) rotateX(-10deg)',
                 }}
              />

              {/* CHARACTERS */}
              <div className="absolute inset-0 preserve-3d pointer-events-none">
                  {/* PLAYER */}
                  <Unit3D 
                    unit={gameState.player} 
                    sceneRotationX={SCENE_TILT}
                    isTargetable={selectedCard?.targetType === TargetType.SELF}
                    onClick={() => handleUnitClick(gameState.player)}
                    style={{ 
                        left: '15%', 
                        top: '55%', 
                        transform: 'translate(-50%, -50%) translateZ(80px)',
                        pointerEvents: 'auto'
                    }}
                  />

                  {/* ALLIES */}
                  {gameState.allies.map((ally, i) => (
                      <Unit3D 
                        key={ally.id} 
                        unit={ally}
                        sceneRotationX={SCENE_TILT}
                        isTargetable={selectedCard?.targetType === TargetType.SELF}
                        onClick={() => handleUnitClick(ally)}
                        style={{ 
                            left: `${25 + (i * 5)}%`, 
                            top: `${60 + (i * 5)}%`, 
                            transform: 'translate(-50%, -50%) translateZ(100px)',
                            pointerEvents: 'auto' 
                        }}
                      />
                  ))}

                  {/* ENEMIES */}
                  {gameState.enemies.map((enemy, i) => {
                      const xPos = 65 + (i * 14);
                      const zPos = i * 40; 
                      
                      return (
                        <Unit3D 
                            key={enemy.id}
                            unit={enemy}
                            sceneRotationX={SCENE_TILT}
                            isTargetable={selectedCard?.targetType === TargetType.ENEMY}
                            onClick={() => handleUnitClick(enemy)}
                            style={{
                                left: `${xPos}%`,
                                top: '55%',
                                transform: `translate(-50%, -50%) translateZ(${zPos}px)`,
                                pointerEvents: 'auto'
                            }}
                        />
                      );
                  })}
              </div>

              {/* LIGHTING OVERLAY */}
              <div className="absolute inset-0 pointer-events-none mix-blend-soft-light bg-gradient-to-br from-blue-500/10 via-transparent to-red-500/10" />
          </div>
      </div>
    );
  };

  const handScale = Math.min(1, windowSize.width / 1000);

  return (
    <div 
        className="w-screen h-screen bg-black overflow-hidden font-sans select-none" 
        onContextMenu={(e) => {
            e.preventDefault();
            setSelectedCard(null);
        }}
    >
        {renderScene3D()}

        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between z-50">
            
            {/* TOP BAR */}
            <div className="p-4 flex justify-between items-start bg-gradient-to-b from-black/90 to-transparent h-28">
                <div className="flex items-center gap-4 pointer-events-auto">
                    <div className="relative w-16 h-16 rounded-full bg-slate-800 border-[3px] border-slate-500 flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.8)] overflow-hidden">
                         <img src={gameState.player.image} className="w-full h-full object-cover opacity-80" />
                         <Heart className="absolute text-red-500 drop-shadow-lg" size={28} fill="currentColor" />
                    </div>
                    <div className="bg-black/40 p-2 rounded-lg backdrop-blur-sm border border-white/5">
                        <div className="text-2xl font-black text-white drop-shadow-md tracking-wide">{gameState.player.name}</div>
                        <div className="text-md text-red-400 font-mono font-bold">{gameState.player.currentHp} <span className="text-gray-500">/</span> {gameState.player.maxHp} HP</div>
                    </div>
                </div>
                
                <div className="text-right opacity-90 bg-black/40 p-2 rounded-lg backdrop-blur-sm border border-white/5">
                   <div className="text-xs text-amber-500 font-bold uppercase tracking-widest mb-1">Dungeon Depth</div>
                   <div className="text-xl text-white font-black">Turn {gameState.turn}</div>
                </div>
            </div>

            {/* GAME OVER OVERLAY */}
            {gameState.isGameOver && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/90 backdrop-blur-sm pointer-events-auto z-[100] animate-in fade-in duration-1000">
                    <div className="text-center transform scale-125">
                        <h1 className={`text-8xl font-black mb-4 tracking-tighter ${gameState.victory ? 'text-yellow-500 drop-shadow-[0_0_30px_rgba(234,179,8,0.5)]' : 'text-red-700 drop-shadow-[0_0_30px_rgba(185,28,28,0.5)]'}`}>
                            {gameState.victory ? 'VICTORY' : 'SLAIN'}
                        </h1>
                        <p className="text-xl text-gray-300 italic mb-8 max-w-lg mx-auto">"{gameState.commentary}"</p>
                        <button 
                            onClick={initializeGame}
                            className="px-10 py-4 bg-white text-black font-black text-xl rounded hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.3)]"
                        >
                            TRY AGAIN
                        </button>
                    </div>
                </div>
            )}

            {/* BOTTOM BAR */}
            <div className="relative h-[340px] w-full flex justify-center items-end pb-4 pointer-events-none">
                
                {/* Commentary */}
                <div className="absolute bottom-10 left-10 w-72 pointer-events-auto hidden lg:block">
                     <div className="bg-slate-900/80 border-l-[6px] border-purple-600 p-4 rounded-r-lg backdrop-blur-md shadow-2xl">
                         <div className="flex items-center gap-2 text-purple-400 text-xs font-black uppercase mb-2 tracking-widest">
                             <Sparkles size={14} /> Dungeon Master
                         </div>
                         <p className="text-sm text-gray-200 italic leading-relaxed">{gameState.commentary}</p>
                     </div>
                </div>

                {/* Hand */}
                <div 
                    className="relative w-[1000px] h-[300px] flex justify-center items-end pointer-events-auto perspective-1000 z-40 transition-transform origin-bottom"
                    style={{ transform: `scale(${handScale})` }}
                >
                    {gameState.hand.map((card, i) => (
                        <Card3D 
                            key={card.id} 
                            card={card} 
                            index={i} 
                            totalCards={gameState.hand.length}
                            onPlay={handleCardClick}
                            canPlay={gameState.energy >= card.cost}
                            isSelected={selectedCard?.id === card.id}
                        />
                    ))}
                </div>

                {/* Controls */}
                <div className="absolute bottom-10 right-10 flex flex-col items-end gap-6 pointer-events-auto z-50">
                    {/* Energy Orbs */}
                    <div className="flex flex-col items-end">
                         <div className="text-[10px] text-amber-200 font-bold uppercase mb-2 tracking-[0.2em] text-right drop-shadow-md">Mana</div>
                         <div className="flex gap-2 p-3 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10">
                            {[...Array(MAX_ENERGY_CAP)].map((_, i) => {
                                const isUnlocked = i < gameState.maxEnergy;
                                const isFilled = i < gameState.energy;
                                return (
                                    <div 
                                        key={i} 
                                        className={`
                                            w-10 h-10 rounded-full border-2 shadow-inner transition-all duration-500 flex items-center justify-center
                                            ${!isUnlocked ? 'opacity-30 border-slate-700 bg-slate-900' : 
                                              isFilled ? 'bg-amber-500 border-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.8)] scale-100' : 'bg-slate-800 border-slate-600 scale-90'}
                                        `} 
                                    >
                                        {isFilled && <div className="w-full h-full rounded-full bg-gradient-to-tr from-transparent to-white/40" />}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <button 
                        onClick={endTurn}
                        disabled={isProcessing || gameState.isGameOver}
                        className="group relative px-10 py-4 bg-gradient-to-r from-amber-800 to-amber-700 hover:from-amber-700 hover:to-amber-600 disabled:from-slate-800 disabled:to-slate-900 text-amber-100 font-black text-lg rounded-xl shadow-2xl transition-all active:translate-y-1 overflow-hidden border border-amber-600/30"
                    >
                        <span className="relative z-10 flex items-center gap-3 uppercase tracking-widest">
                            End Turn <Swords size={20} />
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
                    </button>
                </div>
            </div>

            {/* Target Overlay */}
            {selectedCard && (
                <div className="absolute top-32 inset-x-0 text-center animate-pulse pointer-events-none z-50">
                    <span className="bg-red-600/80 text-white px-8 py-3 rounded-full border border-red-400/50 text-2xl font-black uppercase tracking-widest shadow-[0_0_30px_rgba(220,38,38,0.5)] backdrop-blur-sm">
                        SELECT TARGET
                    </span>
                </div>
            )}

            {/* Log */}
            <div className="absolute top-36 left-6 w-72 h-40 overflow-y-auto text-[11px] font-mono text-gray-400 pointer-events-auto bg-black/40 hover:bg-black/80 transition-colors rounded-lg p-3 scrollbar-thin border border-white/5 hidden xl:block shadow-xl" ref={battleLogRef}>
                 {gameState.battleLog.map((l, i) => <div key={i} className="mb-1.5 border-b border-white/5 pb-0.5 last:border-0">{l}</div>)}
            </div>
        </div>
    </div>
  );
};

export default App;
