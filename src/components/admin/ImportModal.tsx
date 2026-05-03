"use client";

import { useEffect, useRef, useState } from "react";
import Modal from "./Modal";
import { ADMIN_STRINGS } from "@/lib/adminStrings";
import {
  AdminApiError,
  getImportJob,
  triggerImport,
} from "@/lib/adminApi";
import { showToast } from "./ToastContainer";
import type {
  ImportJobMode,
  ImportJobResponse,
  SemesterResponse,
} from "@/types/api";

interface ImportModalProps {
  semester: SemesterResponse | null;
  isOpen: boolean;
  onClose: () => void;
  /** Called when the import reaches a terminal state. Lets parent
   *  refresh certificate counts without re-fetching the whole list. */
  onCompleted?: () => void;
}

const POLL_INTERVAL_MS = 2000;

/**
 * Import job modal — two-state UX:
 *   1. Pre-submit: Drive folder ID + mode radios + Iniciar
 *   2. Post-submit: progress bar + counters + error list, polling
 *      until status ∈ { completed, failed }
 *
 * Polling lives in a useEffect with cleanup so closing mid-poll
 * cancels the next request. If the user closes during a running
 * import, the job continues server-side; reopening starts a fresh
 * polling cycle from the latest job state.
 *
 * The "Cerrar" button is enabled at all times — closing during a
 * running import is fine (the job continues, the admin can come
 * back to the semester's import history later via Phase 7's listing).
 * For Phase 6, no separate import-history view; the progress is
 * lost from the UI but the job runs to completion regardless.
 */
export default function ImportModal({
  semester,
  isOpen,
  onClose,
  onCompleted,
}: ImportModalProps) {
  const [driveFolderId, setDriveFolderId] = useState("");
  const [mode, setMode] = useState<ImportJobMode>("skip_existing");
  const [job, setJob] = useState<ImportJobResponse | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  const completedNotifiedRef = useRef(false);

  // Pre-fill the Drive folder from the semester (if present).
  useEffect(() => {
    if (isOpen && semester?.drive_folder_id) {
      setDriveFolderId(semester.drive_folder_id);
    }
  }, [isOpen, semester]);

  // Reset state when the modal closes.
  useEffect(() => {
    if (!isOpen) {
      setJob(null);
      setIsStarting(false);
      completedNotifiedRef.current = false;
      // Keep driveFolderId / mode so reopening on the same semester
      // remembers the last attempt.
    }
  }, [isOpen]);

  // Poll while a job is running.
  useEffect(() => {
    if (!job) return;
    if (job.status === "completed" || job.status === "failed") {
      if (!completedNotifiedRef.current) {
        completedNotifiedRef.current = true;
        onCompleted?.();
      }
      return;
    }

    const handle = setTimeout(async () => {
      try {
        const updated = await getImportJob(job.id);
        setJob(updated);
      } catch {
        // Transient poll failure — keep the previous state visible
        // and let the next tick try again. If it persists, the user
        // can close the modal; the server-side job continues.
      }
    }, POLL_INTERVAL_MS);

    return () => clearTimeout(handle);
  }, [job, onCompleted]);

  if (!semester) return null;

  const handleStart = async () => {
    if (!driveFolderId.trim()) return;
    setIsStarting(true);
    try {
      const created = await triggerImport(semester.id, {
        drive_folder_id: driveFolderId.trim(),
        mode,
      });
      setJob(created);
    } catch (err) {
      const message =
        err instanceof AdminApiError
          ? err.message
          : ADMIN_STRINGS.toastImportStartFailed;
      showToast({ kind: "error", message });
    } finally {
      setIsStarting(false);
    }
  };

  const isTerminal =
    job?.status === "completed" || job?.status === "failed";

  const processed = job
    ? job.imported_count + job.skipped_count + job.error_count
    : 0;
  const percent =
    job && job.total_files > 0
      ? Math.min(100, Math.round((processed / job.total_files) * 100))
      : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${ADMIN_STRINGS.importTitle} — ${semester.id}`}
      dismissOnBackdrop={!job || isTerminal}
    >
      {!job ? (
        // ---------- Pre-submit form ----------
        <div className="space-y-4">
          <div>
            <label
              htmlFor="imp-drive"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {ADMIN_STRINGS.importDriveFolderLabel}
            </label>
            <input
              id="imp-drive"
              type="text"
              value={driveFolderId}
              onChange={(e) => setDriveFolderId(e.target.value)}
              disabled={isStarting}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2c4264] focus:border-[#2c4264] disabled:bg-gray-50"
            />
          </div>

          <div>
            <p className="block text-sm font-medium text-gray-700 mb-2">
              {ADMIN_STRINGS.importModeLabel}
            </p>
            <div className="space-y-2">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="mode"
                  value="skip_existing"
                  checked={mode === "skip_existing"}
                  onChange={() => setMode("skip_existing")}
                  disabled={isStarting}
                  className="mt-1"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">
                    {ADMIN_STRINGS.importModeSkipExisting}
                  </span>
                  <p className="text-xs text-gray-500">
                    {ADMIN_STRINGS.importModeSkipExistingHint}
                  </p>
                </div>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="mode"
                  value="replace"
                  checked={mode === "replace"}
                  onChange={() => setMode("replace")}
                  disabled={isStarting}
                  className="mt-1"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">
                    {ADMIN_STRINGS.importModeReplace}
                  </span>
                  <p className="text-xs text-gray-500">
                    {ADMIN_STRINGS.importModeReplaceHint}
                  </p>
                </div>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isStarting}
              className="px-4 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {ADMIN_STRINGS.cancelButton}
            </button>
            <button
              type="button"
              onClick={handleStart}
              disabled={isStarting || !driveFolderId.trim()}
              className="px-4 py-2 rounded-md bg-[#2c4264] text-sm font-medium text-white hover:bg-[#243652] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {isStarting
                ? ADMIN_STRINGS.importStarting
                : ADMIN_STRINGS.importStartButton}
            </button>
          </div>
        </div>
      ) : (
        // ---------- Progress view ----------
        <div className="space-y-5">
          {/* Status banner */}
          <div
            className={`rounded-md px-4 py-3 text-sm font-medium ${
              job.status === "completed"
                ? "bg-green-50 text-green-900 border border-green-200"
                : job.status === "failed"
                  ? "bg-red-50 text-red-900 border border-red-200"
                  : "bg-blue-50 text-blue-900 border border-blue-200"
            }`}
          >
            {job.status === "completed"
              ? ADMIN_STRINGS.importCompleted
              : job.status === "failed"
                ? ADMIN_STRINGS.importFailed
                : ADMIN_STRINGS.importInProgress}
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>
                {processed} / {job.total_files}
              </span>
              <span>{percent}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  job.status === "failed" ? "bg-red-500" : "bg-[#2c4264]"
                }`}
                style={{ width: `${percent}%` }}
                role="progressbar"
                aria-valuenow={percent}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </div>

          {/* Counters */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <Counter label={ADMIN_STRINGS.importTotalFiles} value={job.total_files} />
            <Counter
              label={ADMIN_STRINGS.importImported}
              value={job.imported_count}
              tone="green"
            />
            <Counter
              label={ADMIN_STRINGS.importErrors}
              value={job.error_count}
              tone={job.error_count > 0 ? "red" : "gray"}
            />
          </div>

          {/* Error list (if any) */}
          {job.error_details && job.error_details.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                {ADMIN_STRINGS.importErrorListHeading} ({job.error_details.length})
              </h3>
              <div className="max-h-48 overflow-y-auto rounded-md border border-gray-200 bg-gray-50 divide-y divide-gray-200">
                {job.error_details.map((err, i) => (
                  <div key={i} className="px-3 py-2 text-xs">
                    <div className="font-mono text-gray-700">
                      {String(err.filename ?? err.dni ?? "—")}
                    </div>
                    <div className="text-red-600 mt-0.5">
                      {String(err.error ?? "")}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md bg-[#2c4264] text-sm font-medium text-white hover:bg-[#243652] transition-colors"
            >
              {ADMIN_STRINGS.importCloseButton}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function Counter({
  label,
  value,
  tone = "blue",
}: {
  label: string;
  value: number;
  tone?: "blue" | "green" | "red" | "gray";
}) {
  const colors = {
    blue: "text-[#2c4264]",
    green: "text-green-700",
    red: "text-red-700",
    gray: "text-gray-700",
  } as const;
  return (
    <div className="bg-gray-50 rounded-md py-2 px-1 border border-gray-200">
      <div className={`text-xl font-semibold ${colors[tone]}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}
