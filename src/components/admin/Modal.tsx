"use client";

import { useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** Lock body scroll while open. Default: true. */
  lockScroll?: boolean;
  /** Allow closing by clicking the backdrop. Default: true. */
  dismissOnBackdrop?: boolean;
}

/**
 * Generic modal shell.
 *
 * One overlay element catches both escape-to-close and click-outside
 * (if enabled). Children control their own form / footer / buttons —
 * this component is layout-only, deliberately.
 *
 * Why no `position: fixed` warnings about stacking contexts: this
 * lives at the document root via a portal-free render (no SSR path
 * needed for admin), z-index 50 sits above the toast container.
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  lockScroll = true,
  dismissOnBackdrop = true,
}: ModalProps) {
  // Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Body scroll lock
  useEffect(() => {
    if (!isOpen || !lockScroll) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen, lockScroll]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/50 animate-fade-in"
      onClick={dismissOnBackdrop ? onClose : undefined}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 id="modal-title" className="text-lg font-semibold text-gray-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
