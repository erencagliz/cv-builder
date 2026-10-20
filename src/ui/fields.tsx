import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import type { DateRange, Lang } from '../model/types';
import { STRONG_VERBS } from '../ats/writing';
import { scoreBullet } from '../ats/report';
import { ExamplePicker } from './ExamplePicker';
import { maskPhone, isCompletePhone } from '../model/links';

/* ---------------- temel alan ---------------- */
export function Field({
  label,
  hint,
  error,
  wide,
  children,
  htmlFor,
}: {
  label: string;
  hint?: ReactNode;
  error?: string;
  wide?: boolean;
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className={`field${wide ? ' wide' : ''}${error ? ' has-error' : ''}`}>
      <label className="field-label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {error ? <p className="field-error">{error}</p> : hint ? <p className="field-hint">{hint}</p> : null}
    </div>
  );
}

export function TextInput({
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  hint,
  error,
  wide,
  type = 'text',
  autoComplete,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  hint?: ReactNode;
  error?: string;
  wide?: boolean;
  type?: string;
  autoComplete?: string;
  inputMode?: 'text' | 'email' | 'tel' | 'url' | 'numeric' | 'decimal';
}) {
  const id = useId();
  return (
    <Field label={label} hint={hint} error={error} wide={wide} htmlFor={id}>
      <input
        id={id}
        className="input"
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete ?? 'off'}
        inputMode={inputMode}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        aria-invalid={!!error}
      />
    </Field>
  );
}

export function AutoTextarea({
  value,
  onChange,
  placeholder,
  id,
  minRows = 2,
  onKeyDown,
  className = 'input textarea',
  inputRef,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  id?: string;
  minRows?: number;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  className?: string;
  inputRef?: (el: HTMLTextAreaElement | null) => void;
}) {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight + 2}px`;
  }, [value]);
  return (
    <textarea
      id={id}
      ref={(el) => {
        ref.current = el;
        inputRef?.(el);
      }}
      className={className}
      rows={minRows}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
    />
  );
}

export function TextArea({
  label,
  value,
  onChange,
  placeholder,
  hint,
  wide = true,
  counter,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: ReactNode;
  wide?: boolean;
  counter?: { min: number; max: number };
}) {
  const id = useId();
  const len = value.trim().length;
  const counterEl = counter ? (
    <span className={`counter${len > counter.max ? ' warn' : len >= counter.min ? ' ok' : ''}`}>
      {len} karakter · önerilen {counter.min}–{counter.max}
    </span>
  ) : null;
  return (
    <Field
      label={label}
      wide={wide}
      htmlFor={id}
      hint={
        counterEl || hint ? (
          <>
            {hint}
            {hint && counterEl ? ' ' : null}
            {counterEl}
          </>
        ) : undefined
      }
    >
      <AutoTextarea id={id} value={value} onChange={onChange} placeholder={placeholder} minRows={3} />
    </Field>
  );
}

export function Select({
  label,
  value,
  onChange,
  options,
  hint,
  wide,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  hint?: ReactNode;
  wide?: boolean;
}) {
  const id = useId();
  return (
    <Field label={label} hint={hint} wide={wide} htmlFor={id}>
      <select id={id} className="input select" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function Checkbox({ label, checked, onChange, hint }: { label: ReactNode; checked: boolean; onChange: (v: boolean) => void; hint?: ReactNode }) {
  const id = useId();
  return (
    <div className="check">
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <label htmlFor={id}>
        {label}
        {hint ? <span className="check-hint">{hint}</span> : null}
      </label>
    </div>
  );
}

/* ---------------- telefon (maskeli) ---------------- */
export function PhoneInput({ label, value, onChange, hint }: { label: string; value: string; onChange: (v: string) => void; hint?: ReactNode }) {
  const id = useId();
  const [touched, setTouched] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const error = touched && value.trim() && !isCompletePhone(value) ? 'Numara eksik görünüyor. Örnek: +90 (542) 355 56 49' : undefined;
  return (
    <Field label={label} hint={hint} error={error} htmlFor={id}>
      <input
        id={id}
        ref={ref}
        className="input"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="+90 (5__) ___ __ __"
        value={value}
        aria-invalid={!!error}
        onFocus={() => {
          if (!value) onChange('+90 (');
        }}
        onBlur={() => {
          setTouched(true);
          if (/^\+90 \(?$/.test(value.trim())) onChange('');
        }}
        onKeyDown={(e) => {
          // Biçim karakterinin (parantez, boşluk) arkasından silerken bir rakamı da sil
          if (e.key !== 'Backspace') return;
          const el = e.currentTarget;
          const pos = el.selectionStart ?? 0;
          if (pos !== el.selectionEnd || pos === 0) return;
          const before = value.slice(0, pos);
          if (/[\d]$/.test(before)) return;
          const m = /\d(?=[^\d]*$)/.exec(before);
          if (!m || before.length <= 5) return;
          e.preventDefault();
          const idx = before.lastIndexOf(m[0]);
          onChange(maskPhone(value.slice(0, idx) + value.slice(pos)));
        }}
        onChange={(e) => {
          const raw = e.target.value;
          const atEnd = (e.target.selectionStart ?? raw.length) >= raw.length - 1;
          const next = maskPhone(raw);
          onChange(next);
          if (!atEnd) {
            // Ortada düzenlerken imleci rakam sayısına göre koru
            const digitsBefore = raw.slice(0, e.target.selectionStart ?? 0).replace(/\D/g, '').length;
            requestAnimationFrame(() => {
              const el = ref.current;
              if (!el) return;
              let seen = 0;
              let i = 0;
              for (; i < next.length && seen < digitsBefore; i++) if (/\d/.test(next[i])) seen++;
              el.setSelectionRange(i, i);
            });
          }
        }}
      />
    </Field>
  );
}

/* ---------------- ay / yıl ---------------- */
const MONTHS_TR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const thisYear = new Date().getFullYear();
const YEARS = Array.from({ length: 70 }, (_, i) => String(thisYear + 6 - i));

export function MonthPicker({
  value,
  onChange,
  disabled,
  idPrefix,
  ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  idPrefix?: string;
  ariaLabel: string;
}) {
  const m = /^(\d{4})(?:-(\d{2}))?$/.exec(value || '');
  const year = m?.[1] ?? '';
  const month = m?.[2] ?? '';
  const set = (y: string, mo: string) => onChange(y ? (mo ? `${y}-${mo}` : y) : '');
  return (
    <div className="month-picker">
      <select
        id={idPrefix ? `${idPrefix}-m` : undefined}
        className="input select"
        aria-label={`${ariaLabel} – ay`}
        value={month}
        disabled={disabled}
        onChange={(e) => set(year || String(thisYear), e.target.value)}
      >
        <option value="">Ay</option>
        {MONTHS_TR.map((n, i) => (
          <option key={n} value={String(i + 1).padStart(2, '0')}>
            {n}
          </option>
        ))}
      </select>
      <select
        className="input select"
        aria-label={`${ariaLabel} – yıl`}
        value={year}
        disabled={disabled}
        onChange={(e) => set(e.target.value, month)}
      >
        <option value="">Yıl</option>
        {YEARS.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}

/** Gün / Ay / Yıl seçici: her tarayıcıda aynı, Türkçe ve belirsizliksiz (04/12 sorunu yok). Değer: YYYY-MM-DD */
export function DateField({ label, value, onChange, minYear = 1940, maxYear = new Date().getFullYear(), hint, wide = true }: { label: string; value: string; onChange: (v: string) => void; minYear?: number; maxYear?: number; hint?: ReactNode; wide?: boolean }) {
  const id = useId();
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
  const [parts, setParts] = useState({ d: m ? String(parseInt(m[3], 10)) : '', mo: m ? m[2] : '', y: m ? m[1] : '' });
  const [last, setLast] = useState(value);
  if (value !== last) {
    setLast(value);
    const mm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
    setParts(mm ? { d: String(parseInt(mm[3], 10)), mo: mm[2], y: mm[1] } : value ? parts : { d: '', mo: '', y: '' });
  }
  const daysIn = (y: string, mo: string) => (y && mo ? new Date(parseInt(y, 10), parseInt(mo, 10), 0).getDate() : 31);
  const set = (k: 'd' | 'mo' | 'y', v: string) => {
    const next = { ...parts, [k]: v };
    if (next.d && parseInt(next.d, 10) > daysIn(next.y, next.mo)) next.d = String(daysIn(next.y, next.mo));
    setParts(next);
    const full = next.d && next.mo && next.y ? `${next.y}-${next.mo}-${next.d.padStart(2, '0')}` : '';
    setLast(full);
    onChange(full);
  };
  const years: string[] = [];
  for (let y = maxYear; y >= minYear; y--) years.push(String(y));
  const partial = (parts.d || parts.mo || parts.y) && !(parts.d && parts.mo && parts.y);
  return (
    <Field label={label} htmlFor={`${id}-d`} wide={wide} hint={partial ? 'Gün, ay ve yılın üçünü de seç.' : hint}>
      <div className="date-picker">
        <select id={`${id}-d`} className="input select" aria-label={`${label} – gün`} value={parts.d} onChange={(e) => set('d', e.target.value)}>
          <option value="">Gün</option>
          {Array.from({ length: daysIn(parts.y, parts.mo) }, (_, i) => String(i + 1)).map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select className="input select" aria-label={`${label} – ay`} value={parts.mo} onChange={(e) => set('mo', e.target.value)}>
          <option value="">Ay</option>
          {MONTHS_TR.map((n, i) => (
            <option key={n} value={String(i + 1).padStart(2, '0')}>
              {n}
            </option>
          ))}
        </select>
        <select className="input select" aria-label={`${label} – yıl`} value={parts.y} onChange={(e) => set('y', e.target.value)}>
          <option value="">Yıl</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>
    </Field>
  );
}

export function MonthField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const id = useId();
  return (
    <Field label={label} htmlFor={`${id}-m`}>
      <MonthPicker idPrefix={id} value={value} onChange={onChange} ariaLabel={label} />
    </Field>
  );
}

export function RangeField({ value, onChange, currentLabel = 'Devam ediyor' }: { value: DateRange | undefined; onChange: (v: DateRange) => void; currentLabel?: string }) {
  const v: DateRange = { start: '', end: '', current: false, ...(value ?? {}) };
  const id = useId();
  const reversed = v.start && v.end && !v.current && v.end < v.start;
  return (
    <div className="field wide">
      <div className="range-row">
        <div className="range-col">
          <label className="field-label" htmlFor={`${id}s-m`}>
            Başlangıç
          </label>
          <MonthPicker idPrefix={`${id}s`} value={v.start} onChange={(start) => onChange({ ...v, start })} ariaLabel="Başlangıç" />
        </div>
        <div className="range-col">
          <label className="field-label" htmlFor={`${id}e-m`}>
            Bitiş
          </label>
          <MonthPicker idPrefix={`${id}e`} value={v.end} disabled={v.current} onChange={(end) => onChange({ ...v, end })} ariaLabel="Bitiş" />
        </div>
      </div>
      <Checkbox label={currentLabel} checked={v.current} onChange={(current) => onChange({ ...v, current })} />
      {reversed ? <p className="field-error">Bitiş tarihi başlangıçtan önce görünüyor.</p> : null}
    </div>
  );
}

/* ---------------- etiketler ---------------- */
export function TagsInput({
  label,
  value,
  onChange,
  placeholder,
  hint,
  wide = true,
}: {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  hint?: ReactNode;
  wide?: boolean;
}) {
  const id = useId();
  const [draft, setDraft] = useState('');
  const add = (raw: string) => {
    const parts = raw
      .split(/[,;\n]/)
      .map((p) => p.trim())
      .filter(Boolean)
      .filter((p) => !value.some((v) => v.toLocaleLowerCase('tr-TR') === p.toLocaleLowerCase('tr-TR')));
    if (parts.length) onChange([...value, ...parts]);
    setDraft('');
  };
  return (
    <Field label={label} wide={wide} htmlFor={id} hint={hint ?? 'Enter veya virgülle ekle.'}>
      <div className="tags" onClick={() => document.getElementById(id)?.focus()}>
        {value.map((t, i) => (
          <span className="tag" key={`${t}-${i}`}>
            {t}
            <button type="button" className="tag-x" aria-label={`${t} etiketini kaldır`} onClick={() => onChange(value.filter((_, j) => j !== i))}>
              ×
            </button>
          </span>
        ))}
        <input
          id={id}
          className="tags-input"
          value={draft}
          placeholder={value.length ? '' : placeholder}
          onChange={(e) => {
            const v = e.target.value;
            if (/[,;]/.test(v)) add(v);
            else setDraft(v);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add(draft);
            } else if (e.key === 'Backspace' && !draft && value.length) {
              onChange(value.slice(0, -1));
            }
          }}
          onBlur={() => draft.trim() && add(draft)}
          onPaste={(e) => {
            const text = e.clipboardData.getData('text');
            if (/[,;\n]/.test(text)) {
              e.preventDefault();
              add(draft + text);
            }
          }}
        />
      </div>
    </Field>
  );
}

/* ---------------- maddeler ---------------- */
export function BulletsEditor({
  label,
  value,
  onChange,
  hint,
  lang = 'tr',
  examples = false,
}: {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
  hint?: ReactNode;
  lang?: Lang;
  examples?: boolean;
}) {
  const [active, setActive] = useState<number | null>(null);
  const refs = useRef<(HTMLTextAreaElement | null)[]>([]);
  const [focusIdx, setFocusIdx] = useState<number | null>(null);
  useEffect(() => {
    if (focusIdx !== null) {
      refs.current[focusIdx]?.focus();
      setFocusIdx(null);
    }
  }, [focusIdx]);
  const items = value.length ? value : [];
  const setAt = (i: number, v: string) => onChange(items.map((x, j) => (j === i ? v : x)));
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const long = (t: string) => t.length > 220;
  return (
    <div className="field wide">
      <span className="field-label">{label}</span>
      <ol className="bullets">
        {items.map((b, i) => (
          <li key={i} className="bullet-row" onFocus={() => setActive(i)}>
            <span className="bullet-dot" aria-hidden>
              •
            </span>
            <AutoTextarea
              className={`input textarea bullet-input${long(b) ? ' warn' : ''}`}
              value={b}
              minRows={1}
              inputRef={(el) => (refs.current[i] = el)}
              placeholder="Ne yaptın, sonucu ne oldu?"
              onChange={(v) => setAt(i, v.replace(/\n/g, ' '))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const next = [...items];
                  next.splice(i + 1, 0, '');
                  onChange(next);
                  setFocusIdx(i + 1);
                } else if (e.key === 'Backspace' && !b && items.length > 0) {
                  e.preventDefault();
                  onChange(items.filter((_, j) => j !== i));
                  setFocusIdx(Math.max(0, i - 1));
                }
              }}
            />
            <div className="bullet-actions">
              <button type="button" className="icon-btn sm" aria-label="Yukarı taşı" disabled={i === 0} onClick={() => move(i, -1)}>
                <Icon name="up" />
              </button>
              <button type="button" className="icon-btn sm" aria-label="Aşağı taşı" disabled={i === items.length - 1} onClick={() => move(i, 1)}>
                <Icon name="down" />
              </button>
              <button type="button" className="icon-btn sm" aria-label="Maddeyi sil" onClick={() => onChange(items.filter((_, j) => j !== i))}>
                <Icon name="x" />
              </button>
            </div>
            {active === i && b.trim().length > 12 && <BulletHintList text={b} lang={lang} />}
          </li>
        ))}
      </ol>
      <div className="bullet-tools">
      <button
        type="button"
        className="btn ghost sm"
        onClick={() => {
          onChange([...items, '']);
          setFocusIdx(items.length);
        }}
      >
        <Icon name="plus" /> Madde ekle
      </button>
      {examples && lang === 'tr' && <ExamplePicker onPick={(t) => onChange([...items.filter((x) => x.trim()), t])} />}
      </div>
      {items.some(long) ? <p className="field-error soft">Bazı maddeler çok uzun. 1-2 satırı geçmeyen maddeler daha kolay okunur.</p> : hint ? <p className="field-hint">{hint}</p> : null}
    </div>
  );
}

/* ---------------- kaydırıcı ---------------- */
export function Slider({
  label,
  value,
  onChange,
  min,
  max,
  step,
  unit,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  unit: string;
}) {
  const id = useId();
  return (
    <div className="slider">
      <label htmlFor={id} className="slider-label">
        {label}
      </label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} />
      <div className="slider-num">
        <input
          type="number"
          aria-label={`${label} değeri`}
          className="input num"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            if (!isNaN(v)) onChange(Math.min(max, Math.max(min, v)));
          }}
        />
        <span className="unit">{unit}</span>
      </div>
    </div>
  );
}

export function Segmented<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode; title?: string }[];
}) {
  return (
    <div className="seg-field">
      <span className="field-label">{label}</span>
      <div className="segmented" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button
            type="button"
            key={o.value}
            role="radio"
            aria-checked={value === o.value}
            title={o.title}
            className={value === o.value ? 'on' : ''}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------------- ikonlar ---------------- */
const PATHS: Record<string, string> = {
  plus: 'M12 5v14M5 12h14',
  x: 'M6 6l12 12M18 6L6 18',
  up: 'M6 15l6-6 6 6',
  down: 'M6 9l6 6 6-6',
  grip: 'M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 100-6 3 3 0 000 6z',
  eyeoff: 'M3 3l18 18M10.6 5.1A10 10 0 0112 5c6.5 0 10 7 10 7a17 17 0 01-3.2 4.2M6.6 6.6A17 17 0 002 12s3.5 7 10 7a9.7 9.7 0 005.4-1.6M9.9 9.9a3 3 0 004.2 4.2',
  copy: 'M9 9h10v10H9zM5 15V5h10',
  briefcase: 'M3 8h18v12H3zM8 8V5h8v3M3 13h18',
  share: 'M18 8a3 3 0 100-6 3 3 0 000 6zM6 15a3 3 0 100-6 3 3 0 000 6zM18 22a3 3 0 100-6 3 3 0 000 6zM8.6 13.5l6.8 4M15.4 6.5l-6.8 4',
  qr: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h3v3h-3zM18 18h3v3h-3zM18 14h3M14 18v3',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  undo: 'M9 14L4 9l5-5M4 9h11a5 5 0 010 10h-3',
  redo: 'M15 14l5-5-5-5M20 9H9a5 5 0 000 10h3',
  download: 'M12 4v11M7 10l5 5 5-5M5 20h14',
  upload: 'M12 20V9M7 14l5-5 5 5M5 4h14',
  chevron: 'M9 6l6 6-6 6',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  edit: 'M4 20h4L19 9l-4-4L4 16v4z',
  back: 'M15 6l-6 6 6 6',
  globe: 'M12 3a9 9 0 100 18 9 9 0 000-18zM3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z',
  sun: 'M12 4V2M12 22v-2M4 12H2M22 12h-2M5.6 5.6L4.2 4.2M19.8 19.8l-1.4-1.4M5.6 18.4l-1.4 1.4M19.8 4.2l-1.4 1.4M12 17a5 5 0 100-10 5 5 0 000 10z',
  moon: 'M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  zoomin: 'M11 18a7 7 0 100-14 7 7 0 000 14zM20 20l-4-4M11 8v6M8 11h6',
  zoomout: 'M11 18a7 7 0 100-14 7 7 0 000 14zM20 20l-4-4M8 11h6',
  check: 'M5 12l5 5 9-10',
  alert: 'M12 9v4M12 17h.01M10.3 4l-8 14a2 2 0 001.7 3h16a2 2 0 001.7-3l-8-14a2 2 0 00-3.4 0z',
  image: 'M4 5h16v14H4zM4 15l4-4 4 4 3-3 5 5M15 9h.01',
  history: 'M3 12a9 9 0 103-6.7L3 8M3 3v5h5M12 7v5l3 2',
  file: 'M14 3H6v18h12V7l-4-4zM14 3v4h4',
  files: 'M8 3h8l4 4v11H8zM16 3v4h4M4 7v14h11',
  sparkle: 'M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z',
  info: 'M12 3a9 9 0 100 18 9 9 0 000-18zM12 11v5M12 8h.01',
  shrink: 'M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7',
  linkedin: 'M4 9h4v11H4zM6 3.5a2 2 0 110 4 2 2 0 010-4zM10 9h3.8v1.6c.5-1 1.9-1.9 3.7-1.9 3.6 0 4.5 2.2 4.5 5.3V20h-4v-5.2c0-1.4-.2-2.9-2-2.9s-2.1 1.3-2.1 2.8V20H10z',
  letter: 'M4 5h16v14H4zM4 7l8 6 8-6',
  shield: 'M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6l8-3zM9 12l2 2 4-4',
};
export function Icon({ name, size = 16 }: { name: keyof typeof PATHS | string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable="false">
      <path d={PATHS[name] ?? ''} />
    </svg>
  );
}

function BulletHintList({ text, lang }: { text: string; lang: Lang }) {
  const r = scoreBullet(text, lang);
  const tone = r.score >= 80 ? 'good' : r.score >= 60 ? 'mid' : 'low';
  const weak = r.verb === 'weak' || r.verb === 'passive';
  return (
    <div className="bullet-hints" aria-live="polite">
      <p className={`bullet-hint scored ${tone}`}>
        <span className="b-score" title="Madde puanı (ATS kontrolündeki ölçütlerle)">
          {r.score}
        </span>
        {r.tips.length ? r.tips[0] : 'Güçlü bir madde: eylem, ölçü ve sonuç var.'}
      </p>
      {r.tips[1] && (
        <p className="bullet-hint">
          <Icon name="info" size={12} /> {r.tips[1]}
        </p>
      )}
      {weak && <p className="bullet-hint"><span className="verbs">{STRONG_VERBS[lang].flatMap((g) => g.verbs).slice(0, 8).join(' · ')}</span></p>}
    </div>
  );
}
