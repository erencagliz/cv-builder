import { useEffect, useMemo, useRef, useState } from 'react';
import type { CV } from '../model/types';
import { buildModel } from '../render/buildModel';
import { renderPdf, dataUrlToBytes } from '../render/client';
import { toPlainText } from '../render/plainText';
import { extractPdfText } from '../ats/pdfText';
import type { Check } from '../ats/quality';
import { buildReport, potentialGain, type Report, type Finding, type BulletScore, type Target } from '../ats/report';
import { useFocus } from '../store/focus';
import { uiLocale } from '../i18n';
import { saveApplication, newApplication } from '../store/db';
import { guessFromPosting } from './Applications';
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

/* ======================= ATS ve CV analizi ======================= */
function useAddSkill() {
  const update = useEditor((s) => s.update);
  const toast = useToast();
  return (term: string) => {
    update((d) => {
      let g = d.sections.skills.find((k) => String(k.name ?? '') === 'Diğer');
      if (!g) {
        d.sections.skills.push(newEntry({ name: 'Diğer', items: [] }) as never);
        g = d.sections.skills[d.sections.skills.length - 1];
      }
      const items = (g.items as string[]) ?? [];
      if (!items.includes(term)) g.items = [...items, term];
      if (!d.order.includes('skills')) d.order.push('skills');
      d.hidden = d.hidden.filter((h) => h !== 'skills');
    });
    toast(`“${term}” Yetenekler → Diğer grubuna eklendi.`);
  };
}

const tone = (v: number) => (v >= 80 ? 'good' : v >= 60 ? 'mid' : 'low');

function GoButton({ target, label = 'Düzelt' }: { target?: Target; label?: string }) {
  const go = useFocus((s) => s.go);
  if (!target) return null;
  return (
    <button type="button" className="btn ghost xs go-btn" onClick={() => go(target.section, target.entryId)}>
      {label} <Icon name="arrow" size={12} />
    </button>
  );
}

function FindingRow({ f, gain, addSkill }: { f: Finding; gain?: number; addSkill: (t: string) => void }) {
  const [all, setAll] = useState(false);
  const items = f.items ?? [];
  const kwMode = items.length > 0 && items.every((i) => !i.where && !i.note && !i.target);
  const shown = all ? items : items.slice(0, kwMode ? 14 : 4);
  return (
    <li className={`chk ${f.level}`}>
      <span className="chk-ic">
        <Icon name={LEVEL_ICON[f.level]} size={14} />
      </span>
      <div className="chk-body">
        <div className="chk-top">
          <div className="chk-title">{f.title}</div>
          {gain ? <span className="gain">+{gain} puan</span> : null}
          <GoButton target={f.target} />
        </div>
        {f.detail && <div className="chk-detail">{f.detail}</div>}
        {items.length > 0 &&
          (kwMode ? (
            <div className="kw-list sm">
              {shown.map((it) => (
                <span key={it.text} className="kw missing">
                  {it.text}
                  {it.keyword && (
                    <button type="button" title="Yeteneklere ekle" aria-label={`${it.text} yeteneklere ekle`} onClick={() => addSkill(it.keyword!)}>
                      <Icon name="plus" size={12} />
                    </button>
                  )}
                </span>
              ))}
            </div>
          ) : (
            <ul className="chk-items">
              {shown.map((it, i) => (
                <li key={i}>
                  <div>
                    <span className="it-text">{it.text}</span>
                    {it.where && <span className="it-where">{it.where}</span>}
                    {it.note && <span className="it-note">{it.note}</span>}
                  </div>
                  <GoButton target={it.target} label="Git" />
                </li>
              ))}
            </ul>
          ))}
        {items.length > shown.length && (
          <button type="button" className="link-btn" onClick={() => setAll(true)}>
            {`${items.length - shown.length} tane daha göster`}
          </button>
        )}
      </div>
    </li>
  );
}

const VERB_LABEL: Record<BulletScore['verb'], string> = {
  strong: 'Güçlü fiil',
  active: 'Eylem var',
  nominal: 'İsim cümlesi',
  gerund: 'Fiil zayıf',
  passive: 'Edilgen',
  weak: 'Pasif kalıp',
  none: 'Eylem yok',
};

function BulletsTab({ r }: { r: Report }) {
  const [order, setOrder] = useState<'weak' | 'cv'>('weak');
  if (!r.bullets.length) return <p className="muted">Deneyim, proje veya gönüllülük bölümlerinde madde yok. Maddeler eklendikçe her biri burada 0-100 arası puanlanır.</p>;
  const list = order === 'weak' ? [...r.bullets].sort((a, b) => a.score - b.score) : r.bullets;
  return (
    <>
      <div className="bullet-summary">
        <div>
          <strong>{r.stats.avgBullet}</strong>
          <span>ortalama puan</span>
        </div>
        <div>
          <strong>{Math.round(r.stats.metricRatio * 100)}%</strong>
          <span>ölçü içeriyor</span>
        </div>
        <div>
          <strong>{r.bullets.filter((b) => b.verb === 'strong' || b.verb === 'active').length}</strong>
          <span>eylemle anlatılmış</span>
        </div>
        <div>
          <strong>{r.bullets.filter((b) => b.score < 60).length}</strong>
          <span>geliştirilmeli</span>
        </div>
      </div>
      <p className="muted small">
        Her madde 100 üzerinden puanlanır: güçlü eylem (25) · ölçülebilir sonuç (30) · sonucun etkisi (15) · uygun uzunluk (15) · belirsiz/klişe ifade olmaması (15). İyi madde formülü:{' '}
        <em>{r.stats.bullets ? 'ne yaptın + nasıl + ölçülebilir sonuç' : ''}</em> — ör. “PowerShell betikleriyle yazılım dağıtımını otomatikleştirerek destek taleplerini %35 azalttım.”
      </p>
      <div className="seg-row">
        <div className="segmented sm" role="group" aria-label="Sıralama">
          <button type="button" className={order === 'weak' ? 'on' : ''} onClick={() => setOrder('weak')}>
            Önce zayıflar
          </button>
          <button type="button" className={order === 'cv' ? 'on' : ''} onClick={() => setOrder('cv')}>
            CV sırası
          </button>
        </div>
      </div>
      <ul className="bullet-list">
        {list.map((b, i) => (
          <li key={i} className={`bl ${tone(b.score)}`}>
            <span className="bl-score" title="Madde puanı">
              {b.score}
            </span>
            <div className="bl-body">
              <div className="bl-text">{b.text}</div>
              <div className="bl-meta">
                <span className="it-where">{b.where}</span>
                <span className={`tag ${b.verb === 'strong' || b.verb === 'active' ? 'yes' : 'no'}`}>{VERB_LABEL[b.verb]}</span>
                <span className={`tag ${b.metric ? 'yes' : 'no'}`}>{b.metric ? 'Ölçü var' : 'Ölçü yok'}</span>
                <span className={`tag ${b.result ? 'yes' : 'no'}`}>{b.result ? 'Sonuç var' : 'Sonuç yok'}</span>
                <span className="tag">{b.words} kelime</span>
              </div>
              {b.tips.length > 0 && (
                <ul className="bl-tips">
                  {b.tips.slice(0, 3).map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              )}
            </div>
            <GoButton target={b.target} />
          </li>
        ))}
      </ul>
    </>
  );
}

export function AtsView({ cv }: { cv: CV }) {
  const [state, setState] = useState<{ text: string; report: Report } | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [sub, setSub] = useState<'fixes' | 'bullets' | 'text'>('fixes');
  const toast = useToast();
  const addSkill = useAddSkill();
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
        const report = buildReport({ cv, model, text: ext.text, pages: ext.pages, plainText: toPlainText(model) });
        setState({ text: ext.text, report });
        setError('');
      } catch (e) {
        if (id === run.current) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (id === run.current) setBusy(false);
      }
    }, 600);
    return () => clearTimeout(t);
  }, [cv]);

  if (!state)
    return (
      <div className="insight">
        <p className="muted">{error || 'PDF oluşturulup bir ATS gibi okunuyor, CV’n 40’tan fazla kurala göre puanlanıyor…'}</p>
      </div>
    );
  const r = state.report;
  const years = r.stats.months / 12;
  return (
    <div className={`insight${busy ? ' busy' : ''}`} data-testid="ats-report">
      <div className="insight-head">
        <ScoreRing value={r.score} label="/ 100" />
        <div className="head-text">
          <div className="grade-row">
            <span className={`grade g-${r.grade}`} aria-label={`Not ${r.grade}`}>
              {r.grade}
            </span>
            <h3>{r.verdict}</h3>
          </div>
          <p className="muted">
            {[`${r.stats.pages} sayfa`, `${r.stats.words} kelime`, `${r.stats.bullets} madde`, r.stats.months > 0 ? `~${years.toLocaleString(uiLocale(), { maximumFractionDigits: 1 })} yıl deneyim` : '', r.role ? `Rol: ${r.role.name}` : '']
              .filter(Boolean)
              .map((x, i) => (
                <span key={i} className="stat-part">
                  {x}
                </span>
              ))}
          </p>
        </div>
      </div>

      <section className="cat-grid" aria-label="Kategori puanları">
        {r.categories.map((c) => (
          <div key={c.id} className={`cat ${tone(c.score)}`} title={c.desc}>
            <div className="cat-top">
              <span>{c.label}</span>
              <strong>{c.score}</strong>
            </div>
            <div className="cat-bar">
              <span style={{ width: `${c.score}%` }} />
            </div>
            <div className="cat-w">{`Ağırlık %${Math.round(c.weight * 100)}`}</div>
          </div>
        ))}
      </section>

      <div className="segmented sub-tabs" role="tablist" aria-label="Analiz">
        <button role="tab" aria-selected={sub === 'fixes'} className={sub === 'fixes' ? 'on' : ''} onClick={() => setSub('fixes')}>
          Öneriler
        </button>
        <button role="tab" aria-selected={sub === 'bullets'} className={sub === 'bullets' ? 'on' : ''} onClick={() => setSub('bullets')}>
          {`Maddeler (${r.bullets.length})`}
        </button>
        <button role="tab" aria-selected={sub === 'text'} className={sub === 'text' ? 'on' : ''} onClick={() => setSub('text')}>
          ATS’nin gördüğü metin
        </button>
      </div>

      {sub === 'fixes' && (
        <>
          {r.fixes.length > 0 && (
            <section className="fixes">
              <h4>Önce bunları düzelt</h4>
              <p className="muted small">{`Puanına en çok etki eden ${r.fixes.length} konu, kazandıracağı puana göre sıralı.`}</p>
              <ul className="checks">
                {r.fixes.map((f) => (
                  <FindingRow key={f.id} f={f} gain={potentialGain(r, f)} addSkill={addSkill} />
                ))}
              </ul>
            </section>
          )}
          {r.categories.map((c) => {
            const fs = r.findings.filter((f) => f.cat === c.id);
            const open = fs.filter((f) => f.level !== 'ok');
            const passed = fs.filter((f) => f.level === 'ok');
            if (!fs.length) return null;
            return (
              <section key={c.id} data-cat={c.id}>
                <div className="row-between">
                  <h4>{c.label}</h4>
                  <span className={`cat-pill ${tone(c.score)}`}>{c.score} / 100</span>
                </div>
                <p className="muted small cat-desc">{c.desc}</p>
                {open.length > 0 && (
                  <ul className="checks">
                    {open.map((f) => (
                      <FindingRow key={f.id} f={f} addSkill={addSkill} />
                    ))}
                  </ul>
                )}
                {passed.length > 0 && (
                  <details className="passed" open={!open.length}>
                    <summary>{`${passed.length} kontrol geçti`}</summary>
                    <ul className="checks">
                      {passed.map((f) => (
                        <FindingRow key={f.id} f={f} addSkill={addSkill} />
                      ))}
                    </ul>
                  </details>
                )}
              </section>
            );
          })}
          <p className="muted small">
            Bu analiz indirdiğin PDF’in metnini bir ATS gibi geri okur ve CV’ni işe alım uzmanlarının kullandığı ölçütlerle puanlar. Tamamen tarayıcında çalışır; hiçbir veri gönderilmez. Gerçek ATS’ler
            farklı ayrıştırıcılar kullanır; puan yol göstericidir.
          </p>
        </>
      )}

      {sub === 'bullets' && (
        <section>
          <BulletsTab r={r} />
        </section>
      )}

      {sub === 'text' && (
        <section>
          <div className="row-between">
            <h4>ATS’nin gördüğü metin</h4>
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
          <p className="muted small">ATS’ler PDF’ini bu sırayla okur. Kariyer sitelerindeki “CV’ni yapıştır” kutuları da bu metni kullanır.</p>
          <pre className="ats-text">{state.text}</pre>
        </section>
      )}
    </div>
  );
}

/* ======================= İlan eşleştirme ======================= */
export function JobMatchView({ cv }: { cv: CV }) {
  const update = useEditor((s) => s.update);
  const toast = useToast();
  const openDrawer = useFocus((s) => s.openDrawer);
  const cvText = useMemo(() => toPlainText(buildModel(cv)), [cv]);
  const result = useMemo(() => (cv.jobPosting.trim().length > 40 ? matchJob(cv.jobPosting, cvText, cv) : null), [cv, cvText]);

  const addSkill = useAddSkill();

  return (
    <div className="insight">
      <div className="job-input">
        <label className="field-label" htmlFor="job-ad">
          Başvurduğun ilanın metnini yapıştır
        </label>
        <AutoTextarea id="job-ad" value={cv.jobPosting} onChange={(v) => update((d) => void (d.jobPosting = v), 'job')} placeholder="İlan başlığı, aranan nitelikler, iş tanımı…" minRows={6} />
        <div className="row-between">
          <p className="field-hint">İlan metni yalnızca bu tarayıcıda, bu CV ile birlikte saklanır.</p>
          {cv.jobPosting.trim().length > 40 && (
            <button
              type="button"
              className="btn ghost sm"
              onClick={async () => {
                const g = guessFromPosting(cv.jobPosting);
                await saveApplication(newApplication({ cvId: cv.id, posting: cv.jobPosting, position: g.position, company: g.company }));
                toast('Başvurularına eklendi.');
                openDrawer('apps');
              }}
            >
              <Icon name="briefcase" /> Başvurdum, kaydet
            </button>
          )}
        </div>
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
                {`${result.keywords.filter((k) => k.found).length} / ${result.keywords.length} anahtar kelime CV’nde geçiyor.`} Eksik olanlardan gerçekten bildiklerini CV’ne ekle; bilmediğin bir şeyi yazmak
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
