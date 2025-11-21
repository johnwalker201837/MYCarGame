
import React from 'react';
import { Unit, EnemyTier } from '../types';
import { Shield } from 'lucide-react';

interface Unit3DProps {
  unit: Unit;
  isSelected?: boolean;
  isTargetable?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
  sceneRotationX?: number; 
}

const Unit3D: React.FC<Unit3DProps> = ({ unit, isSelected, isTargetable, onClick, style, sceneRotationX = 0 }) => {
  const hpPct = Math.max(0, Math.min(100, (unit.currentHp / unit.maxHp) * 100));
  
  // Revised scaling for larger boss HP pools and 3D feel
  const getSize = (tier?: EnemyTier) => {
      if (unit.id === 'player') return 200; 
      switch (tier) {
          case 'BOSS': return 350;
          case 'ELITE': return 280;
          case 'RARE': return 240;
          default: return 180; // Normal
      }
  };
  
  const size = getSize(unit.tier);
  const isDead = unit.currentHp <= 0;

  // Pseudo-3D Thickness using multiple layers
  // We stack identical images behind the main one with slight Z offsets
  const layers = [1, 2, 3, 4, 5];

  return (
    <div 
      className={`absolute transform-style-3d transition-all duration-500 ${isTargetable ? 'cursor-crosshair brightness-125' : ''} ${isDead ? 'opacity-0 scale-50 pointer-events-none' : 'opacity-100'}`}
      style={{ 
          ...style,
          width: `${size}px`, 
          height: `${size}px`,
          zIndex: Math.floor(style?.top ? parseInt(style.top as string) : 10),
      }}
      onClick={(e) => {
          e.stopPropagation();
          onClick && onClick();
      }}
    >
        {/* SHADOW BASE */}
        <div 
            className={`absolute left-1/2 top-[85%] -translate-x-1/2 w-[70%] h-[20%] bg-black/60 blur-md rounded-[100%] transition-all duration-300`}
            style={{
                transform: 'rotateX(0deg) translateZ(0.1px)',
                backgroundColor: isSelected ? 'rgba(255, 50, 50, 0.5)' : 'rgba(0,0,0,0.6)',
                boxShadow: isSelected ? '0 0 30px 10px rgba(255, 50, 50, 0.4)' : 'none'
            }}
        />

        {/* BILLBOARD CONTAINER */}
        <div 
            className="absolute bottom-[15%] left-0 w-full h-full origin-bottom transition-transform duration-300"
            style={{
                transform: `rotateX(${-sceneRotationX}deg)`, 
                transformStyle: 'preserve-3d'
            }}
        >
            {/* THICKNESS LAYERS (Fake 3D Volume) */}
            {layers.map(i => (
                 <div 
                    key={i}
                    className="absolute inset-0 pointer-events-none opacity-90 brightness-50"
                    style={{ transform: `translateZ(-${i}px)` }}
                 >
                    <img src={unit.image} className="w-full h-full object-contain" alt="" />
                 </div>
            ))}

            {/* MAIN SPRITE */}
            <div 
                className={`relative w-full h-full ${isSelected ? 'drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]' : ''}`}
                style={{ transform: 'translateZ(0px)' }}
            >
                <img 
                    src={unit.image} 
                    alt={unit.name}
                    className="w-full h-full object-contain drop-shadow-xl"
                />
                
                {isSelected && <div className="absolute inset-0 bg-white/10 mix-blend-overlay mask-image-sprite" />}
            </div>

            {/* UI OVERLAY */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-[160px] flex flex-col items-center z-20"
                 style={{ transform: 'translateZ(10px)' }} 
            >
                <div className="flex gap-1 mb-1 flex-wrap justify-center">
                    {unit.block > 0 && (
                        <div className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5 border border-blue-400 shadow-md">
                            <Shield size={10} className="fill-current" /> {unit.block}
                        </div>
                    )}
                    {unit.status.map((s, i) => (
                         <span key={i} className="bg-gray-800/80 text-yellow-400 text-[9px] px-1 rounded border border-yellow-600/50">{s}</span>
                    ))}
                    {unit.burn > 0 && <span className="bg-orange-600 text-white text-[9px] px-1 rounded">Burn {unit.burn}</span>}
                    {unit.weak > 0 && <span className="bg-green-600 text-white text-[9px] px-1 rounded">Weak {unit.weak}</span>}
                    {unit.stun > 0 && <span className="bg-cyan-600 text-white text-[9px] px-1 rounded">Frozen</span>}
                </div>

                {/* Health Bar */}
                <div className="w-full bg-slate-900/80 backdrop-blur-sm p-1.5 rounded-lg border border-white/10 shadow-xl">
                    <div className="flex justify-between text-[10px] text-gray-200 font-bold mb-1 px-0.5">
                        <span className="truncate max-w-[90px] shadow-black drop-shadow-md">{unit.name}</span>
                        <span>{unit.currentHp}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden relative border border-white/5">
                        <div 
                            className={`absolute left-0 top-0 h-full transition-all duration-300 ${unit.isEnemy ? 'bg-gradient-to-r from-red-600 to-red-400' : 'bg-gradient-to-r from-emerald-600 to-emerald-400'}`}
                            style={{ width: `${hpPct}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default Unit3D;
