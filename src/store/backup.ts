import { uiLang } from '../i18n';
import { db, listCVs } from './db';
import { normalizeCV, uid } from '../model/defaults';
import type { CV } from '../model/types';

export const BACKUP_FORMAT = 'cv-builder-backup';

export async function buildBackup(): Promise<string> {
  const cvs = (await listCVs()).map((r) => r.data);
  let applications: unknown[] = [];
  try {
    applications = await db.table('applications').toArray();
  } catch {
  }
  return JSON.stringify({ format: BACKUP_FORMAT, version: 1, exportedAt: new Date().toISOString(), cvs, applications });
}

export async function downloadBackup() {
  const blob = new Blob([await buildBackup()], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `CV-Builder-${uiLang() === 'tr' ? 'yedek' : 'backup'}-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

export async function restoreBackup(data: { cvs?: unknown[]; applications?: unknown[] }): Promise<{ cvs: CV[]; applications: number }> {
  const existing = new Set((await db.cvs.toCollection().primaryKeys()) as string[]);
  const out: CV[] = [];
  const idMap = new Map<string, string>();
  for (const raw of data.cvs ?? []) {
    const cv = normalizeCV(raw as CV);
    if (existing.has(cv.id)) {
      const nid = uid();
      idMap.set(cv.id, nid);
      cv.id = nid;
    }
    await db.cvs.put({ id: cv.id, name: cv.name, updatedAt: cv.updatedAt, data: cv });
    out.push(cv);
  }
  let apps = 0;
  try {
    const t = db.table('applications');
    for (const a of (data.applications ?? []) as Record<string, unknown>[]) {
      const { id: _drop, ...rest } = a;
      void _drop;
      if (typeof rest.cvId === 'string' && idMap.has(rest.cvId)) rest.cvId = idMap.get(rest.cvId);
      await t.add(rest);
      apps++;
    }
  } catch {
  }
  return { cvs: out, applications: apps };
}
