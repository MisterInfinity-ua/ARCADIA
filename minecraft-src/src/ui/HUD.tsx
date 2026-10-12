import { useEffect, useState } from 'react';
import type { UIState } from '../game/engine';
import { getIcon, getName } from '../game/blocks';
import type { Slot } from '../game/storage';

export function ItemIcon({ slot, size = 32 }: { slot: Slot; size?: number }) {
  if (!slot) return null;
  return (
    <>
      <img src={getIcon(slot.id)} width={size} height={size} className="pixel pointer-events-none" draggable={false} alt="" />
      {slot.count > 1 && (
        <span className="absolute bottom-0 right-0.5 text-white text-xl leading-none mc-text pointer-events-none">{slot.count}</span>
      )}
    </>
  );
}

function Heart({ fill }: { fill: 0 | 1 | 2 }) {
  // pixel heart 9x9
  const px = [
    '.XX...XX.',
    'XRRX.XRRX',
    'XRWRXRRRX',
    'XRRRRRRRX',
    'XRRRRRRRX',
    '.XRRRRRX.',
    '..XRRRX..',
    '...XRX...',
    '....X....',
  ];
  return (
    <svg width={18} height={18} viewBox="0 0 9 9" shapeRendering="crispEdges">
      {px.map((row, y) =>
        row.split('').map((c, x) => {
          if (c === '.') return null;
          let color = '#000';
          if (c !== 'X') {
            const filled = fill === 2 || (fill === 1 && x < 5);
            color = filled ? (c === 'W' ? '#ffb3b3' : '#e01010') : '#3a0a0a';
          }
          return <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={color} />;
        })
      )}
    </svg>
  );
}

export function HUD({ ui }: { ui: UIState }) {
  const [hurt, setHurt] = useState(false);
  useEffect(() => {
    if (!ui.hurtAt) return;
    setHurt(true);
    const t = setTimeout(() => setHurt(false), 250);
    return () => clearTimeout(t);
  }, [ui.hurtAt]);

  const sel = ui.inv[ui.selected];
  const hearts = [];
  for (let i = 0; i < 10; i++) {
    const v = ui.health - i * 2;
    hearts.push(<Heart key={i} fill={v >= 2 ? 2 : v === 1 ? 1 : 0} />);
  }

  return (
    <div className="absolute inset-0 pointer-events-none">
      {ui.underwater && <div className="absolute inset-0 bg-blue-800/40" />}
      {hurt && <div className="absolute inset-0 bg-red-600/30" />}
      {ui.health <= 6 && ui.mode === 'survival' && (
        <div className="absolute inset-0" style={{ boxShadow: 'inset 0 0 120px rgba(200,0,0,0.5)' }} />
      )}

      {/* crosshair */}
      {!ui.invOpen && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 mix-blend-difference">
          <div className="absolute w-[20px] h-[2px] bg-white -left-[10px] -top-[1px]" />
          <div className="absolute w-[2px] h-[20px] bg-white -left-[1px] -top-[10px]" />
        </div>
      )}

      {ui.debug && (
        <pre className="absolute left-2 top-2 text-white text-lg leading-5 whitespace-pre" style={{ fontFamily: 'VT323, monospace' }}>
          {ui.debug.split('\n').map((l, i) => (
            <div key={i}><span className="bg-black/50 px-1">{l}</span></div>
          ))}
        </pre>
      )}
      {!ui.debug && (
        <div className="absolute left-2 top-2 text-white/70 text-lg mc-text">
          {ui.mode === 'creative' ? 'Creative' : 'Survival'}{ui.flying ? ' · Flying' : ''} · F3 debug · E inventory
        </div>
      )}

      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex flex-col items-center">
        {sel && (
          <div key={ui.selected + ':' + sel.id} className="fade-name mc-text text-2xl mb-1">{getName(sel.id)}</div>
        )}
        {ui.mode === 'survival' && <div className="flex self-start mb-1">{hearts}</div>}
        <div className="flex bg-black/40 border-2 border-black/80 p-[2px]">
          {ui.inv.slice(0, 9).map((s, i) => (
            <div key={i} className="relative w-[48px] h-[48px] flex items-center justify-center"
              style={{ boxShadow: i === ui.selected ? 'inset 0 0 0 3px #fff, 0 0 0 1px #000' : 'inset 0 0 0 2px #8b8b8b55' }}>
              <ItemIcon slot={s} size={34} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
