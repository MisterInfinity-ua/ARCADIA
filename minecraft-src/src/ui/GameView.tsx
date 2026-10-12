
function exitToArcadia() {
  if (typeof window !== "undefined") {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: "closeMC" }, "*");
      try { (window.parent as any).closeMC?.(); } catch(e){}
    } else {
      window.location.href = "../index.html";
    }
  }
}

import { useEffect, useRef, useState } from 'react';
import { Game } from '../game/engine';
import type { UIState } from '../game/engine';
import type { SaveData, Settings } from '../game/storage';
import { HUD } from './HUD';
import { Inventory } from './Inventory';

export function GameView({ save, settings, onQuit }: { save: SaveData; settings: Settings; onQuit: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const [ui, setUI] = useState<UIState | null>(null);

  useEffect(() => {
    const g = new Game(canvasRef.current!, save, settings, (s) => setUI(s));
    gameRef.current = g;
    return () => { g.dispose(); gameRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const game = gameRef.current;
  const quit = () => { game?.save(); onQuit(); };

  return (
    <div className="fixed inset-0">
      <canvas ref={canvasRef} className="block w-full h-full" />

      <button 
        onClick={() => { try { game?.save(); } catch(e){} exitToArcadia(); }}
        className="fixed top-3 right-3 z-50 px-3 py-1.5 bg-red-900/80 hover:bg-red-700 text-white font-mono text-xs border border-red-500 shadow-lg cursor-pointer flex items-center gap-1 transition-all"
        title="Exit to Arcadia Hub"
      >
        <span>✕</span> <span>EXIT TO HUB</span>
      </button>

      {ui && game && (
        <>
          {ui.loading < 1 ? (
            <div className="absolute inset-0 dirt-bg flex flex-col items-center justify-center gap-4">
              <div className="mc-text text-4xl">Generating world…</div>
              <div className="w-80 h-3 bg-[#555] border-2 border-black">
                <div className="h-full bg-[#80ff20]" style={{ width: `${ui.loading * 100}%` }} />
              </div>
              <div className="mc-text text-xl text-gray-300">Building terrain</div>
            </div>
          ) : (
            <>
              <HUD ui={ui} />
              {ui.invOpen && <Inventory ui={ui} game={game} />}
              {ui.paused && !ui.dead && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3">
                  <div className="mc-text text-4xl mb-4">Game Menu</div>
                  <button className="mc-btn w-96" onClick={() => game.resume()}>Back to Game</button>
                  <div className="flex gap-2 w-96">
                    <button className="mc-btn flex-1" onClick={() => game.setMode(ui.mode === 'creative' ? 'survival' : 'creative')}>
                      Mode: {ui.mode === 'creative' ? 'Creative' : 'Survival'}
                    </button>
                    <button className="mc-btn flex-1" onClick={() => game.setTime(Math.floor(ui.timeOfDay) + (((ui.timeOfDay % 1) + 1) % 1 < 0.5 ? 0.55 : 1.02))}>
                      {((ui.timeOfDay % 1) + 1) % 1 < 0.5 ? 'Set Night' : 'Set Day'}
                    </button>
                  </div>
                  <button className="mc-btn w-96" onClick={() => game.save()}>Save World</button>
                  <button className="mc-btn w-96" onClick={quit}>Save and Quit to Title</button>
                  <button className="mc-btn w-96 !bg-red-950/80 !text-red-200 border-red-500 hover:!bg-red-900/90" onClick={() => { game?.save(); exitToArcadia(); }}>Exit to Arcadia Hub</button>
                  <div className="mc-text text-lg text-gray-300 mt-4 text-center leading-6">
                    WASD move · Space jump (double-tap to fly in creative) · Shift sneak/descend · Double-tap W or Ctrl sprint<br />
                    Left click break/attack · Right click place/use/eat · Middle click pick block · 1-9 / scroll select · E inventory · Q drop · F3 debug
                  </div>
                </div>
              )}
              {ui.dead && (
                <div className="absolute inset-0 bg-red-900/60 flex flex-col items-center justify-center gap-3">
                  <div className="mc-text text-6xl mb-2">You Died!</div>
                  <div className="mc-text text-2xl mb-6">Steve {ui.deathMsg}</div>
                  <button className="mc-btn w-80" onClick={() => game.respawn()}>Respawn</button>
                  <button className="mc-btn w-80" onClick={quit}>Title Screen</button>
                </div>
              )}
              {!ui.paused && !ui.dead && !ui.invOpen && document.pointerLockElement !== canvasRef.current && (
                <div
                  className="absolute inset-0 flex items-center justify-center cursor-pointer"
                  onClick={() => game.lock()}
                >
                  <div className="mc-text text-3xl bg-black/50 px-6 py-3 border-2 border-black">Click to play</div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
