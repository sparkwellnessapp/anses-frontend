"use client";

import Modal from "./Modal";
import { ADMIN_STRINGS } from "@/lib/adminStrings";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

/**
 * Confirmation dialog for destructive actions.
 *
 * The destructive button is red (rather than the brand blue) so the
 * eye doesn't accidentally land on the safe-looking primary color.
 * Cancel is the default-focus action and visually weighted lighter,
 * pushing accidental Enter-presses toward the safer outcome.
 */
export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = ADMIN_STRINGS.confirmYes,
  cancelLabel = ADMIN_STRINGS.confirmCancel,
  onConfirm,
  onCancel,
  isProcessing = false,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title} dismissOnBackdrop={!isProcessing}>
      <p className="text-sm text-gray-700 leading-relaxed">{message}</p>

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isProcessing}
          className="px-4 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          autoFocus
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isProcessing}
          className="px-4 py-2 rounded-md bg-red-600 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
        >
          {isProcessing ? ADMIN_STRINGS.loadingShort : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
