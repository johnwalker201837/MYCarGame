
import React, { useState, useEffect } from 'react';
import { Card, CardRarity, TargetType } from '../types';
import { Shield, Zap, UserPlus, Skull, Box, Flame, Snowflake, Flower } from 'lucide-react';

interface Card3DProps {
  card: Card;
  index: number;
  totalCards: number;
  onPlay: (card: Card) => void;
  canPlay: boolean;
  isSelected: boolean; 
}

const Card3D: React.FC<Card3DProps> = ({ card, index, totalCards, onPlay, canPlay, isSelected }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isCasting, setIsCasting] = useState(false);

  useEffect(() => {
      if (!isSelected) {
          // Force reset visual states when deselected
          setIsHovered(false);
          setIsCasting(false);
      }
  }, [isSelected]);

  const centerIndex = (totalCards - 1) / 2;
  const xOffset = isSelected ? 0 : (index - centerIndex) * 90; 
  const rotateDeg = isSelected ? 0 : (index - centerIndex) * 5; 
  const yOffset = isSelected ? -200 : Math.abs(index - centerIndex) * 12; 

  // --- Visual System: 7 Rarity Colors ---
  const getRarityStyles = (rarity: CardRarity) => {
    switch (rarity) {
        case 'MYTHIC': // GOLD
            return {
                border: 'border-yellow-300',
                shadow: 'shadow-[0_0_30px_rgba(253,224,71,0.6)]',
                glow: 'shadow-[0_0_50px_rgba(253,224,71,0.9)]',
                bg: 'bg-gradient-to-b from-yellow-800 to-yellow-950',
                text: 'text-yellow-100',
                icon: 'text-yellow-400',
                accent: 'bg-yellow-500'
            };
        case 'LEGENDARY': // ORANGE
            return {
                border: 'border-orange-500',
                shadow: 'shadow-[0_0_25px_rgba(249,115,22,0.5)]',
                glow: 'shadow-[0_0_45px_rgba(249,115,22,0.8)]',
                bg: 'bg-gradient-to-b from-orange-900 to-slate-950',
                text: 'text-orange-100',
                icon: 'text-orange-400',
                accent: 'bg-orange-600'
            };
        case 'EPIC': // PURPLE
            return {
                border: 'border-purple-500',
                shadow: 'shadow-[0_0_20px_rgba(168,85,247,0.5)]',
                glow: 'shadow-[0_0_40px_rgba(168,85,247,0.8)]',
                bg: 'bg-gradient-to-b from-purple-900 to-slate-950',
                text: 'text-purple-100',
                icon: 'text-purple-400',
                accent: 'bg-purple-600'
            };
        case 'RARE': // BLUE
            return {
                border: 'border-blue-500',
                shadow: 'shadow-[0_0_20px_rgba(59,130,246,0.5)]',
                glow: 'shadow-[0_0_40px_rgba(59,130,246,0.8)]',
                bg: 'bg-gradient-to-b from-blue-900 to-slate-950',
                text: 'text-blue-100',
                icon: 'text-blue-400',
                accent: 'bg-blue-600'
            };
        case 'UNCOMMON': // GREEN
            return {
                border: 'border-emerald-500',
                shadow: 'shadow-[0_0_15px_rgba(16,185,129,0.4)]',
                glow: 'shadow-[0_0_35px_rgba(16,185,129,0.7)]',
                bg: 'bg-gradient-to-b from-emerald-900 to-slate-950',
                text: 'text-emerald-100',
                icon: 'text-emerald-400',
                accent: 'bg-emerald-600'
            };
        case 'COMMON': // WHITE
            return {
                border: 'border-slate-300',
                shadow: 'shadow-[0_0_10px_rgba(226,232,240,0.4)]',
                glow: 'shadow-[0_0_30px_rgba(226,232,240,0.7)]',
                bg: 'bg-slate-800',
                text: 'text-white',
                icon: 'text-slate-200',
                accent: 'bg-slate-500'
            };
        case 'BASIC': // GRAY
        default:
            return {
                border: 'border-slate-600',
                shadow: 'shadow-[0_0_5px_rgba(100,116,139,0.3)]',
                glow: 'shadow-[0_0_20px_rgba(100,116,139,0.5)]',
                bg: 'bg-slate-900',
                text: 'text-gray-400',
                icon: 'text-gray-500',
                accent: 'bg-gray-700'
            };
    }
  };

  const styles = getRarityStyles(card.rarity);
  const shadowClass = isHovered || isSelected ? styles.glow : styles.shadow;

  const getEffectIcon = () => {
    const type = card.effects[0]?.type;
    switch (type) {
      case 'DAMAGE': return <Skull size={16} className="text-red-400" />;
      case 'BLOCK': return <Shield size={16} className="text-blue-400" />;
      case 'BURN': return <Flame size={16} className="text-orange-400" />;
      case 'STUN': return <Snowflake size={16} className="text-cyan-300" />;
      case 'WEAK': return <Flower size={16} className="text-green-300" />;
      case 'SUMMON': return <UserPlus size={16} className="text-purple-400" />;
      case 'DRAW': return <Box size={16} className="text-emerald-400" />;
      default: return <Zap size={16} className="text-gray-400" />;
    }
  };

  const handlePlayInternal = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canPlay || isCasting) return;

    const needsTarget = card.targetType === TargetType.ENEMY || card.targetType === TargetType.SELF;

    if (needsTarget) {
        onPlay(card);
    } else {
        setIsCasting(true);
        setTimeout(() => {
            onPlay(card);
        }, 400);
    }
  };

  return (
    <div
      className="absolute bottom-[-40px] left-1/2 -ml-[90px] w-[180px] h-[260px] origin-bottom perspective-500 transition-all duration-300 ease-out"
      style={{
        transform: isSelected 
            ? `translateY(-250px) scale(1.2) z-index(100)` 
            : `translateX(${xOffset}px) rotate(${rotateDeg}deg) translateY(${yOffset}px)`,
        zIndex: isHovered || isCasting || isSelected ? 100 : index,
        pointerEvents: isSelected ? 'none' : 'auto' 
      }}
    >
      {/* HITBOX */}
      <div
        className="absolute w-full z-50 left-0"
        style={{
            cursor: canPlay ? 'pointer' : 'default',
            ...(isHovered ? {
                height: '100%',
                top: 0,
                transform: `rotate(${-rotateDeg}deg) translateY(-140px) scale(1.1)`,
                transition: 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)',
            } : {
                height: '140px',
                top: '20px',
                transform: 'scale(0.85)',
                transition: 'transform 0.2s cubic-bezier(0.2, 0, 0, 1), height 0s, top 0s',
            })
        }}
        onMouseEnter={() => !isCasting && setIsHovered(true)}
        onMouseLeave={() => !isCasting && setIsHovered(false)}
        onClick={handlePlayInternal}
      />

      {/* VISUAL CONTAINER */}
      <div 
        className={`
            relative w-full h-full rounded-xl border-[4px] flex flex-col overflow-hidden pointer-events-none
            ${styles.border} ${styles.bg} ${shadowClass}
            ${!canPlay ? 'opacity-60 grayscale-[0.8]' : 'opacity-100'}
            ${isCasting ? 'animate-ping opacity-0' : ''}
        `}
        style={{
            transform: isCasting 
                ? `scale(1.5) translateY(-200px)` 
                : isHovered && !isSelected
                    ? `rotate(${-rotateDeg}deg) translateY(-140px) scale(1.1)` 
                    : `scale(0.85)`,
            transition: isCasting 
                ? 'all 0.4s ease-out' 
                : 'transform 0.2s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.2s ease',
            filter: isCasting ? 'brightness(200%) contrast(150%)' : 'none'
        }}
      >
        {(card.rarity === 'MYTHIC' || card.rarity === 'LEGENDARY') && (
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-50 animate-pulse pointer-events-none z-20" />
        )}

        {/* Cost & Name Header */}
        <div className="bg-black/60 backdrop-blur-sm p-2 flex justify-between items-center border-b border-white/10 absolute top-0 w-full z-10">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${styles.border} ${styles.accent} text-sm font-bold text-white shadow-lg -ml-1`}>
            {card.cost}
          </div>
          <span className={`text-[10px] font-black uppercase tracking-wider drop-shadow-md truncate flex-1 text-right ${styles.text}`}>
            {card.name}
          </span>
        </div>

        {/* Image */}
        <div className="relative h-full w-full bg-slate-900">
            <img src={card.image} alt={card.name} className="w-full h-full object-cover" />
            <div className={`absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/10 opacity-90`}></div>
        </div>

        {/* Description */}
        <div className="absolute bottom-0 w-full p-2 bg-slate-950/95 backdrop-blur-md border-t border-white/10 min-h-[80px] flex flex-col justify-between z-10">
            <p className="text-[10px] text-gray-200 leading-tight text-center font-serif">
              {card.description}
            </p>
            
            <div className="flex justify-center mt-1 items-center gap-2">
               {getEffectIcon()}
               <div className={`text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/5 border border-white/10 ${styles.icon}`}>
                 {card.rarity}
               </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Card3D;
