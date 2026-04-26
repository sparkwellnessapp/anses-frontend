"use client";

import { useState } from "react";
import Modal from "./Modal";
import { ADMIN_STRINGS } from "@/lib/adminStrings";
import { AdminApiError, createSemester } from "@/lib/adminApi";
import { showToast } from "./ToastContainer";
import type { SemesterResponse } from "@/types/api";

const SEMESTER_ID_RE = /^\d{4}-S[12]$/;

interface NewSemesterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (semester: SemesterResponse) => void;
}

export default function NewSemesterModal({
  isOpen,
  onClose,
  onCreated,
}: NewSemesterModalProps) {
  const [id, setId] = useState("");
  const [label, setLabel] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [driveFolderId, setDriveFolderId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const idValid = id.length === 0 || SEMESTER_ID_RE.test(id);
  const datesValid =
    startDate.length === 0 ||
    endDate.length === 0 ||
    startDate < endDate;

  const canSubmit =
    SEMESTER_ID_RE.test(id) &&
    label.trim().length > 0 &&
    startDate.length > 0 &&
    endDate.length > 0 &&
    datesValid &&
    !isSubmitting;

  const reset = () => {
    setId("");
    setLabel("");
    setStartDate("");
    setEndDate("");
    setDriveFolderId("");
    setIsSubmitting(false);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      const sem = await createSemester({
        id,
        label: label.trim(),
        start_date: startDate,
        end_date: endDate,
        drive_folder_id: driveFolderId.trim() || null,
      });
      showToast({ kind: "success", message: ADMIN_STRINGS.toastSemesterCreated });
      onCreated(sem);
      reset();
      onClose();
    } catch (err) {
      const message =
        err instanceof AdminApiError
          ? err.message
          : ADMIN_STRINGS.toastSemesterCreateFailed;
      showToast({ kind: "error", message });
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={ADMIN_STRINGS.newSemesterTitle}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="sem-id"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {ADMIN_STRINGS.newSemesterIdLabel}
          </label>
          <input
            id="sem-id"
            type="text"
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="2026-S1"
            disabled={isSubmitting}
            aria-invalid={!idValid}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2c4264] focus:border-[#2c4264] disabled:bg-gray-50"
          />
          <p
            className={`mt-1 text-xs ${
              idValid ? "text-gray-500" : "text-red-600"
            }`}
          >
            {idValid
              ? ADMIN_STRINGS.newSemesterIdHint
              : ADMIN_STRINGS.newSemesterIdInvalid}
          </p>
        </div>

        <div>
          <label
            htmlFor="sem-label"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {ADMIN_STRINGS.newSemesterLabelLabel}
          </label>
          <input
            id="sem-label"
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={ADMIN_STRINGS.newSemesterLabelPlaceholder}
            disabled={isSubmitting}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2c4264] focus:border-[#2c4264] disabled:bg-gray-50"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="sem-start"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {ADMIN_STRINGS.newSemesterStartLabel}
            </label>
            <input
              id="sem-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={isSubmitting}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2c4264] focus:border-[#2c4264] disabled:bg-gray-50"
            />
          </div>
          <div>
            <label
              htmlFor="sem-end"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {ADMIN_STRINGS.newSemesterEndLabel}
            </label>
            <input
              id="sem-end"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={isSubmitting}
              aria-invalid={!datesValid}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2c4264] focus:border-[#2c4264] disabled:bg-gray-50"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="sem-drive"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {ADMIN_STRINGS.newSemesterDriveFolderLabel}
          </label>
          <input
            id="sem-drive"
            type="text"
            value={driveFolderId}
            onChange={(e) => setDriveFolderId(e.target.value)}
            disabled={isSubmitting}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2c4264] focus:border-[#2c4264] disabled:bg-gray-50"
          />
          <p className="mt-1 text-xs text-gray-500">
            {ADMIN_STRINGS.newSemesterDriveFolderHint}
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {ADMIN_STRINGS.newSemesterCancel}
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="px-4 py-2 rounded-md bg-[#2c4264] text-sm font-medium text-white hover:bg-[#243652] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting
              ? ADMIN_STRINGS.newSemesterSubmitting
              : ADMIN_STRINGS.newSemesterSubmit}
          </button>
        </div>
      </form>
    </Modal>
  );
}
