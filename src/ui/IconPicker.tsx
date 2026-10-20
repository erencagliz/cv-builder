import { useEffect, useRef, useState } from 'react';
import { GENERIC_ICONS, iconLabel, iconSvg } from '../render/iconSvg';

export function IconGlyph({ id, size = 16 }: { id: string; size?: number }) {
  const svg = iconSvg(id, 'currentColor');
  if (!svg) return <span className="icon-none" style={{ width: size, height: size }} aria-hidden />;
  return <span className="icon-glyph" style={{ width: size, height: size }} aria-hidden dangerouslySetInnerHTML={{ __html: svg }} />;
}

/** Bölüm başlığı ikonu seçici: küçük düğme + açılır ızgara */
export function IconPicker({ value, onChange, label, enabled }: { value: string; onChange: (id: string) => void; label: string; enabled: boolean }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);
  const list = GENERIC_ICONS.filter((id) => !q || iconLabel(id).toLocaleLowerCase('tr-TR').includes(q.toLocaleLowerCase('tr-TR')) || id.includes(q.toLowerCase()));
  return (
    <div className="icon-picker" ref={ref}>
      <button
        type="button"
        className={`icon-btn icon-pick${enabled && value !== 'none' ? ' on' : ''}`}
        aria-label={`${label}: değiştir`}
        title={enabled ? 'Başlık ikonunu değiştir' : 'Başlık ikonu ekle'}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <IconGlyph id={value === 'none' ? 'star' : value} />
      </button>
      {open && (
        <div className="icon-pop" role="dialog" aria-label={label}>
          <input className="input" autoFocus placeholder="İkon ara (ör. kitap, kod)" value={q} onChange={(e) => setQ(e.target.value)} aria-label="İkon ara" />
          <div className="icon-grid" role="listbox" aria-label="İkonlar">
            <button
              type="button"
              role="option"
              aria-selected={value === 'none'}
              className={`icon-cell none${value === 'none' ? ' on' : ''}`}
              title="İkon yok"
              onClick={() => {
                onChange('none');
                setOpen(false);
              }}
            >
              Yok
            </button>
            {list.map((id) => (
              <button
                key={id}
                type="button"
                role="option"
                aria-selected={value === id}
                title={iconLabel(id)}
                aria-label={iconLabel(id)}
                className={`icon-cell${value === id ? ' on' : ''}`}
                onClick={() => {
                  onChange(id);
                  setOpen(false);
                }}
              >
                <IconGlyph id={id} size={18} />
              </button>
            ))}
          </div>
          {!enabled && <p className="field-hint">Bir ikon seçtiğinde başlık ikonları tüm bölümlerde açılır. Tasarım sekmesinden kapatabilirsin.</p>}
        </div>
      )}
    </div>
  );
}
