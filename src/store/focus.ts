import { create } from 'zustand';

/** Analiz ekranındaki "Düzelt" düğmesinin düzenleyicide ilgili bölümü/girdiyi açması için */
export interface FocusRequest {
  section: string;
  entryId?: string;
  n: number;
}
type Drawer = null | 'apps' | 'share';
export const useFocus = create<{
  req: FocusRequest | null;
  go: (section: string, entryId?: string) => void;
  drawer: Drawer;
  openDrawer: (d: Drawer) => void;
}>((set, get) => ({
  req: null,
  go: (section, entryId) => set({ req: { section, entryId, n: (get().req?.n ?? 0) + 1 } }),
  drawer: null,
  openDrawer: (drawer) => set({ drawer }),
}));
