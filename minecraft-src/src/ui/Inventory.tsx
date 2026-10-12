import { useEffect, useState } from 'react';
import type { Game, UIState } from '../game/engine';
import { PALETTE, RECIPES, getIcon, getName } from '../game/blocks';
import { ItemIcon } from './HUD';

export function Inventory({ ui, game }: { ui: UIState; game: Game }) {
  const [mouse, setMouse] = useState({ x: -100, y: -100 });
  const [hover, setHover] = useState<string | null>(null);
  useEffect(() => {
    const mv = (e: MouseEvent) => setMouse({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', mv);
    return () => window.removeEventListener('mousemove', mv);
  }, []);

  const Slot = ({ i }: { i: number }) => {
    const s = ui.inv[i];
    return (
      <div
        className="mc-slot w-[44px] h-[44px] flex items-center justify-center cursor-pointer"
        onMouseDown={(e) => { e.preventDefault(); game.clickSlot(i, e.button === 2); }}
        onMouseEnter={() => setHover(s ? getName(s.id) : null)}
        onMouseLeave={() => setHover(null)}
        onContextMenu={(e) => e.preventDefault()}
      >
        <ItemIcon slot={s} size={32} />
      </div>
    );
  };

  const count = (id: number) => ui.inv.reduce((a, s) => a + (s && s.id === id ? s.count : 0), 0);
  const canCraft = (r: (typeof RECIPES)[number]) => (!r.table || ui.atTable) && r.needs.every(([id, n]) => count(id) >= n);

  return (
    <div className="absolute inset-0 bg-black/60 flex items-center justify-center" onContextMenu={(e) => e.preventDefault()}>
      <div className="mc-panel p-4 flex gap-4 text-[#3f3f3f]" onMouseDown={(e) => e.stopPropagation()}>
        {ui.mode === 'creative' ? (
          <div className="flex flex-col">
            <div className="text-2xl mb-2">Creative Inventory</div>
            <div className="grid grid-cols-9 gap-[2px] mb-3">
              {PALETTE.map((id) => (
                <div key={id}
                  className="mc-slot w-[44px] h-[44px] flex items-center justify-center cursor-pointer"
                  onMouseDown={(e) => { e.preventDefault(); game.clickPalette(id); }}
                  onMouseEnter={() => setHover(getName(id))}
                  onMouseLeave={() => setHover(null)}>
                  <img src={getIcon(id)} width={32} height={32} className="pixel pointer-events-none" alt="" />
                </div>
              ))}
            </div>
            <div className="text-xl mb-1">Inventory</div>
            <div className="grid grid-cols-9 gap-[2px] mb-2">
              {Array.from({ length: 27 }, (_, k) => <Slot key={k} i={k + 9} />)}
            </div>
            <div className="flex items-end gap-3">
              <div className="grid grid-cols-9 gap-[2px]">
                {Array.from({ length: 9 }, (_, k) => <Slot key={k} i={k} />)}
              </div>
              <div className="mc-slot w-[44px] h-[44px] flex items-center justify-center cursor-pointer text-3xl text-red-800"
                title="Destroy item" onMouseDown={() => game.trashHeld()}>✕</div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col w-[330px]">
              <div className="text-2xl mb-2">{ui.atTable ? 'Crafting Table' : 'Crafting'}</div>
              {!ui.atTable && <div className="text-base -mt-2 mb-2 text-[#555]">Use a Crafting Table for more recipes</div>}
              <div className="flex flex-col gap-1 overflow-y-auto max-h-[420px] pr-1">
                {RECIPES.map((r, ri) => {
                  const ok = canCraft(r);
                  const locked = r.table && !ui.atTable;
                  return (
                    <div key={ri} className={`flex items-center gap-2 p-1 border-2 ${ok ? 'border-[#555] bg-[#b0b0b0]' : 'border-transparent bg-[#a8a8a8]/50'} ${locked ? 'opacity-40' : ''}`}>
                      <div className="flex gap-1 flex-1 flex-wrap">
                        {r.needs.map(([id, n]) => (
                          <div key={id} className="relative w-[34px] h-[34px] mc-slot flex items-center justify-center" title={getName(id)}>
                            <img src={getIcon(id)} width={24} height={24} className="pixel" alt="" />
                            <span className={`absolute bottom-0 right-0.5 text-lg leading-none mc-text ${count(id) >= n ? '' : '!text-red-400'}`}>{n}</span>
                          </div>
                        ))}
                      </div>
                      <span className="text-2xl">→</span>
                      <div className="relative w-[40px] h-[40px] mc-slot flex items-center justify-center" title={getName(r.out)}>
                        <ItemIcon slot={{ id: r.out, count: r.count }} size={28} />
                      </div>
                      <button className="mc-btn !text-lg !py-0 !px-2" disabled={!ok} onClick={() => game.craft(r)}>
                        {locked ? '🔒' : 'Craft'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex flex-col">
              <div className="text-2xl mb-2">Inventory</div>
              <div className="grid grid-cols-9 gap-[2px] mb-3">
                {Array.from({ length: 27 }, (_, k) => <Slot key={k} i={k + 9} />)}
              </div>
              <div className="grid grid-cols-9 gap-[2px]">
                {Array.from({ length: 9 }, (_, k) => <Slot key={k} i={k} />)}
              </div>
              <div className="mt-3 text-lg text-[#555] leading-5">
                Left click: pick up / place stack<br />Right click: split / place one<br />Right-click food in hand to eat
              </div>
            </div>
          </>
        )}
      </div>
      <div className="absolute top-4 left-1/2 -translate-x-1/2 mc-text text-xl">Press E or Esc to close</div>
      {ui.held && (
        <div className="fixed pointer-events-none relative" style={{ position: 'fixed', left: mouse.x - 18, top: mouse.y - 18, width: 36, height: 36 }}>
          <ItemIcon slot={ui.held} size={36} />
        </div>
      )}
      {hover && !ui.held && (
        <div className="fixed pointer-events-none bg-[#100010f0] border-2 border-[#2a0a5a] text-white text-xl px-2" style={{ left: mouse.x + 14, top: mouse.y - 30 }}>
          {hover}
        </div>
      )}
    </div>
  );
}
