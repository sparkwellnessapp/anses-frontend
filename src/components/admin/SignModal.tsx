"use client";

import { useEffect, useRef, useState } from "react";
import Modal from "./Modal";
import { ADMIN_STRINGS } from "@/lib/adminStrings";
import {
  AdminApiError,
  getSignJob,
  listSignatures,
  previewSignJob,
  submitSignJob,
} from "@/lib/adminApi";
import { showToast } from "./ToastContainer";
import type {
  SignJobMode,
  SignJobPreviewResponse,
  SignJobResponse,
  SignatureResponse,
  SemesterResponse,
} from "@/types/api";

interface SignModalProps {
  semester: SemesterResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onCompleted?: () => void;
}

type Phase = "form" | "preview" | "progress";

const POLL_INTERVAL_MS = 2000;

/**
 * Three-phase sign modal:
 *   form     → file picker, folder, signature selection, mode
 *   preview  → summary card (no DB writes), confirm/back
 *   progress → polling until job reaches terminal state
 */
export default function SignModal({
  semester,
  isOpen,
  onClose,
  onCompleted,
}: SignModalProps) {
  const [phase, setPhase] = useState<Phase>("form");

  // Form state
  const [files, setFiles] = useState<File[]>([]);
  const [driveFolderId, setDriveFolderId] = useState("");
  const [signatures, setSignatures] = useState<SignatureResponse[]>([]);
  const [selectedSigIds, setSelectedSigIds] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<SignJobMode>("skip_existing");
  const [sigsLoading, setSigsLoading] = useState(false);

  // Preview state
  const [preview, setPreview] = useState<SignJobPreviewResponse | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);

  // Progress state
  const [job, setJob] = useState<SignJobResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const completedNotifiedRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load signatures when modal opens.
  useEffect(() => {
    if (!isOpen) return;
    setSigsLoading(true);
    listSignatures()
      .then((sigs) => {
        setSignatures(sigs);
        setSelectedSigIds(new Set(sigs.map((s) => s.id)));
      })
      .catch(() => {
        showToast({ kind: "error", message: ADMIN_STRINGS.toastNetworkError });
      })
      .finally(() => setSigsLoading(false));
  }, [isOpen]);

  // Reset all state on close.
  useEffect(() => {
    if (!isOpen) {
      setPhase("form");
      setFiles([]);
      setPreview(null);
      setJob(null);
      setIsSubmitting(false);
      completedNotifiedRef.current = false;
    }
  }, [isOpen]);

  // Poll while job is running.
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
        const updated = await getSignJob(job.id);
        setJob(updated);
      } catch {
        // transient — keep previous state
      }
    }, POLL_INTERVAL_MS);
    return () => clearTimeout(handle);
  }, [job, onCompleted]);

  if (!semester) return null;

  // ── helpers ──

  const buildFormData = () => {
    const fd = new FormData();
    files.forEach((f) => fd.append("files", f));
    fd.append("drive_folder_id", driveFolderId.trim());
    fd.append("signature_ids", JSON.stringify([...selectedSigIds]));
    fd.append("mode", mode);
    return fd;
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleSig = (id: string) => {
    setSelectedSigIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const canPreview =
    files.length > 0 &&
    driveFolderId.trim().length > 0 &&
    selectedSigIds.size > 0;

  // ── phase handlers ──

  const handlePreview = async () => {
    setIsPreviewing(true);
    try {
      const result = await previewSignJob(semester.id, buildFormData());
      setPreview(result);
      setPhase("preview");
    } catch (err) {
      const msg =
        err instanceof AdminApiError
          ? err.message
          : ADMIN_STRINGS.toastSignPreviewFailed;
      showToast({ kind: "error", message: msg });
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const created = await submitSignJob(semester.id, buildFormData());
      setJob(created);
      setPhase("progress");
    } catch (err) {
      const msg =
        err instanceof AdminApiError
          ? err.message
          : ADMIN_STRINGS.toastSignJobStartFailed;
      showToast({ kind: "error", message: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isTerminal =
    job?.status === "completed" || job?.status === "failed";

  const processed = job
    ? job.signed_count + job.skipped_count + job.error_count
    : 0;
  const percent =
    job && job.total_files > 0
      ? Math.min(100, Math.round((processed / job.total_files) * 100))
      : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${ADMIN_STRINGS.signModalTitle} — ${semester.id}`}
      dismissOnBackdrop={phase === "form" || (phase === "progress" && isTerminal)}
    >
      {/* ═══ PHASE 1: Form ═══ */}
      {phase === "form" && (
        <div className="space-y-4">
          {/* Files */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {ADMIN_STRINGS.signFilesLabel}
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              multiple
              onChange={(e) => {
                const incoming = Array.from(e.target.files ?? []);
                setFiles((prev) => {
                  const existingNames = new Set(prev.map((f) => f.name));
                  const toAdd = incoming.filter((f) => !existingNames.has(f.name));
                  return [...prev, ...toAdd];
                });
                // Reset so the same file can be re-selected after removal.
                e.target.value = "";
              }}
              className="block w-full text-sm text-gray-700 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border file:border-gray-300 file:text-sm file:bg-gray-50 hover:file:bg-gray-100"
            />
            {files.length > 0 && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">
                    {files.length} archivo(s) seleccionado(s)
                  </span>
                  <button
                    type="button"
                    onClick={() => setFiles([])}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Limpiar todo
                  </button>
                </div>
                <div className="max-h-36 overflow-y-auto rounded border border-gray-200 bg-gray-50 divide-y divide-gray-100">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-1">
                      <span className="text-xs font-mono text-gray-700 truncate pr-2">
                        {f.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="shrink-0 text-gray-400 hover:text-red-500 text-xs leading-none"
                        aria-label={`Quitar ${f.name}`}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Drive folder */}
          <div>
            <label
              htmlFor="sign-drive"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {ADMIN_STRINGS.signDriveFolderLabel}
            </label>
            <input
              id="sign-drive"
              type="text"
              value={driveFolderId}
              onChange={(e) => setDriveFolderId(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2c4264]"
            />
            <p className="mt-1 text-xs text-gray-500">
              Ingrese el ID de la <span className="font-medium">carpeta padre</span> (ej. «I SEMESTRE 2026»), no el de las subcarpetas por rango.
            </p>
          </div>

          {/* Signatures */}
          <div>
            <p className="block text-sm font-medium text-gray-700 mb-2">
              {ADMIN_STRINGS.signSignaturesLabel}
            </p>
            {sigsLoading ? (
              <div className="h-10 bg-gray-100 rounded animate-pulse" />
            ) : signatures.length === 0 ? (
              <p className="text-sm text-gray-500">
                {ADMIN_STRINGS.signNoSignaturesAvailable}
              </p>
            ) : (
              <div className="space-y-1 max-h-40 overflow-y-auto rounded border border-gray-200 p-2">
                {signatures.map((sig) => (
                  <label
                    key={sig.id}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedSigIds.has(sig.id)}
                      onChange={() => toggleSig(sig.id)}
                      className="h-4 w-4 rounded text-[#2c4264] focus:ring-[#2c4264]"
                    />
                    <span className="text-sm text-gray-800">{sig.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Mode */}
          <div>
            <p className="block text-sm font-medium text-gray-700 mb-2">
              {ADMIN_STRINGS.signModeLabel}
            </p>
            <div className="space-y-2">
              {(
                [
                  ["skip_existing", ADMIN_STRINGS.signModeSkipExisting, ADMIN_STRINGS.signModeSkipExistingHint],
                  ["override", ADMIN_STRINGS.signModeOverride, ADMIN_STRINGS.signModeOverrideHint],
                  ["append", ADMIN_STRINGS.signModeAppend, ADMIN_STRINGS.signModeAppendHint],
                ] as const
              ).map(([value, label, hint]) => (
                <label key={value} className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="sign-mode"
                    value={value}
                    checked={mode === value}
                    onChange={() => setMode(value)}
                    className="mt-1"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">{label}</span>
                    <p className="text-xs text-gray-500">{hint}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {ADMIN_STRINGS.cancelButton}
            </button>
            <button
              type="button"
              onClick={handlePreview}
              disabled={!canPreview || isPreviewing}
              className="px-4 py-2 rounded-md bg-[#2c4264] text-sm font-medium text-white hover:bg-[#243652] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {isPreviewing
                ? ADMIN_STRINGS.signPreviewing
                : ADMIN_STRINGS.signPreviewButton}
            </button>
          </div>
        </div>
      )}

      {/* ═══ PHASE 2: Preview ═══ */}
      {phase === "preview" && preview && (
        <div className="space-y-4">
          {/* Header stats */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <InfoRow
              label={ADMIN_STRINGS.signPreviewFiles(preview.file_count)}
              value={String(preview.file_count)}
            />
            <InfoRow
              label={ADMIN_STRINGS.signPreviewCollisions(preview.collision_count)}
              value={String(preview.collision_count)}
              tone={preview.collision_count > 0 ? "amber" : "green"}
            />
          </div>

          {/* Drive folder */}
          <div className="rounded-md border border-gray-200 p-3 text-sm">
            <span className="font-medium text-gray-700">
              {ADMIN_STRINGS.signPreviewFolder}:{" "}
            </span>
            {preview.drive_folder_valid ? (
              <>
                <span className="text-gray-900">{preview.drive_folder_name || driveFolderId}</span>
                {!preview.drive_folder_writable && (
                  <span className="ml-2 text-xs text-red-600">
                    ({ADMIN_STRINGS.signPreviewFolderNotWritable})
                  </span>
                )}
              </>
            ) : (
              <span className="text-red-600">{ADMIN_STRINGS.signPreviewFolderInvalid}</span>
            )}
          </div>

          {/* Mode summary */}
          <div className="rounded-md bg-blue-50 border border-blue-200 px-3 py-2 text-xs text-blue-900">
            {preview.mode_action_summary}
          </div>

          {/* Rotation breakdown */}
          {preview.rotation_breakdown.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-1">
                {ADMIN_STRINGS.signPreviewRotation}
              </p>
              <table className="w-full text-xs border border-gray-200 rounded overflow-hidden">
                <tbody className="divide-y divide-gray-100">
                  {preview.rotation_breakdown.map((entry) => (
                    <tr key={entry.signature_id} className="bg-white">
                      <td className="px-3 py-1.5 text-gray-800">{entry.signature_name}</td>
                      <td className="px-3 py-1.5 text-right font-mono text-gray-700">{entry.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Collisions list */}
          {preview.collisions.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-1">
                Colisiones ({preview.collision_count}
                {preview.collision_count > 50 ? ", mostrando primeros 50" : ""}):
              </p>
              <div className="max-h-32 overflow-y-auto rounded border border-gray-200 bg-gray-50 text-xs font-mono divide-y divide-gray-100">
                {preview.collisions.map((name) => (
                  <div key={name} className="px-3 py-1 text-gray-700">
                    {name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Override warning */}
          {mode === "override" && preview.collision_count > 0 && (
            <div className="rounded-md bg-amber-50 border border-amber-300 px-3 py-2 text-sm text-amber-900">
              <span className="font-semibold">Advertencia:</span>{" "}
              {preview.collision_count === 1
                ? "1 documento será sobreescrito."
                : `${preview.collision_count} documentos serán sobreescritos.`}{" "}
              Revise cuidadosamente antes de confirmar.
            </div>
          )}

          {/* Skip-all warning */}
          {mode === "skip_existing" &&
            preview.file_count > 0 &&
            preview.collision_count === preview.file_count && (
              <div className="rounded-md bg-gray-100 border border-gray-300 px-3 py-2 text-sm text-gray-700">
                Todos los archivos ya existen en el destino y serán omitidos. No hay nada que procesar.
              </div>
            )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setPhase("form")}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {ADMIN_STRINGS.signBackButton}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={
                isSubmitting ||
                !preview.drive_folder_valid ||
                !preview.drive_folder_writable ||
                (mode === "skip_existing" &&
                  preview.file_count > 0 &&
                  preview.collision_count === preview.file_count)
              }
              className="px-4 py-2 rounded-md bg-[#2c4264] text-sm font-medium text-white hover:bg-[#243652] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting
                ? ADMIN_STRINGS.signSubmitting
                : ADMIN_STRINGS.signConfirmButton}
            </button>
          </div>
        </div>
      )}

      {/* ═══ PHASE 3: Progress ═══ */}
      {phase === "progress" && job && (
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
              ? ADMIN_STRINGS.signJobCompleted
              : job.status === "failed"
                ? ADMIN_STRINGS.signJobFailed
                : job.status === "pending"
                  ? ADMIN_STRINGS.signJobPending
                  : ADMIN_STRINGS.signJobInProgress}
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
          <div className="grid grid-cols-4 gap-2 text-center">
            <SignCounter label={ADMIN_STRINGS.signTotalFiles} value={job.total_files} />
            <SignCounter label={ADMIN_STRINGS.signSigned} value={job.signed_count} tone="green" />
            <SignCounter label={ADMIN_STRINGS.signSkipped} value={job.skipped_count} tone="gray" />
            <SignCounter label={ADMIN_STRINGS.signErrors} value={job.error_count} tone={job.error_count > 0 ? "red" : "gray"} />
          </div>

          {/* Error list */}
          {job.error_details && job.error_details.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                {ADMIN_STRINGS.signErrorListHeading} ({job.error_details.length})
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
              {ADMIN_STRINGS.signCloseButton}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function InfoRow({
  label,
  value,
  tone = "blue",
}: {
  label: string;
  value: string;
  tone?: "blue" | "green" | "amber" | "red";
}) {
  const colors = {
    blue: "text-[#2c4264]",
    green: "text-green-700",
    amber: "text-amber-700",
    red: "text-red-700",
  } as const;
  return (
    <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
      <div className={`text-lg font-semibold ${colors[tone]}`}>{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}

function SignCounter({
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
