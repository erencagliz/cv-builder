import Dexie, { type Table } from 'dexie';
import type { CV } from '../model/types';
import { normalizeCV } from '../model/defaults';

export interface CVRow {
  id: string;
  name: string;
  updatedAt: number;
  data: CV;
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
  constructor() {
    super('cv-builder');
    this.version(1).stores({ cvs: 'id, updatedAt', snapshots: '++id, cvId, at' });
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
export async function listSnapshots(cvId: string): Promise<SnapshotRow[]> {
  return (await db.snapshots.where('cvId').equals(cvId).sortBy('at')).reverse();
}
export async function wipeAll(): Promise<void> {
  await db.delete();
}
