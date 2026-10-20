import { create } from 'zustand';
import { produce, type Draft } from 'immer';
import type { CV } from '../model/types';
import { saveCV, maybeSnapshot, pruneSnapshots } from './db';
import { requestPersistence } from '../ui/selfheal';

const HISTORY_LIMIT = 200;
const GROUP_MS = 600; // bu süre içindeki ardışık değişiklikler tek geri-al adımıdır

interface EditorState {
  cv: CV | null;
  past: CV[];
  future: CV[];
  lastPush: number;
  lastKey: string;
  saveState: 'saved' | 'saving' | 'error';
  load: (cv: CV) => void;
  /** key: aynı alanın ardışık düzenlemelerini gruplamak için */
  update: (fn: (d: Draft<CV>) => void, key?: string) => void;
  replace: (cv: CV) => void;
  undo: () => void;
  redo: () => void;
}

let saveTimer: ReturnType<typeof setTimeout> | undefined;

export const useEditor = create<EditorState>((set, get) => {
  const scheduleSave = () => {
    set({ saveState: 'saving' });
    clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      const cv = get().cv;
      if (!cv) return;
      // kendi kendini onarma: kayıt başarısızsa artan aralıklarla yeniden dene; sürüm geçmişi kaydı asıl kaydı engellemesin
      for (let attempt = 0; attempt < 4; attempt++) {
        try {
          await saveCV(get().cv ?? cv);
          set({ saveState: 'saved' });
          requestPersistence();
          maybeSnapshot(get().cv ?? cv).catch(() => pruneSnapshots().catch(() => {}));
          return;
        } catch {
          if (attempt === 0) await pruneSnapshots().catch(() => {}); // yer açmayı dene
          await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
        }
      }
      set({ saveState: 'error' });
    }, 500);
  };

  return {
    cv: null,
    past: [],
    future: [],
    lastPush: 0,
    lastKey: '',
    saveState: 'saved',
    load: (cv) => set({ cv, past: [], future: [], lastPush: 0, lastKey: '', saveState: 'saved' }),
    update: (fn, key = '') => {
      const { cv, past, lastPush, lastKey } = get();
      if (!cv) return;
      const next = produce(cv, (d) => {
        fn(d);
        d.updatedAt = Date.now();
      });
      if (next === cv) return;
      const now = Date.now();
      const group = key !== '' && key === lastKey && now - lastPush < GROUP_MS;
      set({
        cv: next,
        past: group ? past : [...past, cv].slice(-HISTORY_LIMIT),
        future: [],
        lastPush: now,
        lastKey: key,
      });
      scheduleSave();
    },
    replace: (cv) => {
      const cur = get().cv;
      set({ cv: { ...cv, updatedAt: Date.now() }, past: cur ? [...get().past, cur] : [], future: [], lastKey: '' });
      scheduleSave();
    },
    undo: () => {
      const { past, cv, future } = get();
      if (!past.length || !cv) return;
      set({ cv: past[past.length - 1], past: past.slice(0, -1), future: [cv, ...future], lastKey: '' });
      scheduleSave();
    },
    redo: () => {
      const { past, cv, future } = get();
      if (!future.length || !cv) return;
      set({ cv: future[0], past: [...past, cv], future: future.slice(1), lastKey: '' });
      scheduleSave();
    },
  };
});

/** Sekme kapanırken bekleyen kaydı hemen yaz */
export async function flushSave() {
  clearTimeout(saveTimer);
  const cv = useEditor.getState().cv;
  if (cv) await saveCV(cv);
}
