import React from 'react';
import { toIso, getZIndex } from '../utils/iso';
import { EntityType, TowerType, EnemyType } from '../types';

interface IsoEntityProps {
  x: number;
  y: number;
  type: EntityType;
  subType?: string;
  data?: any;
  onClick?: () => void;
  offset?: { x: number; y: number };
}

export const IsoEntity: React.FC<IsoEntityProps> = ({ x, y, type, subType, data, onClick, offset }) => {
  const { x: left, y: top } = toIso(x, y, offset?.x || 0, offset?.y || 0);
  const zIndex = getZIndex(x, y, type === EntityType.PROJECTILE ? 100 : 10); // Projectiles fly high

  let content = null;
  let baseClass = "absolute transition-transform duration-100 ease-linear pointer-events-none";
  // Size of the entity visual
  const size = 32; 

  switch (type) {
    case EntityType.TOWER:
      const isPulse = subType === TowerType.PULSE;
      const isArc = subType === TowerType.ARC;
      const isFrost = subType === TowerType.FROST;
      
      content = (
        <div className="relative w-16 h-16 -mt-8 -ml-8 flex justify-center items-center pointer-events-auto" onClick={onClick}>
          {/* Base */}
          <div className="absolute bottom-2 w-10 h-6 bg-slate-700 rounded-full border-2 border-slate-600 transform scale-y-50 shadow-xl"></div>
          {/* Body */}
          <div className={`absolute bottom-4 w-6 h-8 border-2 ${isPulse ? 'bg-cyan-600 border-cyan-400' : isArc ? 'bg-amber-600 border-amber-400' : 'bg-indigo-600 border-indigo-400'} rounded-t-lg flex flex-col items-center justify-start`}>
             <div className={`w-2 h-2 mt-1 rounded-full ${isPulse ? 'bg-cyan-200' : isArc ? 'bg-amber-200' : 'bg-indigo-200'} animate-pulse`}></div>
          </div>
          {/* Level Indicator */}
          {data?.level > 1 && <div className="absolute top-0 right-4 text-[10px] font-bold text-white bg-black/50 px-1 rounded">v{data.level}</div>}
        </div>
      );
      break;

    case EntityType.HERO:
      const isMoving = data?.isMoving;
      content = (
        <div className={`relative w-16 h-16 -mt-10 -ml-8 pointer-events-auto flex flex-col items-center`} onClick={onClick}>
           {/* Shadow */}
           <div className="absolute bottom-2 w-8 h-4 bg-black/40 rounded-full blur-[2px] transform scale-y-50"></div>
           {/* Robot Body */}
           <div className={`w-8 h-9 bg-emerald-500 border-2 border-emerald-300 rounded-md shadow-lg flex flex-col items-center transition-all ${isMoving ? 'animate-bounce' : ''}`}>
             <div className="w-6 h-3 bg-emerald-800 mt-1 rounded-sm flex justify-center gap-1">
                <div className="w-1 h-1 bg-emerald-100 rounded-full animate-ping"></div>
                <div className="w-1 h-1 bg-emerald-100 rounded-full"></div>
             </div>
           </div>
        </div>
      );
      break;

    case EntityType.ENEMY:
      const isRunner = subType === EnemyType.RUNNER;
      const isTank = subType === EnemyType.TANK;
      const isShield = subType === EnemyType.SHIELD;
      const hpPct = (data.hp / data.maxHp) * 100;
      const isFrozen = data.frozen > 0;

      content = (
        <div className="relative w-12 h-12 -mt-8 -ml-6 flex flex-col items-center justify-end">
          {/* HP Bar */}
          <div className="w-8 h-1 bg-gray-800 mb-1 rounded overflow-hidden">
            <div className="h-full bg-rose-500" style={{ width: `${hpPct}%` }}></div>
          </div>
          
          {/* Enemy Shape */}
          <div className={`
            ${isRunner ? 'w-4 h-4 rounded-full bg-rose-500 border border-white' : ''}
            ${isTank ? 'w-6 h-6 rounded-sm bg-rose-800 border-2 border-rose-600' : ''}
            ${isShield ? 'w-5 h-5 rounded-lg bg-orange-600 border border-orange-300' : ''}
            ${isFrozen ? 'brightness-150 saturate-50 shadow-[0_0_10px_cyan]' : 'shadow-lg'}
            transition-all
          `}>
             {isShield && data.shielded && <div className="absolute inset-[-4px] border-2 border-blue-400 rounded-full opacity-60 animate-pulse"></div>}
          </div>
        </div>
      );
      break;

    case EntityType.PROJECTILE:
        content = (
            <div className="w-2 h-2 bg-yellow-300 rounded-full shadow-[0_0_8px_yellow]"></div>
        );
        break;

    default:
      return null;
  }

  return (
    <div
      style={{
        left: left,
        top: top,
        zIndex: zIndex,
        transform: 'translate3d(0,0,0)' // Hardware accel hint
      }}
      className={baseClass}
    >
      {content}
    </div>
  );
};
