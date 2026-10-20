import { useEffect, useMemo, useRef, useState } from 'react';
import type { CV } from '../model/types';
import { buildModel } from '../render/buildModel';
import { renderPdf, dataUrlToBytes } from '../render/client';
import { toPlainText } from '../render/plainText';
import { extractPdfText } from '../ats/pdfText';
import { atsChecks } from '../ats/analyze';
import { qualityChecks, score, type Check } from '../ats/quality';
import { matchJob } from '../ats/keywords';
import { useEditor } from '../store/editor';
import { newEntry } from '../model/defaults';
import { Icon, AutoTextarea } from '../ui/fields';
import { useToast } from '../ui/app';

const LEVEL_ICON: Record<Check['level'], string> = { ok: 'check', warn: 'alert', error: 'x', info: 'info' };

function CheckList({ items }: { items: Check[] }) {
  return (
    <ul className="checks">
      {items.map((c) => (
        <li key={c.id} className={`chk ${c.level}`}>
          <span className="chk-ic">
            <Icon name={LEVEL_ICON[c.level]} size={14} />
          </span>
          <div>
            <div className="chk-title">{c.title}</div>
            {c.detail && <div className="chk-detail">{c.detail}</div>}
          </div>
        </li>
      ))}
    </ul>
  );
}

function ScoreRing({ value, label }: { value: number; label: string }) {
  const r = 30;
  const c = 2 * Math.PI * r;
  const tone = value >= 85 ? 'good' : value >= 65 ? 'mid' : 'low';
  return (
    <div className={`score ${tone}`}>
      <svg width="76" height="76" viewBox="0 0 76 76" aria-hidden>
        <circle cx="38" cy="38" r={r} className="score-track" />
        <circle cx="38" cy="38" r={r} className="score-bar" strokeDasharray={`${(value / 100) * c} ${c}`} transform="rotate(-90 38 38)" />
      </svg>
      <div className="score-num">
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

/* ======================= ATS kontrolü ======================= */
export function AtsView({ cv }: { cv: CV }) {
  const [state, setState] = useState<{ text: string; ats: Check[]; quality: Check[]; pages: number } | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [showText, setShowText] = useState(false);
  const toast = useToast();
  const run = useRef(0);

  useEffect(() => {
    const id = ++run.current;
    setBusy(true);
    const t = setTimeout(async () => {
      try {
        const model = buildModel(cv);
        const res = await renderPdf(model, dataUrlToBytes(cv.personal.photo));
        if (!res.pdf) throw new Error(res.diagnostics[0] ?? 'PDF oluşturulamadı');
        const ext = await extractPdfText(res.pdf);
        if (id !== run.current) return;
        setState({ text: ext.text, ats: atsChecks(ext.text, cv, model), quality: qualityChecks(cv, ext.pages), pages: ext.pages });
        setError('');
      } catch (e) {
        if (id === run.current) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (id === run.current) setBusy(false);
      }
    }, 700);
    return () => clearTimeout(t);
  }, [cv]);

  if (!state)
    return (
      <div className="insight">
        <p className="muted">{error || 'PDF oluşturulup ATS gibi okunuyor…'}</p>
      </div>
    );
  const all = [...state.ats, ...state.quality];
  const sc = score(all);
  const problems = all.filter((c) => c.level === 'error' || c.level === 'warn').length;
  return (
    <div className={`insight${busy ? ' busy' : ''}`}>
      <div className="insight-head">
        <ScoreRing value={sc} label="/ 100" />
        <div>
          <h3>{sc >= 85 ? 'ATS için hazır görünüyor' : sc >= 65 ? 'İyi, birkaç düzeltmeyle daha iyi' : 'Düzeltilmesi gereken noktalar var'}</h3>
          <p className="muted">
            {problems ? `${problems} öneri var.` : 'Kritik bir sorun bulunmadı.'} Bu kontrol, indirdiğin PDF’in metnini bir ATS’nin yaptığı gibi okur. Gerçek sistemler farklı ayrıştırıcılar kullanır; puan yol göstericidir.
          </p>
        </div>
      </div>

      <section>
        <h4>ATS okuma testi</h4>
        <CheckList items={state.ats} />
      </section>
      <section>
        <h4>CV kontrolü</h4>
        {state.quality.length ? <CheckList items={state.quality} /> : <p className="muted">Her şey yerinde görünüyor.</p>}
      </section>
      <section>
        <div className="row-between">
          <h4>ATS’nin gördüğü metin</h4>
          <div className="row-actions">
            <button className="btn ghost sm" onClick={() => setShowText(!showText)}>
              {showText ? 'Gizle' : 'Göster'}
            </button>
            <button
              className="btn ghost sm"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(state.text);
                  toast('Metin kopyalandı.');
                } catch {
                  toast('Kopyalanamadı.', 'error');
                }
              }}
            >
              <Icon name="copy" /> Kopyala
            </button>
          </div>
        </div>
        <p className="muted small">Kariyer sitelerindeki “CV’ni yapıştır” kutuları da bu metni kullanır.</p>
        {showText && <pre className="ats-text">{state.text}</pre>}
      </section>
    </div>
  );
}

/* ======================= İlan eşleştirme ======================= */
export function JobMatchView({ cv }: { cv: CV }) {
  const update = useEditor((s) => s.update);
  const toast = useToast();
  const cvText = useMemo(() => toPlainText(buildModel(cv)), [cv]);
  const result = useMemo(() => (cv.jobPosting.trim().length > 40 ? matchJob(cv.jobPosting, cvText, cv) : null), [cv, cvText]);

  const addSkill = (term: string) => {
    update((d) => {
      let g = d.sections.skills.find((k) => String(k.name ?? '') === 'Diğer');
      if (!g) {
        d.sections.skills.push(newEntry({ name: 'Diğer', items: [] }) as never);
        g = d.sections.skills[d.sections.skills.length - 1];
      }
      const items = (g.items as string[]) ?? [];
      if (!items.includes(term)) g.items = [...items, term];
    });
    toast(`“${term}” Yetenekler → Diğer grubuna eklendi.`);
  };

  return (
    <div className="insight">
      <div className="job-input">
        <label className="field-label" htmlFor="job-ad">
          Başvurduğun ilanın metnini yapıştır
        </label>
        <AutoTextarea id="job-ad" value={cv.jobPosting} onChange={(v) => update((d) => void (d.jobPosting = v), 'job')} placeholder="İlan başlığı, aranan nitelikler, iş tanımı…" minRows={6} />
        <p className="field-hint">İlan metni yalnızca bu tarayıcıda, bu CV ile birlikte saklanır.</p>
      </div>
      {!result ? (
        <p className="muted">İlanı yapıştırdığında hangi anahtar kelimelerin CV’nde geçtiğini, hangilerinin eksik olduğunu göreceksin.</p>
      ) : (
        <>
          <div className="insight-head">
            <ScoreRing value={result.score} label="% eşleşme" />
            <div>
              <h3>{result.score >= 75 ? 'İlanla güçlü eşleşme' : result.score >= 50 ? 'Orta düzey eşleşme' : 'Eşleşme düşük'}</h3>
              <p className="muted">
                {result.keywords.filter((k) => k.found).length} / {result.keywords.length} anahtar kelime CV’nde geçiyor. Eksik olanlardan gerçekten bildiklerini CV’ne ekle; bilmediğin bir şeyi yazmak
                mülakatta aleyhine olur.
              </p>
            </div>
          </div>
          {result.requirements.length > 0 && (
            <section>
              <h4>İlandaki şartlar</h4>
              <CheckList items={result.requirements.map((r, i) => ({ id: `req${i}`, level: r.level, title: r.text }))} />
            </section>
          )}
          <section>
            <h4>CV’nde eksik olanlar</h4>
            {result.keywords.filter((k) => !k.found).length === 0 ? (
              <p className="muted">İlandaki anahtar kelimelerin hepsi CV’nde geçiyor.</p>
            ) : (
              <div className="kw-list">
                {result.keywords
                  .filter((k) => !k.found)
                  .map((k) => (
                    <span key={k.key} className="kw missing">
                      {k.term}
                      {k.kind !== 'title' && (
                        <button type="button" title="Yeteneklere ekle" aria-label={`${k.term} yeteneklere ekle`} onClick={() => addSkill(k.term)}>
                          <Icon name="plus" size={12} />
                        </button>
                      )}
                    </span>
                  ))}
              </div>
            )}
            {result.keywords.some((k) => !k.found && k.kind === 'title') && (
              <p className="note info">
                <Icon name="info" size={14} /> İlandaki pozisyon adı CV’nde geçmiyor. Doğru bir karşılıksa unvanını ilandaki adla yazmayı düşün.
              </p>
            )}
          </section>
          <section>
            <h4>CV’nde geçenler</h4>
            <div className="kw-list">
              {result.keywords
                .filter((k) => k.found)
                .map((k) => (
                  <span key={k.key} className="kw found">
                    <Icon name="check" size={12} /> {k.term}
                  </span>
                ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
