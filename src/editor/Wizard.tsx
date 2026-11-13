import { useState } from 'react';
import type { CV, SectionKey } from '../model/types';
import { useEditor } from '../store/editor';
import { HeaderCard, SectionCard } from './ContentPanel';
import { DesignPanel } from './DesignPanel';
import { Icon } from '../ui/fields';
import { newEntry, uid } from '../model/defaults';

interface Step {
  id: string;
  title: string;
  lead: string;
  sections: SectionKey[];
  header?: boolean;
  design?: boolean;
}

const STEPS: Step[] = [
  {
    id: 'profile',
    title: 'Profil',
    lead: 'Adın, iletişim bilgilerin, bağlantıların ve kısa bir özet. Fotoğraf eklemek istersen burada.',
    sections: ['summary', 'personal'],
    header: true,
  },
  {
    id: 'experience',
    title: 'Deneyim',
    lead: 'Çalıştığın yerler, en yeniden eskiye. Her işin altına yaptığın 2-4 somut şeyi madde olarak yaz.',
    sections: ['experience', 'volunteer'],
  },
  {
    id: 'education',
    title: 'Eğitim',
    lead: 'Okulların, aldığın kurslar ve sertifikaların.',
    sections: ['education', 'certificates', 'courses'],
  },
  {
    id: 'skills',
    title: 'Beceriler ve diller',
    lead: 'Yeteneklerini gruplara ayır (ör. Sistem, Ağ, Yazılım). İlandaki anahtar kelimeleri burada kullan.',
    sections: ['skills', 'languages'],
  },
  {
    id: 'more',
    title: 'Projeler ve diğerleri',
    lead: 'Projeler, ödüller, yayınlar, üyelikler, ilgi alanları ve referanslar. Boş bıraktığın bölümler CV’de görünmez.',
    sections: ['projects', 'awards', 'publications', 'talks', 'memberships', 'hobbies', 'references'],
  },
  {
    id: 'design',
    title: 'Görünüm',
    lead: 'Şablon, renk, yazı tipi, boyutlar, ikonlar ve fotoğraf. Her değişiklik sağdaki önizlemeye anında yansır.',
    sections: [],
    design: true,
  },
];

function stepFilled(cv: CV, st: Step): boolean {
  if (st.design) return false;
  if (st.header) return !!(cv.personal.firstName && (cv.personal.email || cv.personal.phone));
  return st.sections.some((k) => {
    if (k === 'summary') return !!cv.summary.trim();
    if (k === 'hobbies') return !!cv.hobbies.trim();
    if (k === 'references') return cv.references.onRequest || cv.references.items.length > 0;
    if (k === 'personal') return false;
    return (cv.sections[k as keyof CV['sections']]?.length ?? 0) > 0;
  });
}

export function Wizard({ cv, onDownload }: { cv: CV; onDownload: () => void }) {
  const update = useEditor((s) => s.update);
  const [step, setStep] = useState(0);
  const [open, setOpen] = useState<Record<string, boolean>>({ header: true, experience: true, education: true, skills: true });
  const st = STEPS[step];
  const go = (i: number) => {
    setStep(i);
    document.querySelector('.panel-scroll')?.scrollTo({ top: 0 });
  };
  const customKeys = cv.order.filter((k) => k.startsWith('custom:'));
  const keys: SectionKey[] = st.id === 'more' ? [...st.sections, ...customKeys] : st.sections;

  return (
    <div className="wizard">
      <ol className="steps" aria-label="Adımlar">
        {STEPS.map((s, i) => (
          <li key={s.id}>
            <button type="button" className={`step${i === step ? ' on' : ''}${stepFilled(cv, s) ? ' done' : ''}`} aria-current={i === step ? 'step' : undefined} onClick={() => go(i)}>
              <span className="step-num">{stepFilled(cv, s) && i !== step ? <Icon name="check" size={12} /> : i + 1}</span>
              <span className="step-title">{s.title}</span>
            </button>
          </li>
        ))}
      </ol>
      <div className="step-progress" aria-hidden>
        <span style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
      </div>

      <header className="step-head">
        <p className="eyebrow">
          {`${STEPS.length} adımın ${step + 1}. adımı`}
        </p>
        <h2>{st.title}</h2>
        <p className="step-lead">{st.lead}</p>
      </header>

      <div className="content-panel">
        {st.header && <HeaderCard cv={cv} update={update} open={!!open.header} onToggle={() => setOpen((o) => ({ ...o, header: !o.header }))} />}
        {keys.map((k) => (
          <SectionCard key={k} cv={cv} sectionKey={k} update={update} open={!!open[k]} onToggle={() => setOpen((o) => ({ ...o, [k]: !o[k] }))} />
        ))}
        {st.id === 'more' && (
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
            <Icon name="plus" /> Kendi bölümünü ekle
          </button>
        )}
        {st.design && <DesignPanel cv={cv} />}
      </div>

      <nav className="step-nav">
        <button type="button" className="btn ghost" disabled={step === 0} onClick={() => go(step - 1)}>
          <Icon name="back" /> Geri
        </button>
        {step < STEPS.length - 1 ? (
          <button type="button" className="btn primary" onClick={() => go(step + 1)}>
            Sonraki: {STEPS[step + 1].title} <Icon name="chevron" />
          </button>
        ) : (
          <button type="button" className="btn primary" onClick={onDownload}>
            <Icon name="download" /> PDF’i indir
          </button>
        )}
      </nav>
    </div>
  );
}
