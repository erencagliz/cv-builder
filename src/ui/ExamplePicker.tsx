import { useEffect, useRef, useState } from 'react';
import { PROFESSIONS } from '../content/professions';
import { Icon } from './fields';

/** Meslek seçip hazır örnek maddelerden ekleme. [Köşeli parantezli] yerler kullanıcı tarafından doldurulur. */
export function ExamplePicker({ onPick }: { onPick: (text: string) => void }) {
  const [open, setOpen] = useState(false);
  const [prof, setProf] = useState(() => {
    try {
      return localStorage.getItem('example-prof') || PROFESSIONS[0].id;
    } catch {
      return PROFESSIONS[0].id;
    }
  });
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);
  const p = PROFESSIONS.find((x) => x.id === prof) ?? PROFESSIONS[0];
  return (
    <div className="example-picker" ref={ref}>
      <button type="button" className="btn ghost sm" onClick={() => setOpen(!open)} aria-expanded={open}>
        <Icon name="sparkle" /> Örnek maddeler
      </button>
      {open && (
        <div className="example-pop" role="dialog" aria-label="Örnek maddeler">
          <select
            className="input select"
            aria-label="Meslek"
            value={prof}
            onChange={(e) => {
              setProf(e.target.value);
              try {
                localStorage.setItem('example-prof', e.target.value);
              } catch {
                /* depolama kapalı olabilir */
              }
            }}
          >
            {PROFESSIONS.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </select>
          <p className="field-hint">Tıkla, eklensin. [Köşeli parantezli] yerleri kendi rakamlarınla değiştir.</p>
          <ul className="example-list">
            {p.bullets.map((b) => (
              <li key={b}>
                <button type="button" onClick={() => onPick(b)}>
                  <Icon name="plus" size={12} /> {b}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
