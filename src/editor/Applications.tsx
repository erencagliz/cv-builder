import { useEffect, useMemo, useState } from 'react';
import { uiLocale } from '../i18n';
import { listApplications, saveApplication, deleteApplication, newApplication, listCVs, type ApplicationRow, type AppStatus, type CVRow } from '../store/db';
import { Icon } from '../ui/fields';
import { downloadBlob, navigate, useToast } from '../ui/app';

export const STATUS: { id: AppStatus; label: string }[] = [
  { id: 'saved', label: 'Kaydedildi' },
  { id: 'applied', label: 'Başvuruldu' },
  { id: 'interview', label: 'Görüşme' },
  { id: 'offer', label: 'Teklif' },
  { id: 'rejected', label: 'Olumsuz' },
];
const statusLabel = (s: AppStatus) => STATUS.find((x) => x.id === s)?.label ?? s;
const today = () => new Date().toISOString().slice(0, 10);
const fmtDate = (d: string) => (d ? new Date(d + 'T00:00').toLocaleDateString(uiLocale(), { day: 'numeric', month: 'short', year: 'numeric' }) : '');

/** İlan metninden pozisyon ve şirket adını tahmin eder (yalnızca öneri, kullanıcı değiştirebilir) */
export function guessFromPosting(ad: string): { position: string; company: string } {
  const lines = ad
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const company =
    /(?:şirket|firma|company|kurum)\s*[:：]\s*(.+)/i.exec(ad)?.[1]?.trim() ??
    lines.find((l) => /\b(A\.?Ş\.?|Ltd\.?|Şti\.?|Inc\.?|LLC|GmbH|Holding|Teknoloji|Group)\b/i.test(l) && l.length < 80) ??
    '';
  const position = lines.find((l) => l.length >= 3 && l.length <= 70 && !/[.:!?]$/.test(l) && l !== company) ?? '';
  return { position: position.replace(/^(pozisyon|position|ilan)\s*[:：]\s*/i, ''), company: company.slice(0, 80) };
}

export function Applications({ currentCvId, onClose }: { currentCvId: string; onClose: () => void }) {
  const [rows, setRows] = useState<ApplicationRow[] | null>(null);
  const [cvs, setCvs] = useState<CVRow[]>([]);
  const [filter, setFilter] = useState<AppStatus | 'all'>('all');
  const [editId, setEditId] = useState<number | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const toast = useToast();
  const refresh = () => listApplications().then(setRows);
  useEffect(() => {
    refresh();
    listCVs().then(setCvs);
  }, []);
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: rows?.length ?? 0 };
    for (const r of rows ?? []) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [rows]);
  const shown = (rows ?? []).filter((r) => filter === 'all' || r.status === filter);
  const due = (rows ?? []).filter((r) => r.nextDate && r.nextDate <= today() && r.status !== 'rejected' && r.status !== 'offer').length;

  const patch = async (r: ApplicationRow, p: Partial<ApplicationRow>) => {
    const next = { ...r, ...p };
    setRows((all) => (all ?? []).map((x) => (x.id === r.id ? next : x)));
    await saveApplication(next);
  };
  const add = async () => {
    const id = await saveApplication(newApplication({ cvId: currentCvId }));
    await refresh();
    setEditId(id);
    setFilter('all');
  };
  const exportCsv = () => {
    const head = ['Şirket', 'Pozisyon', 'Durum', 'Başvuru tarihi', 'Takip tarihi', 'CV', 'Bağlantı', 'Notlar'];
    const q = (v: string) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const body = (rows ?? []).map((r) => [r.company, r.position, statusLabel(r.status), r.appliedAt, r.nextDate, cvs.find((c) => c.id === r.cvId)?.name ?? '', r.url, r.notes].map(q).join(';'));
    downloadBlob(new Blob(['﻿' + [head.map(q).join(';'), ...body].join('\r\n')], { type: 'text/csv;charset=utf-8' }), 'basvurular.csv');
  };

  return (
    <div className="drawer-back" onClick={onClose}>
      <aside className="drawer wide" role="dialog" aria-modal="true" aria-label="Başvurularım" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <h2>Başvurularım</h2>
          <button className="icon-btn" aria-label="Kapat" onClick={onClose}>
            <Icon name="x" />
          </button>
        </div>
        <div className="drawer-body">
          <p className="muted small">Hangi şirkete hangi CV ile başvurduğunu ve süreç nerede, takip et. Kayıtlar yalnızca bu tarayıcıda tutulur.</p>
          <div className="app-toolbar">
            <div className="app-filters" role="group" aria-label="Duruma göre süz">
              <button className={filter === 'all' ? 'on' : ''} onClick={() => setFilter('all')}>
                Tümü <b>{counts.all}</b>
              </button>
              {STATUS.map((s) => (
                <button key={s.id} className={`st-${s.id}${filter === s.id ? ' on' : ''}`} onClick={() => setFilter(s.id)}>
                  {s.label} <b>{counts[s.id] ?? 0}</b>
                </button>
              ))}
            </div>
            <div className="row-actions">
              {!!rows?.length && (
                <button className="btn ghost sm" onClick={exportCsv} title="Excel’de açılabilir">
                  <Icon name="download" /> CSV
                </button>
              )}
              <button className="btn primary sm" onClick={add}>
                <Icon name="plus" /> Başvuru ekle
              </button>
            </div>
          </div>
          {due > 0 && (
            <p className="note info">
              <Icon name="info" size={14} /> {`${due} başvurunun takip tarihi geldi.`}
            </p>
          )}
          {rows && !rows.length && (
            <div className="empty">
              <Icon name="briefcase" size={28} />
              <p>Henüz başvuru yok. “Başvuru ekle” ile ya da “İlana uygunluk” ekranındaki “Başvurdum” düğmesiyle kaydedebilirsin.</p>
            </div>
          )}
          <ul className="app-list">
            {shown.map((r) => {
              const editing = editId === r.id;
              const cvName = cvs.find((c) => c.id === r.cvId)?.name;
              const overdue = r.nextDate && r.nextDate <= today() && r.status !== 'rejected' && r.status !== 'offer';
              return (
                <li key={r.id} className={`app st-${r.status}${editing ? ' editing' : ''}`} data-app={r.id}>
                  <div className="app-head">
                    <button className="app-title" onClick={() => setEditId(editing ? null : r.id!)} aria-expanded={editing}>
                      <strong>{r.position || 'Pozisyon girilmedi'}</strong>
                      <span>{r.company || 'Şirket girilmedi'}</span>
                    </button>
                    <select className="input sm app-status" aria-label="Durum" value={r.status} onChange={(e) => patch(r, { status: e.target.value as AppStatus })}>
                      {STATUS.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="app-meta">
                    {r.appliedAt && <span>{`Başvuru: ${fmtDate(r.appliedAt)}`}</span>}
                    {r.nextDate && <span className={overdue ? 'due' : ''}>{`Takip: ${fmtDate(r.nextDate)}`}</span>}
                    {cvName && (
                      <button
                        className="link-btn"
                        onClick={() => {
                          onClose();
                          navigate(`/duzenle/${r.cvId}`);
                        }}
                      >
                        {`CV: ${cvName}`}
                      </button>
                    )}
                    {r.url && (
                      <a href={r.url} target="_blank" rel="noopener noreferrer">
                        İlan
                      </a>
                    )}
                  </div>
                  {editing && (
                    <div className="app-form grid">
                      <label className="field">
                        <span className="field-label">Pozisyon</span>
                        <input className="input" value={r.position} onChange={(e) => patch(r, { position: e.target.value })} autoFocus />
                      </label>
                      <label className="field">
                        <span className="field-label">Şirket</span>
                        <input className="input" value={r.company} onChange={(e) => patch(r, { company: e.target.value })} />
                      </label>
                      <label className="field">
                        <span className="field-label">Başvuru tarihi</span>
                        <input className="input" type="date" value={r.appliedAt} onChange={(e) => patch(r, { appliedAt: e.target.value })} />
                      </label>
                      <label className="field">
                        <span className="field-label">Takip tarihi</span>
                        <input className="input" type="date" value={r.nextDate} onChange={(e) => patch(r, { nextDate: e.target.value })} />
                      </label>
                      <label className="field">
                        <span className="field-label">Kullanılan CV</span>
                        <select className="input" value={r.cvId} onChange={(e) => patch(r, { cvId: e.target.value })}>
                          <option value="">Seçilmedi</option>
                          {cvs.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="field">
                        <span className="field-label">İlan bağlantısı</span>
                        <input className="input" type="url" value={r.url} placeholder="https://" onChange={(e) => patch(r, { url: e.target.value.trim() })} />
                      </label>
                      <label className="field wide">
                        <span className="field-label">Notlar</span>
                        <textarea className="input" rows={3} value={r.notes} placeholder="Görüşen kişi, maaş beklentisi, sorulan sorular…" onChange={(e) => patch(r, { notes: e.target.value })} />
                      </label>
                      <div className="wide row-between">
                        {confirmId === r.id ? (
                          <span className="confirm">
                            Silinsin mi?
                            <button
                              className="btn danger sm"
                              onClick={async () => {
                                await deleteApplication(r.id!);
                                setConfirmId(null);
                                setEditId(null);
                                refresh();
                                toast('Başvuru silindi.');
                              }}
                            >
                              Sil
                            </button>
                            <button className="btn ghost sm" onClick={() => setConfirmId(null)}>
                              Vazgeç
                            </button>
                          </span>
                        ) : (
                          <button className="btn ghost sm" onClick={() => setConfirmId(r.id!)}>
                            <Icon name="trash" /> Sil
                          </button>
                        )}
                        <button className="btn ghost sm" onClick={() => setEditId(null)}>
                          Tamam
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </aside>
    </div>
  );
}
