"use client";

/**
 * Toast notifications.
 *
 * Hand-rolled rather than pulling in react-hot-toast or sonner. Total
 * surface: an event emitter, a hook, a renderer. ~80 lines including
 * styling. Pulling a library would add 10-30 KB for what is, at heart,
 * a list with auto-dismissal.
 *
 * Usage from any component:
 *   showToast({ kind: 'success', message: 'Listo!' })
 *   showToast({ kind: 'error', message: 'Algo salió mal.' })
 *
 * The renderer must be mounted once at the admin layout level.
 */

import { useEffect, useState } from "react";

export type ToastKind = "success" | "error";

export interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

const TOAST_DURATION_MS = 5000;

type Listener = (toasts: Toast[]) => void;

let nextId = 1;
let toasts: Toast[] = [];
const listeners = new Set<Listener>();

function emit() {
  for (const l of listeners) l(toasts);
}

export function showToast(input: { kind: ToastKind; message: string }): void {
  const id = nextId++;
  const toast: Toast = { id, kind: input.kind, message: input.message };
  toasts = [...toasts, toast];
  emit();
  setTimeout(() => dismissToast(id), TOAST_DURATION_MS);
}

export function dismissToast(id: number): void {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

function useToasts(): Toast[] {
  const [state, setState] = useState<Toast[]>([]);
  useEffect(() => {
    const l: Listener = (next) => setState(next);
    listeners.add(l);
    setState(toasts);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return state;
}

export default function ToastContainer() {
  const items = useToasts();

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]"
    >
      {items.map((t) => (
        <div
          key={t.id}
          role={t.kind === "error" ? "alert" : "status"}
          onClick={() => dismissToast(t.id)}
          className={`cursor-pointer rounded-md shadow-md px-4 py-3 text-sm animate-fade-in ${
            t.kind === "success"
              ? "bg-green-50 border border-green-200 text-green-900"
              : "bg-red-50 border border-red-200 text-red-900"
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
