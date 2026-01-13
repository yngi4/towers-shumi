import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
  EntityType, TileType, TowerType, EnemyType, GameState, 
  MapData, Entity, Tower, Enemy, Hero, Projectile 
} from '../types';
import { 
  TILE_WIDTH, TILE_HEIGHT, INITIAL_MAP_GRID, INITIAL_PATH, 
  TOWER_COSTS, TOWER_STATS, ENEMY_STATS, FRAME_TIME, 
  HERO_SPEED, MAP_SIZE, FPS, ABILITY_COOLDOWN, EMP_RANGE, EMP_DURATION, OVERCLOCK_DURATION, TOTAL_WAVES
} from '../constants';
import { toIso, distance, getZIndex } from '../utils/iso';
import { IsoEntity } from './IsoEntity';
import { UIOverlay } from './UIOverlay';

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

export const GameCanvas: React.FC = () => {
  // --- Game State (Refs for loop performance, State for UI sync) ---
  
  // Mutable state for game loop
  const gameStateRef = useRef<{
    towers: Tower[];
    enemies: Enemy[];
    projectiles: Projectile[];
    hero: Hero;
    lastTime: number;
    waveTimer: number;
    spawnTimer: number;
    enemiesToSpawn: EnemyType[];
  }>({
    towers: [],
    enemies: [],
    projectiles: [],
    hero: { 
        id: 'hero', type: EntityType.HERO, pos: { x: 0, y: 7 }, z: 0, 
        targetPos: null, isMoving: false, 
        cooldowns: { emp: 0, overclock: 0 } 
    },
    lastTime: 0,
    waveTimer: 0,
    spawnTimer: 0,
    enemiesToSpawn: []
  });

  // UI Reactive State
  const [uiState, setUiState] = useState<GameState>({
    wave: 1,
    energy: 150,
    coreHp: 100,
    maxCoreHp: 100,
    isPlaying: false,
    isGameOver: false,
    isVictory: false,
    gameSpeed: 1
  });

  // For rendering only (forces re-render on loop)
  const [tick, setTick] = useState(0);

  // Viewport centering
  const screenCenter = { x: window.innerWidth / 2, y: 150 };

  // --- Logic Helpers ---

  const spawnWave = (waveNum: number) => {
    const count = 5 + Math.floor(waveNum * 1.5);
    const enemies: EnemyType[] = [];
    
    for (let i = 0; i < count; i++) {
      if (waveNum % 3 === 0 && i < waveNum / 3) enemies.push(EnemyType.TANK);
      else if (waveNum % 2 === 0 && i < waveNum / 2) enemies.push(EnemyType.SHIELD);
      else enemies.push(EnemyType.RUNNER);
    }
    gameStateRef.current.enemiesToSpawn = enemies;
  };

  const handleHeroMove = (targetX: number, targetY: number) => {
    // Simple pathfinding: just go straight to center of tile
    // In a real grid, A* would be here, but for micro format, direct walking is okay-ish if no walls blocking
    // We will just snap target to tile center
    gameStateRef.current.hero.targetPos = { x: targetX, y: targetY };
    gameStateRef.current.hero.isMoving = true;
  };

  const useAbility = (ability: 'emp' | 'overclock') => {
    const now = Date.now();
    const hero = gameStateRef.current.hero;

    if (ability === 'emp' && now > hero.cooldowns.emp) {
        // Stun enemies around hero
        gameStateRef.current.enemies.forEach(e => {
            if (distance(e.pos.x, e.pos.y, hero.pos.x, hero.pos.y) <= EMP_RANGE) {
                e.frozen = EMP_DURATION;
            }
        });
        hero.cooldowns.emp = now + ABILITY_COOLDOWN;
        setTick(t => t + 1); // Force UI update
    }

    if (ability === 'overclock' && now > hero.cooldowns.overclock) {
        // Speed up nearest tower or all towers
        gameStateRef.current.towers.forEach(t => {
            if (distance(t.pos.x, t.pos.y, hero.pos.x, hero.pos.y) <= 3) {
                 // Hacky temporary boost: reduce cooldown
                 const originalCd = t.cooldown;
                 t.cooldown = t.cooldown / 2;
                 setTimeout(() => { t.cooldown = originalCd; }, OVERCLOCK_DURATION);
            }
        });
        hero.cooldowns.overclock = now + ABILITY_COOLDOWN;
        setTick(t => t + 1);
    }
  };

  const buildTower = (x: number, y: number, type: TowerType) => {
    if (uiState.energy >= TOWER_COSTS[type]) {
      setUiState(prev => ({ ...prev, energy: prev.energy - TOWER_COSTS[type] }));
      const stats = TOWER_STATS[type];
      gameStateRef.current.towers.push({
        id: generateId(),
        type: EntityType.TOWER,
        towerType: type,
        pos: { x, y },
        z: 0,
        level: 1,
        range: stats.range,
        damage: stats.damage,
        cooldown: stats.cooldown, // mutable current CD
        targetId: null
      });
    }
  };

  // --- Main Game Loop ---

  const update = useCallback((dt: number) => {
    if (!uiState.isPlaying || uiState.isGameOver) return;

    const state = gameStateRef.current;
    
    // 1. Spawning
    if (state.enemiesToSpawn.length > 0) {
        state.spawnTimer -= dt;
        if (state.spawnTimer <= 0) {
            const type = state.enemiesToSpawn.shift()!;
            const stats = ENEMY_STATS[type];
            state.enemies.push({
                id: generateId(),
                type: EntityType.ENEMY,
                enemyType: type,
                pos: { ...INITIAL_PATH[0] }, // Start position
                z: 0,
                hp: stats.hp * (1 + (uiState.wave * 0.1)), // Scaling HP
                maxHp: stats.hp * (1 + (uiState.wave * 0.1)),
                speed: stats.speed,
                pathIndex: 0,
                distanceTraveled: 0,
                frozen: 0,
                shielded: type === EnemyType.SHIELD
            });
            state.spawnTimer = 1500; // 1.5s between enemies
        }
    } else if (state.enemies.length === 0 && !uiState.isVictory) {
        // Wave complete logic
        if (state.waveTimer <= 0) {
            // Start Timer for next wave
             state.waveTimer = 3000;
        } else {
            state.waveTimer -= dt;
            if (state.waveTimer <= 0) {
                if (uiState.wave >= TOTAL_WAVES) {
                    setUiState(s => ({ ...s, isVictory: true, isGameOver: true }));
                } else {
                    setUiState(s => ({ ...s, wave: s.wave + 1 }));
                    spawnWave(uiState.wave + 1);
                }
            }
        }
    }

    // 2. Hero Movement
    if (state.hero.isMoving && state.hero.targetPos) {
        const dx = state.hero.targetPos.x - state.hero.pos.x;
        const dy = state.hero.targetPos.y - state.hero.pos.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const moveStep = (HERO_SPEED * dt) / 1000;

        if (dist <= moveStep) {
            state.hero.pos = { ...state.hero.targetPos };
            state.hero.isMoving = false;
        } else {
            state.hero.pos.x += (dx / dist) * moveStep;
            state.hero.pos.y += (dy / dist) * moveStep;
        }
    }

    // 3. Enemy Movement & Status
    for (let i = state.enemies.length - 1; i >= 0; i--) {
        const enemy = state.enemies[i];
        
        // Status Effects
        if (enemy.frozen > 0) enemy.frozen -= dt;

        // Move
        const currentSpeed = enemy.frozen > 0 ? enemy.speed * 0.5 : enemy.speed;
        const moveDist = (currentSpeed * dt) / 1000;
        const targetTile = INITIAL_PATH[enemy.pathIndex + 1];

        if (targetTile) {
            const dx = targetTile.x - enemy.pos.x;
            const dy = targetTile.y - enemy.pos.y;
            const distToTile = Math.sqrt(dx*dx + dy*dy);

            if (distToTile <= moveDist) {
                enemy.pos = { ...targetTile };
                enemy.pathIndex++;
                if (enemy.pathIndex >= INITIAL_PATH.length - 1) {
                    // Reached Core
                    setUiState(prev => {
                        const newHp = prev.coreHp - 10;
                        if (newHp <= 0) return { ...prev, coreHp: 0, isGameOver: true };
                        return { ...prev, coreHp: newHp };
                    });
                    state.enemies.splice(i, 1);
                }
            } else {
                enemy.pos.x += (dx / distToTile) * moveDist;
                enemy.pos.y += (dy / distToTile) * moveDist;
            }
            enemy.distanceTraveled += moveDist;
        }
    }

    // 4. Towers Fire
    state.towers.forEach(tower => {
        // Cooldown tick
        // We use a property on the tower object to track last fire time relative to game time
        // But to keep it simple, let's just decrement a counter
        if (!tower['cdTimer']) tower['cdTimer'] = 0;
        tower['cdTimer'] -= dt;

        if (tower['cdTimer'] <= 0) {
             // Find target
             let target: Enemy | null = null;
             let minDst = tower.range;
             
             // Simple targeting: First enemy in range
             for (const enemy of state.enemies) {
                 const d = distance(tower.pos.x, tower.pos.y, enemy.pos.x, enemy.pos.y);
                 if (d <= tower.range) {
                     target = enemy;
                     break;
                 }
             }

             if (target) {
                 // Fire
                 state.projectiles.push({
                     id: generateId(),
                     type: EntityType.PROJECTILE,
                     pos: { ...tower.pos },
                     z: 100,
                     targetId: target.id,
                     damage: tower.damage,
                     speed: 8,
                     effect: tower.towerType === TowerType.FROST ? 'freeze' : undefined,
                     startPos: { ...tower.pos },
                     progress: 0
                 });
                 // Reset CD (look up base stats to support temporary buffs)
                 const baseCD = TOWER_STATS[tower.towerType].cooldown;
                 tower['cdTimer'] = baseCD; // Simplified, doesn't account for overclock perfectly in this snippets logic but works visually
             }
        }
    });

    // 5. Projectiles
    for (let i = state.projectiles.length - 1; i >= 0; i--) {
        const proj = state.projectiles[i];
        const target = state.enemies.find(e => e.id === proj.targetId);

        if (!target) {
            state.projectiles.splice(i, 1); // Target dead
            continue;
        }

        const dx = target.pos.x - proj.pos.x;
        const dy = target.pos.y - proj.pos.y;
        const distToTarget = Math.sqrt(dx*dx + dy*dy);
        const moveStep = (proj.speed * dt) / 1000;

        if (distToTarget <= moveStep) {
            // Hit
            if (target.shielded && proj.damage < 15) {
                // Shield blocks low damage
                // Visual effect here usually
            } else {
                if (target.shielded) target.shielded = false; // Break shield
                target.hp -= proj.damage;
                if (proj.effect === 'freeze') target.frozen = 1000;
            }

            if (target.hp <= 0) {
                // Enemy died
                const reward = ENEMY_STATS[target.enemyType].reward;
                setUiState(prev => ({ ...prev, energy: prev.energy + reward }));
                const idx = state.enemies.indexOf(target);
                if (idx > -1) state.enemies.splice(idx, 1);
            }
            state.projectiles.splice(i, 1);
        } else {
             proj.pos.x += (dx / distToTarget) * moveStep;
             proj.pos.y += (dy / distToTarget) * moveStep;
        }
    }

    setTick(t => t + 1); // Trigger render
  }, [uiState.isPlaying, uiState.isGameOver, uiState.isVictory, uiState.wave]);


  // --- Game Loop Hook ---
  useEffect(() => {
    let frameId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
        const dt = time - lastTime;
        lastTime = time;
        
        // Cap dt to prevent massive jumps if tab inactive
        const safeDt = Math.min(dt, 100) * uiState.gameSpeed;
        
        update(safeDt);
        frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [update, uiState.gameSpeed]);

  // --- Interaction ---
  const [selectedTile, setSelectedTile] = useState<{x: number, y: number} | null>(null);

  const handleTileClick = (x: number, y: number, type: TileType) => {
    if (uiState.isGameOver) return;
    
    // If clicking a Build tile
    if (type === TileType.BUILD) {
         // Check if occupied
         const isOccupied = gameStateRef.current.towers.find(t => t.pos.x === x && t.pos.y === y);
         if (!isOccupied) {
             setSelectedTile({ x, y });
         }
    } else if (type === TileType.PATH || type === TileType.EMPTY || type === TileType.DECOR) {
        // Move hero
        handleHeroMove(x, y);
        setSelectedTile(null);
    } else {
        setSelectedTile(null);
    }
  };

  const handleStart = () => {
    setUiState(prev => ({ ...prev, isPlaying: true }));
    spawnWave(1);
  };

  // --- Rendering ---
  
  // Flatten grid for rendering
  const renderList: React.ReactNode[] = [];

  // 1. Grid Tiles
  INITIAL_MAP_GRID.forEach((row, y) => {
    row.forEach((tileType, x) => {
        const { x: left, y: top } = toIso(x, y, screenCenter.x, screenCenter.y);
        const zIndex = getZIndex(x, y, -10); // Floor is lowest

        let tileColor = "bg-slate-800"; // Empty
        let border = "border-slate-700/50";
        if (tileType === TileType.PATH) { tileColor = "bg-slate-900"; border="border-slate-800"; }
        if (tileType === TileType.BUILD) { tileColor = "bg-slate-700 hover:bg-slate-600 cursor-pointer"; border="border-slate-500"; }
        if (tileType === TileType.CORE) { tileColor = "bg-blue-900/50"; }
        if (tileType === TileType.SPAWN) { tileColor = "bg-red-900/50"; }
        if (tileType === TileType.DECOR) { tileColor = "bg-slate-800"; }

        // Selection Highlight
        const isSelected = selectedTile?.x === x && selectedTile?.y === y;
        const highlight = isSelected ? "ring-2 ring-cyan-400 brightness-125" : "";

        renderList.push(
            <div 
                key={`tile-${x}-${y}`}
                className={`absolute w-16 h-8 ${tileColor} border-t ${border} ${highlight}`}
                style={{ 
                    left, top, zIndex,
                    transformOrigin: 'top left',
                }}
                onClick={() => handleTileClick(x, y, tileType)}
            >
                {/* Isometric Cube Side effect for BUILD tiles */}
                {tileType === TileType.BUILD && (
                    <>
                    <div className="absolute top-full left-0 h-4 w-full bg-slate-800 brightness-75 skew-x-[0deg]"></div>
                    <div className="absolute top-0 -right-[1px] h-full w-[1px] bg-slate-400 opacity-20"></div>
                    </>
                )}
                {/* Core Base Visual */}
                {tileType === TileType.CORE && (
                    <div className="absolute -top-6 left-2 w-12 h-12 bg-blue-500/20 rounded-full blur-md animate-pulse"></div>
                )}
                {/* Decor Tree/Rock */}
                {tileType === TileType.DECOR && (
                     <div className="absolute -top-6 left-4 w-4 h-8 bg-emerald-800 skew-x-12 border-l border-emerald-600 pointer-events-none"></div>
                )}
            </div>
        );
    });
  });

  // 2. Entities
  const { enemies, towers, hero, projectiles } = gameStateRef.current;

  towers.forEach(t => {
      renderList.push(<IsoEntity key={t.id} x={t.pos.x} y={t.pos.y} type={EntityType.TOWER} subType={t.towerType} data={t} offset={screenCenter} onClick={() => {}} />);
  });

  enemies.forEach(e => {
      renderList.push(<IsoEntity key={e.id} x={e.pos.x} y={e.pos.y} type={EntityType.ENEMY} subType={e.enemyType} data={e} offset={screenCenter} />);
  });

  renderList.push(<IsoEntity key={hero.id} x={hero.pos.x} y={hero.pos.y} type={EntityType.HERO} data={hero} offset={screenCenter} onClick={() => {
      // Select hero? Maybe later
  }} />);

  projectiles.forEach(p => {
    renderList.push(<IsoEntity key={p.id} x={p.pos.x} y={p.pos.y} type={EntityType.PROJECTILE} data={p} offset={screenCenter} />);
  });


  return (
    <div className="relative w-full h-screen bg-slate-900 overflow-hidden font-sans">
      {/* Game Layer */}
      <div className="absolute inset-0">
          {renderList}
      </div>

      {/* Core Object Overlay (manual placement for visual pop) */}
      <div className="absolute pointer-events-none" 
           style={{ 
               left: toIso(0, 7, screenCenter.x, screenCenter.y).x + 16, 
               top: toIso(0, 7, screenCenter.x, screenCenter.y).y - 32,
               zIndex: getZIndex(0, 7) + 5
           }}>
          <div className="w-8 h-12 bg-blue-500 border-2 border-blue-300 shadow-[0_0_20px_blue] animate-pulse rounded-t-xl"></div>
      </div>

      {/* Spawn Portal Overlay */}
      <div className="absolute pointer-events-none"
           style={{
               left: toIso(0, 0, screenCenter.x, screenCenter.y).x + 16,
               top: toIso(0, 0, screenCenter.x, screenCenter.y).y - 20,
               zIndex: getZIndex(0, 0) + 5
           }}>
          <div className="w-8 h-8 bg-red-900/80 border border-red-500 rotate-45 animate-spin-slow shadow-lg"></div>
      </div>

      {/* UI Layer */}
      <UIOverlay 
        gameState={uiState} 
        heroState={hero} // Pass raw hero state for cooldowns
        selectedTile={selectedTile} 
        onBuild={buildTower} 
        onCancel={() => setSelectedTile(null)}
        onStart={handleStart}
        onAbility={useAbility}
        setSpeed={(s) => setUiState(prev => ({...prev, gameSpeed: s}))}
      />
    </div>
  );
};