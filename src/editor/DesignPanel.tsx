import { useState, type ReactNode } from 'react';
import type { CV, Design, DateFormat, HeadingStyle } from '../model/types';
import { TEMPLATES, COLOR_PRESETS, BULLETS, SEPARATORS, applyTemplate } from '../model/templates';
import { useEditor } from '../store/editor';
import { Slider, Segmented, Checkbox, Select, Icon } from '../ui/fields';
import fonts from '../render/fonts.json';
import { contrast } from './contrast';
import { PhotoField } from './ContentPanel';
import { IconGlyph } from '../ui/IconPicker';

type FontDef = { id: string; family: string; category: 'sans' | 'serif' };
const FONTS = fonts as FontDef[];

function Group({ title, children, defaultOpen = true }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className={`dgroup${open ? ' open' : ''}`}>
      <button type="button" className="dgroup-head" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span>{title}</span>
        <span className="chev">
          <Icon name="chevron" />
        </span>
      </button>
      {open && <div className="dgroup-body">{children}</div>}
    </section>
  );
}

export function DesignPanel({ cv }: { cv: CV }) {
  const update = useEditor((s) => s.update);
  const d = cv.design;
  const set = <K extends keyof Design>(k: K, v: Design[K]) => update((x) => void (x.design[k] = v as never), `d.${String(k)}`);
  const setIn = <G extends 'colors' | 'sizes' | 'margins' | 'fonts'>(g: G, k: keyof Design[G], v: unknown) =>
    update((x) => void ((x.design[g] as any)[k] = v), `d.${g}.${String(k)}`);

  return (
    <div className="design-panel">
      <Group title="Şablon">
        <div className="templates">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`template${d.template === t.id ? ' on' : ''}`}
              aria-pressed={d.template === t.id}
              onClick={() => update((x) => void (x.design = applyTemplate(x.design, t.id)))}
            >
              <TemplateThumb id={t.id} accent={d.colors.accent} />
              <span className="template-name">{t.name}</span>
              <span className="template-desc">{t.description}</span>
            </button>
          ))}
        </div>
        <p className="field-hint">Şablon seçmek yazı tipi, boyut ve aralıkları o şablonun ayarlarına getirir; renklerin korunur. Hepsi tek sütunlu ve ATS uyumludur.</p>
      </Group>

      <Group title="Renkler">
        <div className="swatches" role="radiogroup" aria-label="Vurgu rengi">
          {COLOR_PRESETS.map((c) => (
            <button
              key={c.value}
              type="button"
              role="radio"
              aria-checked={d.colors.accent.toLowerCase() === c.value.toLowerCase()}
              className="swatch"
              style={{ background: c.value }}
              title={c.name}
              aria-label={c.name}
              onClick={() => setIn('colors', 'accent', c.value)}
            />
          ))}
        </div>
        <ColorRow label="Vurgu rengi" hint="Başlıklar, çizgiler ve seçilirse ad" value={d.colors.accent} onChange={(v) => setIn('colors', 'accent', v)} min={3} />
        <ColorRow label="Metin rengi" value={d.colors.text} onChange={(v) => setIn('colors', 'text', v)} min={7} />
        <ColorRow label="İkincil metin" hint="Tarih, konum, açıklamalar" value={d.colors.muted} onChange={(v) => setIn('colors', 'muted', v)} min={4.5} />
        <ColorRow label="Çizgi rengi" value={d.colors.rule} onChange={(v) => setIn('colors', 'rule', v)} min={1.3} />
        <Segmented
          label="Bölüm başlığı rengi"
          value={d.headingColor}
          onChange={(v) => set('headingColor', v)}
          options={[
            { value: 'accent', label: 'Vurgu' },
            { value: 'text', label: 'Metin' },
          ]}
        />
        <Segmented
          label="Unvan rengi"
          value={d.titleColor}
          onChange={(v) => set('titleColor', v)}
          options={[
            { value: 'accent', label: 'Vurgu' },
            { value: 'muted', label: 'Gri' },
          ]}
        />
        <Segmented
          label="Başlık çizgisi rengi"
          value={d.ruleColor}
          onChange={(v) => set('ruleColor', v)}
          options={[
            { value: 'accent', label: 'Vurgu' },
            { value: 'rule', label: 'Çizgi rengi' },
          ]}
        />
        <Segmented
          label="Madde işareti rengi"
          value={d.bulletColor}
          onChange={(v) => set('bulletColor', v)}
          options={[
            { value: 'accent', label: 'Vurgu' },
            { value: 'muted', label: 'Gri' },
          ]}
        />
        <Segmented
          label="Ad rengi"
          value={d.nameColor}
          onChange={(v) => set('nameColor', v)}
          options={[
            { value: 'text', label: 'Metin' },
            { value: 'accent', label: 'Vurgu' },
          ]}
        />
      </Group>

      <Group title="İkonlar ve bağlantılar">
        <Checkbox
          label={
            <span className="inline-ic">
              <IconGlyph id="briefcase" /> Bölüm başlıklarında ikon
            </span>
          }
          hint="Her bölümün ikonunu, bölüm kartındaki küçük ikon düğmesinden değiştirebilirsin."
          checked={d.icons.sections}
          onChange={(v) => update((x) => void (x.design.icons.sections = v))}
        />
        <Checkbox
          label={
            <span className="inline-ic">
              <IconGlyph id="smartphone" /> Telefon, e-posta, konum ve bağlantılarda ikon
            </span>
          }
          hint="LinkedIn, GitHub gibi platformlar kendi logolarıyla gösterilir."
          checked={d.icons.contacts}
          onChange={(v) => update((x) => void (x.design.icons.contacts = v))}
        />
        <Segmented
          label="İkon rengi"
          value={d.icons.color}
          onChange={(v) => update((x) => void (x.design.icons.color = v))}
          options={[
            { value: 'accent', label: 'Vurgu' },
            { value: 'text', label: 'Metin' },
            { value: 'muted', label: 'Gri' },
          ]}
        />
        <Segmented
          label="Bağlantılar nasıl görünsün?"
          value={d.linkStyle}
          onChange={(v) => set('linkStyle', v)}
          options={[
            { value: 'url', label: 'Adres', title: 'linkedin.com/in/ad' },
            { value: 'label', label: 'Platform adı', title: 'LinkedIn' },
            { value: 'button', label: 'Buton', title: 'Çerçeveli LinkedIn düğmesi' },
          ]}
        />
        <div className="link-demo" aria-hidden>
          {d.linkStyle === 'url' ? (
            <span>linkedin.com/in/adin</span>
          ) : d.linkStyle === 'label' ? (
            <span style={{ color: d.colors.accent }}>LinkedIn</span>
          ) : (
            <span className="demo-btn" style={{ color: d.colors.accent, borderColor: d.colors.accent }}>
              LinkedIn
            </span>
          )}
        </div>
        {d.linkStyle === 'url' ? (
          <Checkbox label="Adresin önüne platform adını yaz" hint="ör. “LinkedIn: linkedin.com/in/ad”" checked={d.linkLabels} onChange={(v) => set('linkLabels', v)} />
        ) : (
          <p className="note warn">
            <Icon name="alert" size={14} /> PDF’te bağlantıya tıklanabilir, ama adres metin olarak yazılmaz. Bazı ATS sistemleri yalnızca metni okuduğu için LinkedIn adresini göremeyebilir. ATS
            için en güvenlisi “Adres”.
          </p>
        )}
        <Checkbox label="Bağlantıların altını çiz" checked={d.underlineLinks} onChange={(v) => set('underlineLinks', v)} />
      </Group>

      <Group title="Fotoğraf">
        <PhotoField cv={cv} update={update} />
        {cv.personal.photo && (
          <>
            <Segmented
              label="Şekil"
              value={d.photo.shape}
              onChange={(v) => update((x) => void (x.design.photo.shape = v))}
              options={[
                { value: 'rounded', label: 'Vesikalık' },
                { value: 'circle', label: 'Yuvarlak' },
                { value: 'square', label: 'Kare' },
              ]}
            />
            <Slider label="Genişlik" value={d.photo.size} min={18} max={40} step={1} unit="mm" onChange={(v) => update((x) => void (x.design.photo.size = v), 'd.photo.size')} />
            <Segmented
              label="Konum"
              value={d.photo.position}
              onChange={(v) => update((x) => void (x.design.photo.position = v))}
              options={[
                { value: 'left', label: 'Solda' },
                { value: 'right', label: 'Sağda' },
              ]}
            />
          </>
        )}
      </Group>

      <Group title="Yazı tipleri">
        <FontPicker label="Başlık yazı tipi" value={d.fonts.heading} onChange={(v) => setIn('fonts', 'heading', v)} />
        <FontPicker label="Metin yazı tipi" value={d.fonts.body} onChange={(v) => setIn('fonts', 'body', v)} />
        <p className="field-hint">Listede yalnızca Türkçe karakterlerin tamamını (ğ, ş, ı, İ) içeren yazı tipleri var. PDF’e gömülür; işverenin bilgisayarında aynı görünür.</p>
      </Group>

      <Group title="Yazı boyutları">
        <Slider label="Ad soyad" value={d.sizes.name} min={14} max={36} step={0.5} unit="pt" onChange={(v) => setIn('sizes', 'name', v)} />
        <Slider label="Unvan" value={d.sizes.title} min={9} max={18} step={0.5} unit="pt" onChange={(v) => setIn('sizes', 'title', v)} />
        <Slider label="Bölüm başlığı" value={d.sizes.heading} min={9} max={18} step={0.5} unit="pt" onChange={(v) => setIn('sizes', 'heading', v)} />
        <Slider label="Pozisyon / okul adı" value={d.sizes.entryTitle} min={8.5} max={14} step={0.5} unit="pt" onChange={(v) => setIn('sizes', 'entryTitle', v)} />
        <Slider label="Metin" value={d.sizes.body} min={8.5} max={12.5} step={0.5} unit="pt" onChange={(v) => setIn('sizes', 'body', v)} />
        <Slider label="Tarih ve konum" value={d.sizes.meta} min={7.5} max={11.5} step={0.5} unit="pt" onChange={(v) => setIn('sizes', 'meta', v)} />
        {d.sizes.body < 9.5 && <p className="note warn">Metin 9,5 pt’nin altında. Yazdırıldığında okunması zorlaşabilir.</p>}
      </Group>

      <Group title="Aralıklar" defaultOpen={false}>
        <Slider label="Satır aralığı" value={d.leading} min={0.3} max={1.1} step={0.05} unit="em" onChange={(v) => set('leading', v)} />
        <Slider label="Paragraf aralığı" value={d.paragraphGap} min={0} max={14} step={0.5} unit="pt" onChange={(v) => set('paragraphGap', v)} />
        <Slider label="Bölümler arası" value={d.sectionGap} min={4} max={30} step={0.5} unit="pt" onChange={(v) => set('sectionGap', v)} />
        <Slider label="Başlık altı" value={d.headingGap} min={2} max={16} step={0.5} unit="pt" onChange={(v) => set('headingGap', v)} />
        <Slider label="Girdiler arası" value={d.entryGap} min={2} max={22} step={0.5} unit="pt" onChange={(v) => set('entryGap', v)} />
        <Slider label="Maddeler arası" value={d.bulletGap} min={0} max={10} step={0.5} unit="pt" onChange={(v) => set('bulletGap', v)} />
      </Group>

      <Group title="Sayfa" defaultOpen={false}>
        <Segmented
          label="Kağıt boyutu"
          value={d.paper}
          onChange={(v) => set('paper', v)}
          options={[
            { value: 'a4', label: 'A4' },
            { value: 'us-letter', label: 'Letter (ABD)' },
          ]}
        />
        <MarginControls d={d} setIn={setIn} update={update} />
      </Group>

      <Group title="Başlık stili" defaultOpen={false}>
        <Segmented<HeadingStyle>
          label="Bölüm başlığı"
          value={d.headingStyle}
          onChange={(v) => set('headingStyle', v)}
          options={[
            { value: 'rule', label: 'Alt çizgi' },
            { value: 'line-after', label: 'Yan çizgi' },
            { value: 'bar', label: 'Blok' },
            { value: 'filled', label: 'Zemin' },
            { value: 'plain', label: 'Sade' },
          ]}
        />
        <Segmented
          label="Harf"
          value={d.headingCase}
          onChange={(v) => set('headingCase', v)}
          options={[
            { value: 'upper', label: 'BÜYÜK HARF' },
            { value: 'normal', label: 'Normal' },
          ]}
        />
        <Segmented
          label="Kalınlık"
          value={d.headingWeight}
          onChange={(v) => set('headingWeight', v)}
          options={[
            { value: 'bold', label: 'Kalın' },
            { value: 'regular', label: 'Normal' },
          ]}
        />
        <Slider label="Harf aralığı" value={Math.min(d.headingTracking, 0.6)} min={0} max={0.6} step={0.1} unit="pt" onChange={(v) => set('headingTracking', v)} />
        <p className="field-hint">Daha geniş harf aralığı, bazı ATS’lerin “İŞ DENEYİMİ” gibi başlıkları “DENEY İMİ” diye bölmesine yol açtığı için 0,6 pt ile sınırlı.</p>
        <Segmented
          label="Ad hizası"
          value={d.nameAlign}
          onChange={(v) => set('nameAlign', v)}
          options={[
            { value: 'left', label: 'Sola' },
            { value: 'center', label: 'Ortaya' },
          ]}
        />
        <Segmented
          label="Ad yazımı"
          value={d.nameCase}
          onChange={(v) => set('nameCase', v)}
          options={[
            { value: 'normal', label: 'Normal' },
            { value: 'upper', label: 'BÜYÜK HARF' },
          ]}
        />
      </Group>

      <Group title="Ayrıntılar" defaultOpen={false}>
        <Segmented label="Madde işareti" value={d.bullet} onChange={(v) => set('bullet', v)} options={BULLETS.map((b) => ({ value: b, label: <span className="big-glyph">{b}</span> }))} />
        <Segmented
          label="İletişim ayırıcı"
          value={d.contactSeparator}
          onChange={(v) => set('contactSeparator', v)}
          options={SEPARATORS.map((b) => ({ value: b, label: <span className="big-glyph">{b}</span> }))}
        />
        <Select
          label="Tarih biçimi"
          value={d.dateFormat}
          onChange={(v) => set('dateFormat', v as DateFormat)}
          options={[
            { value: 'MMM YYYY', label: 'Eki 2024' },
            { value: 'MMMM YYYY', label: 'Ekim 2024' },
            { value: 'MM/YYYY', label: '10/2024' },
            { value: 'YYYY-MM', label: '2024-10' },
            { value: 'YYYY', label: '2024' },
          ]}
          wide
        />
        <Segmented
          label="Tarih konumu"
          value={d.datePosition}
          onChange={(v) => set('datePosition', v)}
          options={[
            { value: 'inline', label: 'Başlığın yanında' },
            { value: 'right', label: 'Sağa yaslı' },
            { value: 'below', label: 'Altında' },
          ]}
        />
        <Segmented
          label="Yetenek ve dil satırları"
          value={d.linesLayout}
          onChange={(v) => set('linesLayout', v)}
          options={[
            { value: 'table', label: 'Tablo' },
            { value: 'inline', label: 'Grup: liste' },
          ]}
        />
        <Checkbox label="Deneyimler arasına ince çizgi" checked={d.entryDivider} onChange={(v) => set('entryDivider', v)} />
        <Checkbox label="Aynı şirketteki pozisyonları grupla" hint="Terfileri tek şirket başlığı altında gösterir" checked={d.groupRoles} onChange={(v) => set('groupRoles', v)} />
        <Checkbox label="Kişisel bilgileri tek satırda göster" checked={d.personalInline} onChange={(v) => set('personalInline', v)} />
      </Group>

      <button type="button" className="btn ghost full" onClick={() => update((x) => void (x.design = applyTemplate(x.design, x.design.template)))}>
        “{TEMPLATES.find((t) => t.id === d.template)?.name}” şablon ayarlarına dön
      </button>
    </div>
  );
}

function MarginControls({ d, setIn, update }: { d: Design; setIn: (g: 'margins', k: keyof Design['margins'], v: unknown) => void; update: ReturnType<typeof useEditor.getState>['update'] }) {
  const same = d.margins.top === d.margins.bottom && d.margins.left === d.margins.right && d.margins.top === d.margins.left;
  const [linked, setLinked] = useState(same);
  const setAll = (v: number) => update((x) => void (x.design.margins = { top: v, bottom: v, left: v, right: v }), 'd.margins.all');
  return (
    <>
      <Checkbox label="Tüm kenar boşlukları aynı" checked={linked} onChange={setLinked} />
      {linked ? (
        <Slider label="Kenar boşluğu" value={d.margins.left} min={6} max={35} step={0.5} unit="mm" onChange={setAll} />
      ) : (
        <>
          <Slider label="Üst" value={d.margins.top} min={6} max={35} step={0.5} unit="mm" onChange={(v) => setIn('margins', 'top', v)} />
          <Slider label="Alt" value={d.margins.bottom} min={6} max={35} step={0.5} unit="mm" onChange={(v) => setIn('margins', 'bottom', v)} />
          <Slider label="Sol" value={d.margins.left} min={6} max={35} step={0.5} unit="mm" onChange={(v) => setIn('margins', 'left', v)} />
          <Slider label="Sağ" value={d.margins.right} min={6} max={35} step={0.5} unit="mm" onChange={(v) => setIn('margins', 'right', v)} />
        </>
      )}
      {Math.min(d.margins.left, d.margins.right, d.margins.top) < 10 && <p className="note warn">10 mm’den dar kenar boşlukları bazı yazıcılarda kesilebilir.</p>}
    </>
  );
}

function ColorRow({ label, hint, value, onChange, min }: { label: string; hint?: string; value: string; onChange: (v: string) => void; min: number }) {
  const [draft, setDraft] = useState(value);
  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue) {
    setLastValue(value);
    setDraft(value);
  }
  const ratio = contrast(value, '#ffffff');
  const low = ratio < min;
  return (
    <div className="color-row">
      <label className="color-chip" style={{ background: value }}>
        <input type="color" value={value} onChange={(e) => onChange(e.target.value.toUpperCase())} aria-label={`${label} seç`} />
      </label>
      <div className="color-text">
        <span className="color-label">{label}</span>
        {hint && <span className="color-hint">{hint}</span>}
        {low && <span className="color-warn">Beyaz zeminde zor okunur (kontrast {ratio.toFixed(1)}:1)</span>}
      </div>
      <input
        className="input hex"
        aria-label={`${label} kodu`}
        value={draft}
        maxLength={7}
        onChange={(e) => {
          const v = e.target.value.trim();
          setDraft(v);
          if (/^#[0-9a-f]{6}$/i.test(v)) onChange(v.toUpperCase());
        }}
        onBlur={() => setDraft(value)}
      />
    </div>
  );
}

function FontPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const cur = FONTS.find((f) => f.id === value);
  return (
    <div className="font-picker">
      <span className="field-label">{label}</span>
      <button type="button" className="font-current" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className="font-sample" style={{ fontFamily: `'${cur?.family}'` }}>
          {cur?.family}
        </span>
        <span className="chev">
          <Icon name="down" />
        </span>
      </button>
      {open && (
        <div className="font-list" role="listbox" aria-label={label}>
          {(['sans', 'serif'] as const).map((cat) => (
            <div key={cat}>
              <div className="font-cat">{cat === 'sans' ? 'Tırnaksız (sans-serif)' : 'Tırnaklı (serif)'}</div>
              {FONTS.filter((f) => f.category === cat).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  role="option"
                  aria-selected={f.id === value}
                  className={`font-opt${f.id === value ? ' on' : ''}`}
                  onClick={() => {
                    onChange(f.id);
                    setOpen(false);
                  }}
                >
                  <span className="font-name">{f.family}</span>
                  <span className="font-sample" style={{ fontFamily: `'${f.family}'` }}>
                    Çağrı Şükrü Öztürk, İğdır
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TemplateThumb({ id, accent }: { id: string; accent: string }) {
  const center = id === 'classic' || id === 'academic';
  const head = (y: number) => {
    switch (id) {
      case 'compact':
      case 'academic':
        return (
          <g key={y}>
            <rect x="8" y={y} width="16" height="2.4" rx="1" fill={id === 'compact' ? accent : '#333'} />
            <rect x="27" y={y + 0.9} width="45" height="0.7" fill="#bbb" />
          </g>
        );
      case 'technical':
        return (
          <g key={y}>
            <rect x="8" y={y - 0.6} width="1.6" height="3.6" fill={accent} />
            <rect x="12" y={y} width="18" height="2.4" rx="1" fill="#333" />
          </g>
        );
      case 'executive':
        return <rect key={y} x="8" y={y} width="20" height="2.2" rx="1" fill={accent} />;
      case 'signature':
        return (
          <g key={y}>
            <circle cx="9.5" cy={y + 1.2} r="1.4" fill="none" stroke={accent} strokeWidth="0.8" />
            <rect x="13" y={y} width="16" height="2.4" rx="1" fill={accent} />
            <rect x="8" y={y + 4} width="64" height="0.6" fill={accent} opacity=".45" />
          </g>
        );
      default:
        return (
          <g key={y}>
            <rect x="8" y={y} width="18" height="2.4" rx="1" fill={id === 'classic' ? '#333' : accent} />
            <rect x="8" y={y + 4} width="64" height="0.6" fill="#bbb" />
          </g>
        );
    }
  };
  const lines = (y: number) =>
    [0, 4, 8].map((o, i) => <rect key={o} x="8" y={y + o} width={i === 2 ? 40 : 64} height="1.6" rx="0.8" fill="#d4d7dc" />);
  return (
    <svg className="thumb" viewBox="0 0 80 100" aria-hidden>
      <rect width="80" height="100" fill="#fff" />
      <rect x={center ? 25 : 8} y="8" width="30" height={id === 'executive' ? 5 : 4} rx="1" fill={id === 'compact' || id === 'technical' ? accent : '#222'} />
      <rect x={center ? 20 : 8} y="16" width="40" height="1.6" rx="0.8" fill={id === 'signature' ? accent : '#c4c8ce'} opacity={id === 'signature' ? 0.7 : 1} />
      {head(24)}
      {lines(32)}
      {head(50)}
      {lines(58)}
      {head(76)}
      {lines(84)}
    </svg>
  );
}
