"use client";

import { useState } from "react";
import Modal from "./Modal";
import { ADMIN_STRINGS } from "@/lib/adminStrings";
import { AdminApiError, uploadCertificate } from "@/lib/adminApi";
import { showToast } from "./ToastContainer";
import type { SemesterResponse } from "@/types/api";

interface UploadCertModalProps {
  semesters: SemesterResponse[];
  defaultSemesterId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onUploaded: () => void;
}

const PDF_MAGIC = "%PDF";

/**
 * Manual single-PDF upload.
 *
 * Two-stage 409 handling: on first conflict, the form switches into
 * "duplicate confirm" state — the user sees a clear question, and
 * the same submit button retries with replace=true. No silent
 * overwrite, no separate dialog.
 */
export default function UploadCertModal({
  semesters,
  defaultSemesterId,
  isOpen,
  onClose,
  onUploaded,
}: UploadCertModalProps) {
  const [semesterId, setSemesterId] = useState(defaultSemesterId ?? "");
  const [dni, setDni] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [needsReplaceConfirm, setNeedsReplaceConfirm] = useState(false);

  const reset = () => {
    setSemesterId(defaultSemesterId ?? "");
    setDni("");
    setFile(null);
    setIsSubmitting(false);
    setNeedsReplaceConfirm(false);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    reset();
    onClose();
  };

  const validateAndRead = async (f: File): Promise<boolean> => {
    if (f.size < 4) return false;
    const head = await f.slice(0, 4).text();
    return head === PDF_MAGIC;
  };

  const doUpload = async (replace: boolean) => {
    if (!file || !semesterId || !dni.trim()) return;

    const ok = await validateAndRead(file);
    if (!ok) {
      showToast({ kind: "error", message: ADMIN_STRINGS.uploadFileNotPdf });
      return;
    }

    setIsSubmitting(true);
    const fd = new FormData();
    fd.append("semester_id", semesterId);
    fd.append("dni", dni.trim());
    fd.append("file", file);

    try {
      await uploadCertificate(fd, replace);
      showToast({ kind: "success", message: ADMIN_STRINGS.toastUploadSuccess });
      onUploaded();
      reset();
      onClose();
    } catch (err) {
      if (
        err instanceof AdminApiError &&
        err.status === 409 &&
        !replace
      ) {
        // Switch to replace-confirm state. Don't toast — the inline
        // prompt is the message.
        setNeedsReplaceConfirm(true);
        setIsSubmitting(false);
        return;
      }
      const message =
        err instanceof AdminApiError
          ? err.message
          : ADMIN_STRINGS.toastUploadFailed;
      showToast({ kind: "error", message });
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void doUpload(needsReplaceConfirm);
  };

  const canSubmit =
    !!semesterId &&
    dni.trim().length > 0 &&
    file !== null &&
    !isSubmitting;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={ADMIN_STRINGS.uploadTitle}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="up-semester"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {ADMIN_STRINGS.uploadSemesterLabel}
          </label>
          <select
            id="up-semester"
            value={semesterId}
            onChange={(e) => {
              setSemesterId(e.target.value);
              setNeedsReplaceConfirm(false);
            }}
            disabled={isSubmitting}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2c4264] focus:border-[#2c4264] disabled:bg-gray-50"
          >
            <option value="" disabled>
              —
            </option>
            {semesters
              .filter((s) => s.status !== "deleted")
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.id} — {s.label}
                </option>
              ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="up-dni"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {ADMIN_STRINGS.uploadDniLabel}
          </label>
          <input
            id="up-dni"
            type="text"
            inputMode="numeric"
            value={dni}
            onChange={(e) => {
              setDni(e.target.value);
              setNeedsReplaceConfirm(false);
            }}
            placeholder={ADMIN_STRINGS.uploadDniPlaceholder}
            disabled={isSubmitting}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#2c4264] focus:border-[#2c4264] disabled:bg-gray-50"
          />
        </div>

        <div>
          <label
            htmlFor="up-file"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {ADMIN_STRINGS.uploadFileLabel}
          </label>
          <input
            id="up-file"
            type="file"
            accept="application/pdf,.pdf"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setNeedsReplaceConfirm(false);
            }}
            disabled={isSubmitting}
            className="w-full text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-[#2c4264] file:text-white hover:file:bg-[#243652] file:cursor-pointer disabled:opacity-50"
          />
        </div>

        {needsReplaceConfirm && (
          <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-900">
            {ADMIN_STRINGS.uploadDuplicateConfirm}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {ADMIN_STRINGS.uploadCancel}
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className={`px-4 py-2 rounded-md text-sm font-medium text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
              needsReplaceConfirm
                ? "bg-amber-600 hover:bg-amber-700"
                : "bg-[#2c4264] hover:bg-[#243652]"
            }`}
          >
            {isSubmitting
              ? ADMIN_STRINGS.uploadSubmitting
              : needsReplaceConfirm
                ? ADMIN_STRINGS.uploadReplaceConfirm
                : ADMIN_STRINGS.uploadSubmit}
          </button>
        </div>
      </form>
    </Modal>
  );
}
