import Dexie, { type Table } from 'dexie';
import type { CV } from '../model/types';
import { normalizeCV } from '../model/defaults';

export interface CVRow {
  id: string;
  name: string;
  updatedAt: number;
  data: CV;
}
export type AppStatus = 'saved' | 'applied' | 'interview' | 'offer' | 'rejected';
export interface ApplicationRow {
  id?: number;
  cvId: string;
  company: string;
  position: string;
  url: string;
  status: AppStatus;
  appliedAt: string; // YYYY-MM-DD
  nextDate: string; // takip tarihi
  notes: string;
  posting: string;
  createdAt: number;
  updatedAt: number;
}
export interface SnapshotRow {
  id?: number;
  cvId: string;
  at: number;
  data: CV;
}

class CVDatabase extends Dexie {
  cvs!: Table<CVRow, string>;
  snapshots!: Table<SnapshotRow, number>;
  applications!: Table<ApplicationRow, number>;
  constructor() {
    super('cv-builder');
    this.version(1).stores({ cvs: 'id, updatedAt', snapshots: '++id, cvId, at' });
    this.version(2).stores({ cvs: 'id, updatedAt', snapshots: '++id, cvId, at', applications: '++id, cvId, status, updatedAt' });
  }
}

export const db = new CVDatabase();

export async function listCVs(): Promise<CVRow[]> {
  return db.cvs.orderBy('updatedAt').reverse().toArray();
}
export async function getCV(id: string): Promise<CV | undefined> {
  const row = await db.cvs.get(id);
  return row ? normalizeCV(row.data) : undefined;
}
export async function saveCV(cv: CV): Promise<void> {
  await db.cvs.put({ id: cv.id, name: cv.name, updatedAt: cv.updatedAt, data: cv });
}
export async function deleteCV(id: string): Promise<void> {
  await db.transaction('rw', db.cvs, db.snapshots, async () => {
    await db.cvs.delete(id);
    await db.snapshots.where('cvId').equals(id).delete();
  });
}
/** Sürüm geçmişi: en fazla 10 dakikada bir, CV başına son 30 kayıt */
export async function maybeSnapshot(cv: CV): Promise<void> {
  const last = await db.snapshots.where('cvId').equals(cv.id).last();
  if (last && Date.now() - last.at < 10 * 60 * 1000) return;
  await db.snapshots.add({ cvId: cv.id, at: Date.now(), data: cv });
  const all = await db.snapshots.where('cvId').equals(cv.id).sortBy('at');
  if (all.length > 30) await db.snapshots.bulkDelete(all.slice(0, all.length - 30).map((s) => s.id!));
}
/** Depolama dolduğunda: her CV için yalnızca son 5 sürümü bırak */
export async function pruneSnapshots(): Promise<void> {
  const all = await db.snapshots.orderBy('at').toArray();
  const byCv = new Map<string, number[]>();
  for (const s of all) byCv.set(s.cvId, [...(byCv.get(s.cvId) ?? []), s.id!]);
  const drop: number[] = [];
  for (const ids of byCv.values()) drop.push(...ids.slice(0, Math.max(0, ids.length - 5)));
  if (drop.length) await db.snapshots.bulkDelete(drop);
}
export async function listSnapshots(cvId: string): Promise<SnapshotRow[]> {
  return (await db.snapshots.where('cvId').equals(cvId).sortBy('at')).reverse();
}
export async function wipeAll(): Promise<void> {
  await db.delete();
}

/* ---------------- başvurular ---------------- */
export const listApplications = () => db.applications.orderBy('updatedAt').reverse().toArray();
export async function saveApplication(a: ApplicationRow): Promise<number> {
  return db.applications.put({ ...a, updatedAt: Date.now() });
}
export const deleteApplication = (id: number) => db.applications.delete(id);
export function newApplication(p: Partial<ApplicationRow> = {}): ApplicationRow {
  const now = Date.now();
  return {
    cvId: '',
    company: '',
    position: '',
    url: '',
    status: 'applied',
    appliedAt: new Date().toISOString().slice(0, 10),
    nextDate: '',
    notes: '',
    posting: '',
    createdAt: now,
    updatedAt: now,
    ...p,
  };
}
