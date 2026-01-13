import React, { useEffect, useState } from 'react';
import { GameState, TowerType, Hero } from '../types';
import { TOWER_COSTS, ABILITY_COOLDOWN } from '../constants';

interface UIProps {
  gameState: GameState;
  heroState: Hero;
  selectedTile: { x: number; y: number } | null;
  onBuild: (x: number, y: number, type: TowerType) => void;
  onCancel: () => void;
  onStart: () => void;
  onAbility: (type: 'emp' | 'overclock') => void;
  setSpeed: (speed: number) => void;
}

export const UIOverlay: React.FC<UIProps> = ({ 
    gameState, heroState, selectedTile, onBuild, onCancel, onStart, onAbility, setSpeed 
}) => {
  const [now, setNow] = useState(Date.now());

  // Update cooldown visuals independently of game tick
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(timer);
  }, []);

  const getCdPct = (readyTime: number) => {
      if (readyTime <= now) return 0;
      return ((readyTime - now) / ABILITY_COOLDOWN) * 100;
  };

  const empPct = getCdPct(heroState.cooldowns.emp);
  const ocPct = getCdPct(heroState.cooldowns.overclock);

  // --- Screens ---

  if (!gameState.isPlaying && !gameState.isGameOver) {
      return (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 z-50 text-white p-6">
              <h1 className="text-4xl font-bold mb-2 tracking-tighter text-cyan-400">BOT DEFENSE</h1>
              <p className="text-slate-400 mb-8 text-center text-sm">Deploy towers. Move the bot.<br/>Protect the Core.</p>
              <button 
                onClick={onStart}
                className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-bold shadow-[0_0_15px_rgba(8,145,178,0.5)] transition-all active:scale-95"
              >
                  START MISSION
              </button>
          </div>
      );
  }

  if (gameState.isGameOver) {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-50 text-white p-6 backdrop-blur-sm">
            <h2 className={`text-5xl font-bold mb-4 ${gameState.isVictory ? 'text-emerald-400' : 'text-rose-500'}`}>
                {gameState.isVictory ? 'VICTORY' : 'DEFEAT'}
            </h2>
            <div className="text-xl mb-8">Wave Reached: {gameState.wave}</div>
            <button onClick={() => window.location.reload()} className="px-6 py-2 border border-white/20 rounded hover:bg-white/10">
                Retry
            </button>
        </div>
      );
  }

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 pb-8 safe-area-inset-bottom">
      
      {/* Top Bar */}
      <div className="flex justify-between items-start pointer-events-auto">
        <div className="bg-slate-800/80 backdrop-blur border border-slate-700 rounded-lg px-3 py-1 text-white text-xs font-mono shadow-lg">
           <div className="text-slate-400">WAVE</div>
           <div className="text-xl font-bold text-yellow-400">{gameState.wave}</div>
        </div>

        <div className="flex flex-col items-center gap-1">
             {/* Core HP */}
            <div className="w-32 h-3 bg-slate-900 rounded-full border border-slate-700 overflow-hidden relative">
                <div 
                    className={`h-full ${gameState.coreHp > 50 ? 'bg-blue-500' : 'bg-red-500'} transition-all duration-300`} 
                    style={{ width: `${(gameState.coreHp/gameState.maxCoreHp)*100}%`}}
                ></div>
            </div>
             {/* Energy */}
            <div className="flex items-center gap-1 bg-slate-800/90 rounded-full px-3 py-1 border border-slate-700">
                <div className="w-3 h-3 bg-yellow-400 rounded-full shadow-[0_0_5px_yellow]"></div>
                <span className="text-yellow-100 font-bold font-mono">{Math.floor(gameState.energy)}</span>
            </div>
        </div>

        <button 
            onClick={() => setSpeed(gameState.gameSpeed === 1 ? 2 : 1)}
            className="bg-slate-800/80 backdrop-blur border border-slate-700 rounded-lg w-10 h-10 flex items-center justify-center text-white font-bold"
        >
            {gameState.gameSpeed}x
        </button>
      </div>

      {/* Bottom Area */}
      <div className="flex items-end justify-between pointer-events-auto w-full max-w-md mx-auto relative">
        
        {/* Ability Buttons (Left/Right corner typically, but sticking to TZ layout) */}
        {/* TZ said: Right bottom for abilities. Left bottom for Cancel. Middle for Towers. */}

        {/* Selected Tile Context Menu (Floating above bottom bar if active) */}
        {selectedTile && (
             <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 flex gap-2 bg-slate-900/90 p-2 rounded-xl border border-slate-700 shadow-2xl z-20">
                 {/* Towers */}
                 {[TowerType.PULSE, TowerType.ARC, TowerType.FROST].map(type => {
                     const cost = TOWER_COSTS[type];
                     const canAfford = gameState.energy >= cost;
                     let color = "bg-slate-600";
                     if (type === TowerType.PULSE) color = "bg-cyan-600";
                     if (type === TowerType.ARC) color = "bg-amber-600";
                     if (type === TowerType.FROST) color = "bg-indigo-600";

                     return (
                         <button 
                            key={type}
                            disabled={!canAfford}
                            onClick={() => { onBuild(selectedTile.x, selectedTile.y, type); onCancel(); }}
                            className={`flex flex-col items-center p-2 rounded-lg w-16 transition-transform active:scale-95 ${canAfford ? 'opacity-100' : 'opacity-40 grayscale'}`}
                         >
                             <div className={`w-8 h-8 rounded mb-1 ${color} border border-white/20 shadow-inner`}></div>
                             <span className="text-[10px] text-white font-bold">{type}</span>
                             <span className="text-[10px] text-yellow-300">{cost}</span>
                         </button>
                     )
                 })}
                 <div className="w-[1px] bg-slate-700 mx-1"></div>
                 <button onClick={onCancel} className="text-rose-400 text-xs font-bold px-2">X</button>
             </div>
        )}

        {/* Hero Controls (Always visible if hero active) */}
        <div className="flex w-full justify-between items-end">
            {/* Cancel Button (Visible if selecting) */}
            <div className="w-16">
                 {selectedTile && (
                     <button onClick={onCancel} className="bg-rose-900/80 border border-rose-500 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg active:scale-90">
                         ✕
                     </button>
                 )}
            </div>

            {/* Hint Text */}
            {!selectedTile && (
                 <div className="mb-4 text-slate-500 text-xs text-center animate-pulse">
                     Tap tile to move / build
                 </div>
            )}

            {/* Skills */}
            <div className="flex gap-3">
                 {/* EMP */}
                 <div className="relative">
                    <button 
                        disabled={empPct > 0}
                        onClick={() => onAbility('emp')}
                        className={`w-14 h-14 rounded-full border-2 border-cyan-500 bg-cyan-900/80 flex items-center justify-center shadow-[0_0_10px_cyan] active:scale-90 transition-all ${empPct > 0 ? 'opacity-50' : 'opacity-100'}`}
                    >
                        <span className="text-xs font-bold text-cyan-100">EMP</span>
                    </button>
                    {empPct > 0 && (
                        <svg className="absolute inset-0 w-14 h-14 -rotate-90 pointer-events-none">
                            <circle cx="28" cy="28" r="26" stroke="black" strokeWidth="4" fill="none" opacity="0.5"/>
                            <circle cx="28" cy="28" r="26" stroke="cyan" strokeWidth="2" fill="none" strokeDasharray="163" strokeDashoffset={163 * (1 - empPct/100)} />
                        </svg>
                    )}
                 </div>

                 {/* Overclock */}
                 <div className="relative">
                    <button 
                        disabled={ocPct > 0}
                        onClick={() => onAbility('overclock')}
                        className={`w-14 h-14 rounded-full border-2 border-amber-500 bg-amber-900/80 flex items-center justify-center shadow-[0_0_10px_orange] active:scale-90 transition-all ${ocPct > 0 ? 'opacity-50' : 'opacity-100'}`}
                    >
                         <span className="text-xs font-bold text-amber-100">BST</span>
                    </button>
                     {ocPct > 0 && (
                        <svg className="absolute inset-0 w-14 h-14 -rotate-90 pointer-events-none">
                            <circle cx="28" cy="28" r="26" stroke="black" strokeWidth="4" fill="none" opacity="0.5"/>
                            <circle cx="28" cy="28" r="26" stroke="orange" strokeWidth="2" fill="none" strokeDasharray="163" strokeDashoffset={163 * (1 - ocPct/100)} />
                        </svg>
                    )}
                 </div>
            </div>
        </div>
      </div>
    </div>
  );
};
