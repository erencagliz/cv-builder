import { useEffect, useRef, useState } from 'react';
import { uiLang } from '../i18n';
import { useFocus } from '../store/focus';
import type { Draft } from 'immer';
import type { CV, Entry, SectionKey, EntrySectionKey, DateRange } from '../model/types';
import { SECTION_MAP, CUSTOM_FIELDS, isStandardTitle, type FieldDef } from '../model/sections';
import { LINK_TYPES, LINK_MAP, resolveLink, displayLink, isValidUrl, isValidEmail } from '../model/links';
import { newEntry, uid } from '../model/defaults';
import { sectionTitle, formatRange } from '../render/buildModel';
import { useEditor } from '../store/editor';
import {
  TextInput,
  PhoneInput,
  TextArea,
  Select,
  Checkbox,
  MonthField,
  DateField,
  RangeField,
  TagsInput,
  BulletsEditor,
  Field,
  Icon,
} from '../ui/fields';
import { SortableList, DragHandle } from '../ui/Sortable';
import { cropPhoto, PhotoError } from '../ui/photo';
import { useToast } from '../ui/app';
import { IconPicker } from '../ui/IconPicker';
import { sectionIconId } from '../render/iconSvg';

type Update = (fn: (d: Draft<CV>) => void, key?: string) => void;

/** Aynı odak isteğinin panel yeniden açıldığında tekrar uygulanmaması için */
const handled = { section: 0, entry: 0 };

/* ======================================================================= */
export function ContentPanel({ cv }: { cv: CV }) {
  const update = useEditor((s) => s.update);
  const [open, setOpen] = useState<Record<string, boolean>>({ header: true });
  const toggle = (k: string) => setOpen((o) => ({ ...o, [k]: !o[k] }));
  const req = useFocus((s) => s.req);
  useEffect(() => {
    if (!req || req.n === handled.section) return;
    handled.section = req.n;
    setOpen((o) => ({ ...o, [req.section]: true }));
    if (req.entryId) return; // girdiye EntryList kaydırır
    setTimeout(() => document.querySelector(`[data-sec="${req.section}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  }, [req]);

  return (
    <div className="content-panel">
      <HeaderCard cv={cv} update={update} open={!!open.header} onToggle={() => toggle('header')} />

      <div className="order-hint">
        <span>Bölümler</span>
        <span className="muted">Sürükleyerek sırala · göz simgesiyle gizle</span>
      </div>

      <SortableList
        items={cv.order}
        getId={(k) => k}
        onReorder={(next) => update((d) => void (d.order = next))}
        className="section-list"
        render={(key, handle) => (
          <SectionCard key={key} cv={cv} sectionKey={key} update={update} open={!!open[key]} onToggle={() => toggle(key)} handle={handle} />
        )}
      />

      <button
        type="button"
        className="btn dashed full"
        onClick={() => {
          const id = uid();
          update((d) => {
            d.custom.push({ id, title: 'Yeni bölüm', items: [newEntry()] });
            d.order.push(`custom:${id}`);
          });
          setOpen((o) => ({ ...o, [`custom:${id}`]: true }));
        }}
      >
        <Icon name="plus" /> Özel bölüm ekle
      </button>
    </div>
  );
}

/* ======================= Başlık: kişisel + iletişim ======================= */
export function HeaderCard({ cv, update, open, onToggle }: { cv: CV; update: Update; open: boolean; onToggle: () => void }) {
  const p = cv.personal;
  const set = (k: keyof CV['personal']) => (v: unknown) => update((d) => void ((d.personal as any)[k] = v), `p.${k}`);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const emailErr = touched.email && p.email && !isValidEmail(p.email) ? 'E-posta adresi eksik görünüyor (ör. ad@ornek.com).' : undefined;
  const fullName = [p.firstName, p.lastName].filter(Boolean).join(' ');
  return (
    <section className={`card${open ? ' open' : ''}`} data-sec="header">
      <button type="button" className="card-head" onClick={onToggle} aria-expanded={open}>
        <span className="card-title">Ad, iletişim ve fotoğraf</span>
        <span className="card-meta">{fullName || 'Ad soyad girilmedi'}</span>
        <span className="chev">
          <Icon name="chevron" />
        </span>
      </button>
      {open && (
        <div className="card-body">
          <div className="grid">
            <TextInput label="Ad" value={p.firstName} onChange={set('firstName')} autoComplete="given-name" />
            <TextInput label="Soyad" value={p.lastName} onChange={set('lastName')} autoComplete="family-name" />
            <TextInput
              label="Unvan / hedef pozisyon"
              wide
              value={p.title}
              onChange={set('title')}
              placeholder="Bilgi İşlem Uzmanı"
              hint="Başvurduğun ilandaki pozisyon adını kullanmak ATS eşleşmesini artırır."
            />
            <TextInput
              label="E-posta"
              type="email"
              inputMode="email"
              value={p.email}
              onChange={set('email')}
              onBlur={() => setTouched((t) => ({ ...t, email: true }))}
              error={emailErr}
              autoComplete="email"
            />
            <PhoneInput label="Telefon" value={p.phone} onChange={set('phone')} />
            <TextInput label="Konum" wide value={p.location} onChange={set('location')} placeholder="Ataşehir, İstanbul" hint="Şehir ve ilçe yeterli; açık adres yazma." />
          </div>

          <PhotoField cv={cv} update={update} />

          <h4 className="sub-title">Bağlantılar</h4>
          <LinksEditor cv={cv} update={update} />
        </div>
      )}
    </section>
  );
}

export function PhotoField({ cv, update }: { cv: CV; update: Update }) {
  const p = cv.personal;
  const toast = useToast();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const onFile = async (file: File) => {
    setError('');
    setBusy(true);
    try {
      const url = await cropPhoto(file);
      update((d) => {
        d.personal.photo = url;
        d.personal.showPhoto = true;
      });
      toast(cv.international ? 'Fotoğraf eklendi, ama Uluslararası mod açık olduğu için CV’de gizli.' : 'Fotoğraf eklendi.');
    } catch (e) {
      setError(e instanceof PhotoError ? e.message : 'Fotoğraf açılamadı. JPG veya PNG bir fotoğraf dene.');
    } finally {
      setBusy(false);
      if (input.current) input.current.value = ''; // aynı dosya tekrar seçilebilsin
    }
  };
  // Fotoğraf var ama CV'de görünmüyorsa nedenini açıkça söyle
  const hiddenReason = !p.photo ? '' : !p.showPhoto ? 'Fotoğraf yüklü ama “CV’de göster” kapalı.' : cv.international ? 'Uluslararası mod açık olduğu için fotoğraf CV’de gizleniyor.' : '';
  return (
    <div
      className={`photo-field${drag ? ' drag' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        const f = e.dataTransfer.files?.[0];
        if (f) onFile(f);
      }}
    >
      <button type="button" className="photo-thumb" onClick={() => input.current?.click()} aria-label={p.photo ? 'Fotoğrafı değiştir' : 'Fotoğraf ekle'}>
        {busy ? <span className="spinner" aria-hidden /> : p.photo ? <img src={p.photo} alt="" /> : <Icon name="image" size={22} />}
      </button>
      <div className="photo-body">
        <div className="photo-actions">
          <button type="button" className="btn ghost sm" onClick={() => input.current?.click()} disabled={busy}>
            <Icon name="upload" /> {busy ? 'Hazırlanıyor…' : p.photo ? 'Değiştir' : 'Fotoğraf ekle'}
          </button>
          {p.photo && (
            <button type="button" className="btn ghost sm" onClick={() => update((d) => void ((d.personal.photo = ''), (d.personal.showPhoto = false)))}>
              Kaldır
            </button>
          )}
          <input ref={input} type="file" accept="image/*,.heic,.heif,.jfif" hidden data-testid="photo-input" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
        </div>
        {p.photo && <Checkbox label="Fotoğrafı CV’de göster" checked={p.showPhoto} onChange={(v) => update((d) => void (d.personal.showPhoto = v))} />}
        {hiddenReason ? (
          <p className="note warn">
            <Icon name="alert" size={14} /> {hiddenReason}
            {cv.international && p.showPhoto && (
              <button type="button" className="link-btn" onClick={() => update((d) => void (d.international = false))}>
                Uluslararası modu kapat
              </button>
            )}
          </p>
        ) : (
          <p className="field-hint">İsteğe bağlı; sürükleyip bırakabilirsin. ATS fotoğrafı okumaz ama metni de bozmaz. Yurt dışı başvurularında fotoğrafsız CV önerilir.</p>
        )}
        {error && (
          <p className="note warn" role="alert">
            <Icon name="alert" size={14} /> {error}
          </p>
        )}
      </div>
    </div>
  );
}

function LinksEditor({ cv, update }: { cv: CV; update: Update }) {
  return (
    <div className="links">
      <SortableList
        items={cv.links}
        getId={(l) => l.id}
        onReorder={(next) => update((d) => void (d.links = next))}
        render={(l, handle, i) => {
          const url = resolveLink(l.type, l.value);
          const bad = l.value.trim() && !isValidUrl(url);
          const t = LINK_MAP[l.type];
          return (
            <div className="link-row">
              <DragHandle handle={handle} label="Bağlantıyı taşı" />
              <select
                className="input select link-type"
                aria-label="Platform"
                value={l.type}
                onChange={(e) => update((d) => void (d.links[i].type = e.target.value))}
              >
                {LINK_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <div className="link-main">
                {l.type === 'custom' && (
                  <input
                    className="input"
                    aria-label="Bağlantı adı"
                    placeholder="Ad (ör. Blog)"
                    value={l.label}
                    onChange={(e) => update((d) => void (d.links[i].label = e.target.value), `l.${l.id}.label`)}
                  />
                )}
                <input
                  className="input"
                  aria-label={`${t?.name ?? 'Bağlantı'} adresi`}
                  placeholder={t?.placeholder}
                  value={l.value}
                  aria-invalid={!!bad}
                  onChange={(e) => update((d) => void (d.links[i].value = e.target.value), `l.${l.id}.value`)}
                />
                {url && (
                  <span className={`link-preview${bad ? ' bad' : ''}`}>
                    {bad ? 'Adres geçersiz görünüyor' : `CV’de: ${displayLink(url)}`}
                  </span>
                )}
              </div>
              <button type="button" className="icon-btn" aria-label="Bağlantıyı sil" onClick={() => update((d) => void d.links.splice(i, 1))}>
                <Icon name="trash" />
              </button>
            </div>
          );
        }}
      />
      <div className="link-add">
        {['linkedin', 'github', 'website', 'portfolio'].map((t) =>
          cv.links.some((l) => l.type === t) ? null : (
            <button key={t} type="button" className="chip-btn" onClick={() => update((d) => void d.links.push({ id: uid(), type: t, value: '', label: '' }))}>
              <Icon name="plus" size={13} /> {LINK_MAP[t].name}
            </button>
          ),
        )}
        <button type="button" className="chip-btn" onClick={() => update((d) => void d.links.push({ id: uid(), type: 'custom', value: '', label: '' }))}>
          <Icon name="plus" size={13} /> Başka platform
        </button>
      </div>
    </div>
  );
}

/* ============================ Bölüm kartı ============================ */
export function SectionCard({
  cv,
  sectionKey,
  update,
  open,
  onToggle,
  handle,
}: {
  cv: CV;
  sectionKey: SectionKey;
  update: Update;
  open: boolean;
  onToggle: () => void;
  handle?: Parameters<typeof DragHandle>[0]['handle'];
}) {
  const isCustom = sectionKey.startsWith('custom:');
  const custom = isCustom ? cv.custom.find((c) => `custom:${c.id}` === sectionKey) : undefined;
  const def = !isCustom ? SECTION_MAP[sectionKey as keyof typeof SECTION_MAP] : undefined;
  const hidden = cv.hidden.includes(sectionKey);
  const title = sectionTitle(cv, sectionKey);
  const [renaming, setRenaming] = useState(false);
  const count = countItems(cv, sectionKey);

  const setTitle = (v: string) =>
    update((d) => {
      if (isCustom) {
        const c = d.custom.find((x) => `custom:${x.id}` === sectionKey);
        if (c) c.title = v;
      } else d.titles[sectionKey] = v;
    }, `title.${sectionKey}`);

  return (
    <section className={`card section-card${open ? ' open' : ''}${hidden ? ' is-hidden' : ''}`} data-sec={sectionKey}>
      <div className="card-head-row">
        {handle ? <DragHandle handle={handle} label={`${title} bölümünü taşı`} /> : <span className="handle-space" />}
        <IconPicker
          value={sectionIconId(cv.sectionIcons ?? {}, sectionKey)}
          enabled={cv.design.icons.sections}
          label={`${title} ikonu`}
          onChange={(id) =>
            update((d) => {
              d.sectionIcons = { ...(d.sectionIcons ?? {}), [sectionKey]: id };
              if (id !== 'none') d.design.icons.sections = true;
            })
          }
        />
        {renaming ? (
          <input
            className="input title-input"
            autoFocus
            aria-label="Bölüm başlığı"
            value={isCustom ? custom?.title ?? '' : cv.titles[sectionKey] ?? title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => setRenaming(false)}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === 'Escape') && setRenaming(false)}
          />
        ) : (
          <button type="button" className="card-head" onClick={onToggle} aria-expanded={open}>
            <span className="card-title">{title}</span>
            <span className="card-meta">{hidden ? 'Gizli' : count}</span>
            <span className="chev">
              <Icon name="chevron" />
            </span>
          </button>
        )}
        <button type="button" className="icon-btn" aria-label="Başlığı değiştir" title="Başlığı değiştir" onClick={() => setRenaming(true)}>
          <Icon name="edit" />
        </button>
        <button
          type="button"
          className="icon-btn"
          aria-label={hidden ? 'Bölümü göster' : 'Bölümü gizle'}
          title={hidden ? 'CV’de göster' : 'CV’de gizle'}
          aria-pressed={hidden}
          onClick={() =>
            update((d) => {
              d.hidden = hidden ? d.hidden.filter((k) => k !== sectionKey) : [...d.hidden, sectionKey];
            })
          }
        >
          <Icon name={hidden ? 'eyeoff' : 'eye'} />
        </button>
      </div>
      {open && (
        <div className="card-body">
          {!isStandardTitle(title) && (
            <p className="note warn">
              <Icon name="alert" size={14} /> “{title}” standart bir başlık değil. ATS sistemleri “İş Deneyimi”, “Eğitim”, “Yetenekler” gibi başlıkları daha iyi tanır.
              {!isCustom && cv.titles[sectionKey] ? (
                <button type="button" className="link-btn" onClick={() => update((d) => void delete d.titles[sectionKey])}>
                  Varsayılana dön
                </button>
              ) : null}
            </p>
          )}
          {def?.description && <p className="section-desc">{def.description}</p>}
          <SectionBody cv={cv} sectionKey={sectionKey} update={update} />
          {isCustom && (
            <button
              type="button"
              className="btn danger-ghost sm"
              onClick={() =>
                update((d) => {
                  d.custom = d.custom.filter((c) => `custom:${c.id}` !== sectionKey);
                  d.order = d.order.filter((k) => k !== sectionKey);
                  d.hidden = d.hidden.filter((k) => k !== sectionKey);
                })
              }
            >
              <Icon name="trash" /> Bu bölümü sil
            </button>
          )}
        </div>
      )}
    </section>
  );
}

function countItems(cv: CV, key: SectionKey): string {
  if (key === 'summary') return cv.summary.trim() ? 'Dolu' : 'Boş';
  if (key === 'hobbies') return cv.hobbies.trim() ? 'Dolu' : 'Boş';
  if (key === 'personal') {
    const p = cv.personal;
    const n = [p.birthDate, p.nationality, p.military, p.licenses.length ? 'x' : '', p.marital, p.travel].filter(Boolean).length;
    return n ? `${n} bilgi` : 'Boş';
  }
  if (key === 'references') return cv.references.onRequest ? 'Talep üzerine' : `${cv.references.items.length} kişi`;
  if (key.startsWith('custom:')) return `${cv.custom.find((c) => `custom:${c.id}` === key)?.items.length ?? 0} öğe`;
  const n = cv.sections[key as EntrySectionKey]?.length ?? 0;
  return n ? `${n} öğe` : 'Boş';
}

function SectionBody({ cv, sectionKey, update }: { cv: CV; sectionKey: SectionKey; update: Update }) {
  if (sectionKey === 'summary')
    return (
      <TextArea
        label="Özet"
        value={cv.summary}
        onChange={(v) => update((d) => void (d.summary = v), 'summary')}
        placeholder="Ör. 5 yıllık deneyime sahip Bilgi İşlem Uzmanı. Active Directory ve son kullanıcı desteğinde…"
        hint="**kalın** ve *italik* kullanabilirsin."
        counter={{ min: 200, max: 600 }}
      />
    );
  if (sectionKey === 'hobbies')
    return <TextArea label="İlgi alanları" value={cv.hobbies} onChange={(v) => update((d) => void (d.hobbies = v), 'hobbies')} placeholder="Satranç, doğa yürüyüşü, açık kaynak projelere katkı" />;
  if (sectionKey === 'personal') return <PersonalDetails cv={cv} update={update} />;
  if (sectionKey === 'references')
    return (
      <>
        <Checkbox
          label="“Referanslar talep edildiğinde sunulacaktır” yaz"
          checked={cv.references.onRequest}
          onChange={(v) => update((d) => void (d.references.onRequest = v))}
          hint="İşaretliyse aşağıdaki kişiler CV’de görünmez."
        />
        <EntryList
          items={cv.references.items}
          fields={SECTION_MAP.references.fields!}
          summary={SECTION_MAP.references.summary!}
          addLabel="Referans ekle"
          cv={cv}
          mutate={(fn) => update((d) => fn(d.references.items))}
          updateField={(i, k, v, id) => update((d) => void (d.references.items[i][k] = v), `ref.${id}.${k}`)}
        />
      </>
    );
  if (sectionKey.startsWith('custom:')) {
    const idx = cv.custom.findIndex((c) => `custom:${c.id}` === sectionKey);
    if (idx < 0) return null;
    return (
      <EntryList
        items={cv.custom[idx].items}
        fields={CUSTOM_FIELDS}
        summary={(e) => [e.title, e.subtitle].filter(Boolean).join(' · ')}
        addLabel="Öğe ekle"
        cv={cv}
        mutate={(fn) => update((d) => fn(d.custom[idx].items))}
        updateField={(i, k, v, id) => update((d) => void (d.custom[idx].items[i][k] = v), `c.${id}.${k}`)}
      />
    );
  }
  const key = sectionKey as EntrySectionKey;
  const def = SECTION_MAP[key];
  return (
    <EntryList
      items={cv.sections[key]}
      fields={def.fields!}
      summary={def.summary!}
      addLabel={def.addLabel ?? 'Ekle'}
      cv={cv}
      mutate={(fn) => update((d) => fn(d.sections[key]))}
      updateField={(i, k, v, id) => update((d) => void (d.sections[key][i][k] = v), `${key}.${id}.${k}`)}
    />
  );
}

/* ============================ Girdi listesi ============================ */
function EntryList({
  items,
  fields,
  summary,
  addLabel,
  cv,
  mutate,
  updateField,
}: {
  items: Entry[];
  fields: FieldDef[];
  summary: (e: Record<string, unknown>) => string;
  addLabel: string;
  cv: CV;
  mutate: (fn: (list: Draft<Entry>[]) => void) => void;
  updateField: (i: number, key: string, value: unknown, id: string) => void;
}) {
  const [openId, setOpenId] = useState<string | null>(items.length === 1 ? items[0].id : null);
  const req = useFocus((s) => s.req);
  useEffect(() => {
    if (!req?.entryId || req.n === handled.entry || !items.some((e) => e.id === req.entryId)) return;
    handled.entry = req.n;
    setOpenId(req.entryId);
    setTimeout(() => {
      const el = document.querySelector<HTMLElement>(`[data-entry="${req.entryId}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      el?.classList.add('flash');
      setTimeout(() => el?.classList.remove('flash'), 1600);
    }, 80);
  }, [req, items]);
  return (
    <div className="entries">
      <SortableList
        items={items}
        getId={(e) => e.id}
        onReorder={(next) => mutate((list) => void list.splice(0, list.length, ...(next as Draft<Entry>[])))}
        render={(e, handle, i) => {
          const isOpen = openId === e.id;
          const dates = e.dates ? formatRange(e.dates, 'MMM YYYY', uiLang()) : typeof e.date === 'string' ? formatRange({ start: e.date, end: '', current: false }, 'MMM YYYY', uiLang()) : '';
          return (
            <div className={`entry${isOpen ? ' open' : ''}`} data-entry={e.id}>
              <div className="entry-head">
                <DragHandle handle={handle} label="Öğeyi taşı" />
                <button type="button" className="entry-toggle" onClick={() => setOpenId(isOpen ? null : e.id)} aria-expanded={isOpen}>
                  <span className="entry-title">{summary(e) || <em className="muted">Başlıksız</em>}</span>
                  {dates && <span className="entry-dates">{dates}</span>}
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  aria-label="Çoğalt"
                  title="Çoğalt"
                  onClick={() => {
                    const copy = { ...structuredClone(e), id: uid() };
                    mutate((list) => void list.splice(i + 1, 0, copy as Draft<Entry>));
                    setOpenId(copy.id);
                  }}
                >
                  <Icon name="copy" />
                </button>
                <button type="button" className="icon-btn" aria-label="Sil" title="Sil (Ctrl+Z ile geri alınır)" onClick={() => mutate((list) => void list.splice(i, 1))}>
                  <Icon name="trash" />
                </button>
              </div>
              {isOpen && (
                <div className="entry-body grid">
                  {fields.map((f) => (
                    <EntryField key={f.key} field={f} value={e[f.key]} onChange={(v) => updateField(i, f.key, v, e.id)} cv={cv} />
                  ))}
                </div>
              )}
            </div>
          );
        }}
      />
      <button
        type="button"
        className="btn dashed full"
        onClick={() => {
          const ne = newEntry();
          mutate((list) => void list.push(ne as Draft<Entry>));
          setOpenId(ne.id);
        }}
      >
        <Icon name="plus" /> {addLabel}
      </button>
    </div>
  );
}

function EntryField({ field: f, value, onChange, cv }: { field: FieldDef; value: unknown; onChange: (v: unknown) => void; cv: CV }) {
  const str = typeof value === 'string' ? value : '';
  const list = Array.isArray(value) ? (value as string[]) : [];
  switch (f.type) {
    case 'text':
      return <TextInput label={f.label} value={str} onChange={onChange} placeholder={f.placeholder} hint={f.hint} wide={f.wide} />;
    case 'url': {
      const bad = str.trim() && !isValidUrl(resolveLink('custom', str));
      return <TextInput label={f.label} value={str} onChange={onChange} placeholder={f.placeholder ?? 'https://…'} wide={f.wide} inputMode="url" error={bad ? 'Adres geçersiz görünüyor.' : undefined} />;
    }
    case 'textarea':
      return <TextArea label={f.label} value={str} onChange={onChange} placeholder={f.placeholder} hint={f.hint} />;
    case 'select':
      return <Select label={f.label} value={str} onChange={onChange} options={f.options ?? []} wide={f.wide} />;
    case 'month':
      return <MonthField label={f.label} value={str} onChange={onChange} />;
    case 'range':
      return <RangeField value={value as DateRange | undefined} onChange={onChange} />;
    case 'tags':
      return <TagsInput label={f.label} value={list} onChange={onChange} placeholder={f.placeholder} />;
    case 'bullets':
      return <BulletsEditor label={f.label} value={list} onChange={onChange} hint={f.hint} lang={cv.lang} examples />;
  }
}

/* ============================ Kişisel bilgiler ============================ */
const LICENSES = ['M', 'A1', 'A2', 'A', 'B1', 'B', 'BE', 'C1', 'C1E', 'C', 'CE', 'D1', 'D1E', 'D', 'DE', 'F', 'G'];

function PersonalDetails({ cv, update }: { cv: CV; update: Update }) {
  const p = cv.personal;
  const set = (k: keyof CV['personal']) => (v: unknown) => update((d) => void ((d.personal as any)[k] = v), `p.${k}`);
  return (
    <div className="grid">
      {cv.international && (
        <p className="note info wide">
          <Icon name="globe" size={14} /> Uluslararası mod açık: doğum tarihi, medeni durum, askerlik ve fotoğraf CV’de gösterilmiyor.
        </p>
      )}
      <DateField label="Doğum tarihi" value={p.birthDate} onChange={set('birthDate')} maxYear={new Date().getFullYear() - 14} />
      <Select
        label="Gösterim"
        value={p.birthFormat}
        onChange={set('birthFormat')}
        options={[
          { value: 'full', label: 'Tam tarih (12 Nisan 1998)' },
          { value: 'year', label: 'Yalnızca yıl (1998)' },
          { value: 'age', label: 'Yaş' },
        ]}
      />
      <TextInput label="Uyruk" value={p.nationality} onChange={set('nationality')} placeholder="T.C." />
      <Select
        label="Medeni durum"
        value={p.marital}
        onChange={set('marital')}
        options={[
          { value: '', label: 'Belirtme' },
          { value: 'single', label: 'Bekâr' },
          { value: 'married', label: 'Evli' },
        ]}
      />
      <Select
        label="Askerlik durumu"
        value={p.military}
        onChange={set('military')}
        options={[
          { value: '', label: 'Belirtme' },
          { value: 'done', label: 'Yapıldı' },
          { value: 'exempt', label: 'Muaf' },
          { value: 'deferred', label: 'Tecilli' },
          { value: 'na', label: 'Yükümlü değil' },
        ]}
        hint="Türkiye’de erkek adaylar için sıkça sorulur."
      />
      {(p.military === 'done' || p.military === 'deferred') && (
        <MonthField label={p.military === 'done' ? 'Terhis tarihi' : 'Tecil bitiş tarihi'} value={p.militaryDate} onChange={set('militaryDate')} />
      )}
      <Field label="Ehliyet sınıfları" wide>
        <div className="license-grid" role="group" aria-label="Ehliyet sınıfları">
          {LICENSES.map((l) => {
            const on = p.licenses.includes(l);
            return (
              <button
                key={l}
                type="button"
                className={`license${on ? ' on' : ''}`}
                aria-pressed={on}
                onClick={() =>
                  update((d) => {
                    d.personal.licenses = on ? d.personal.licenses.filter((x) => x !== l) : LICENSES.filter((x) => x === l || d.personal.licenses.includes(x));
                  })
                }
              >
                {l}
              </button>
            );
          })}
        </div>
      </Field>
      <TextInput label="Ehliyet yılı" value={p.licenseYear} onChange={set('licenseYear')} placeholder="2022" inputMode="numeric" />
      <Select
        label="Seyahat engeli"
        value={p.travel}
        onChange={set('travel')}
        options={[
          { value: '', label: 'Belirtme' },
          { value: 'yes', label: 'Seyahat engeli yok' },
          { value: 'no', label: 'Seyahat engeli var' },
        ]}
      />
    </div>
  );
}
