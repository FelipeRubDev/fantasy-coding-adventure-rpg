export interface ToastData {
  id: number;
  kind: "ach" | "level" | "info" | "loot" | "warn" | "gold";
  title: string;
  text?: string;
  icon?: string;
  color?: string;
}

type L = (t: ToastData) => void;
const listeners = new Set<L>();
let n = 0;

export function toast(t: Omit<ToastData, "id">) {
  const d = { ...t, id: ++n };
  listeners.forEach((l) => l(d));
}

export function onToast(l: L) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}
