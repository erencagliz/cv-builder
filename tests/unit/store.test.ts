import { beforeEach, describe, expect, it } from 'vitest';
import { db, deleteCV, getCV, listCVs, listSnapshots, maybeSnapshot, newApplication, saveApplication, saveCV } from '../../src/store/db';
import { buildBackup, restoreBackup } from '../../src/store/backup';
import { sampleCV, sampleCVEn } from '../../src/model/sample';

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
});

describe('CV storage', () => {
  it('saves, lists by recency, reads and deletes', async () => {
    const a = { ...sampleCV(), updatedAt: 1 };
    const b = { ...sampleCVEn(), updatedAt: 2 };
    await saveCV(a);
    await saveCV(b);
    expect((await listCVs()).map((r) => r.id)).toEqual([b.id, a.id]);
    expect((await getCV(a.id))?.personal.firstName).toBe('Deniz');
    await deleteCV(a.id);
    expect(await getCV(a.id)).toBeUndefined();
  });

  it('throttles version snapshots', async () => {
    const cv = sampleCV();
    await maybeSnapshot(cv);
    await maybeSnapshot(cv);
    expect(await listSnapshots(cv.id)).toHaveLength(1);
    await deleteCV(cv.id);
    expect(await listSnapshots(cv.id)).toHaveLength(0);
  });
});

describe('backup', () => {
  it('restores CVs and applications without overwriting existing ones', async () => {
    const cv = sampleCV();
    await saveCV(cv);
    await saveApplication(newApplication({ cvId: cv.id, company: 'Acme', position: 'Engineer' }));

    const backup = JSON.parse(await buildBackup());
    expect(backup.format).toBe('cv-builder-backup');
    expect(backup.cvs).toHaveLength(1);
    expect(backup.applications).toHaveLength(1);

    const result = await restoreBackup(backup);
    expect(result.applications).toBe(1);
    expect(result.cvs[0].id).not.toBe(cv.id);
    expect(await listCVs()).toHaveLength(2);

    const apps = await db.applications.toArray();
    expect(apps.map((a) => a.cvId).sort()).toEqual([cv.id, result.cvs[0].id].sort());
  });
});
