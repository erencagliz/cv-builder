import { createContext, useContext } from 'react';

export type ToastFn = (msg: string, kind?: 'info' | 'error') => void;
export const ToastContext = createContext<ToastFn>(() => {});
export const useToast = () => useContext(ToastContext);
