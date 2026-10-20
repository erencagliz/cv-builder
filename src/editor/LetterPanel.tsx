import { useState } from 'react';
import type { CV } from '../model/types';
import { useEditor } from '../store/editor';
import { TextInput, TextArea, Icon } from '../ui/fields';
import { LETTER_STARTERS, letterVars } from '../content/letters';
import { totalExperienceMonths } from '../ats/quality';

export function LetterPanel({ cv, onPdf, onDocx, busy }: { cv: CV; onPdf: () => void; onDocx: () => void; busy: boolean }) {
  const update = useEditor((s) => s.update);
  const L = cv.coverLetter;
  const set = (k: keyof CV['coverLetter']) => (v: string) => update((d) => void (d.coverLetter[k] = v), `cl.${k}`);
  const [pending, setPending] = useState<string | null>(null);
  const apply = (id: string) => {
    const st = LETTER_STARTERS.find((s) => s.id === id)!;
    const text = st.body(letterVars(cv, totalExperienceMonths(cv)));
    update((d) => {
      d.coverLetter.body = text;
      if (st.lang !== d.lang) d.lang = st.lang;
    });
    setPending(null);
  };
  const placeholders = (L.body.match(/\[[^\]]+\]/g) ?? []).length;

  return (
    <div className="content-panel">
      <header className="step-head">
        <p className="eyebrow">Ön yazı</p>
        <h2>Başvuruna kısa bir mektup ekle</h2>
        <p className="step-lead">CV’nle aynı tasarımı kullanır. Bir başlangıç metni seç, köşeli parantezli yerleri kendi bilgilerinle doldur. 3-4 kısa paragraf yeterli.</p>
      </header>

      <section className="card open">
        <div className="card-body">
          <div className="grid">
            <TextInput label="Şirket" value={L.company} onChange={set('company')} placeholder="Örnek Holding A.Ş." />
            <TextInput label="Pozisyon" value={L.position} onChange={set('position')} placeholder={cv.personal.title || 'Bilgi İşlem Uzmanı'} />
            <TextInput label="Kime" value={L.recipient} onChange={set('recipient')} placeholder="İnsan Kaynakları Departmanı" />
            <TextInput label="Şehir" value={L.city} onChange={set('city')} placeholder="İstanbul" />
            <TextInput label="Tarih" type="date" value={L.date} onChange={set('date')} hint="Boş bırakırsan bugünün tarihi yazılır." />
            <TextInput label="Hitap" value={L.greeting} onChange={set('greeting')} placeholder={cv.lang === 'tr' ? 'Sayın Yetkili,' : 'Dear Hiring Manager,'} />
          </div>
        </div>
      </section>

      <section className="card open">
        <div className="card-body">
          <span className="field-label">Başlangıç metni</span>
          <div className="starters">
            {LETTER_STARTERS.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`starter${pending === s.id ? ' on' : ''}`}
                onClick={() => (L.body.trim() ? setPending(s.id) : apply(s.id))}
              >
                <strong>{s.name}</strong>
                <span>{s.description}</span>
              </button>
            ))}
          </div>
          {pending && (
            <p className="note warn">
              <Icon name="alert" size={14} /> Mevcut metnin yerine geçecek.
              <button type="button" className="link-btn" onClick={() => apply(pending)}>
                Değiştir
              </button>
              <button type="button" className="link-btn" onClick={() => setPending(null)}>
                Vazgeç
              </button>
            </p>
          )}
          <TextArea
            label="Mektup metni"
            value={L.body}
            onChange={set('body')}
            placeholder="Paragrafları boş bir satırla ayır."
            hint="Paragrafları boş satırla ayır. **kalın** ve *italik* kullanabilirsin."
            counter={{ min: 900, max: 2200 }}
          />
          {placeholders > 0 && (
            <p className="note warn">
              <Icon name="alert" size={14} /> Metinde doldurulmamış {placeholders} yer var ([köşeli parantez]). İndirmeden önce tamamla.
            </p>
          )}
          <TextInput label="Kapanış" value={L.closing} onChange={set('closing')} placeholder={cv.lang === 'tr' ? 'Saygılarımla,' : 'Sincerely,'} />
        </div>
      </section>

      <div className="row-actions">
        <button className="btn primary" onClick={onPdf} disabled={busy}>
          <Icon name="download" /> Ön yazıyı PDF indir
        </button>
        <button className="btn ghost" onClick={onDocx} disabled={busy}>
          <Icon name="file" /> Word (.docx) indir
        </button>
      </div>
    </div>
  );
}
