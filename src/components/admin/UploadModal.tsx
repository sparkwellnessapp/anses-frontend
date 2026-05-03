"use client";

import { useEffect, useRef, useState } from "react";
import Modal from "./Modal";
import { ADMIN_STRINGS } from "@/lib/adminStrings";
import {
  AdminApiError,
  getSignJob,
  listSignatures,
  previewCajaSignJob,
  previewPublishJob,
  previewSignJob,
  submitCajaSignJob,
  submitPublishJob,
  submitSignJob,
} from "@/lib/adminApi";
import { showToast } from "./ToastContainer";
import type {
  CajaSignPreviewResponse,
  PublishPreviewResponse,
  SemesterResponse,
  SignJobPreviewResponse,
  SignJobResponse,
  SignatureResponse,
} from "@/types/api";

type RotationBreakdownEntry = {
  signature_id: string;
  signature_name?: string | null;
  count: number;
};

type UploadPath = "anses_sign" | "caja_publish" | "caja_local_sign";
type Phase = "choose" | "form" | "preview" | "progress";

const POLL_INTERVAL_MS = 2000;

const PATH_INFO: Record<UploadPath, { label: string; desc: string }> = {
  anses_sign: {
    label: ADMIN_STRINGS.uploadPathAnsesSign,
    desc: ADMIN_STRINGS.uploadPathAnsesSignDesc,
  },
  caja_publish: {
    label: ADMIN_STRINGS.uploadPathCajaPublish,
    desc: ADMIN_STRINGS.uploadPathCajaPublishDesc,
  },
  caja_local_sign: {
    label: ADMIN_STRINGS.uploadPathCajaLocal,
    desc: ADMIN_STRINGS.uploadPathCajaLocalDesc,
  },
};

interface UploadModalProps {
  semester: SemesterResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onCompleted?: () => void;
}

type AnyPreview =
  | SignJobPreviewResponse
  | PublishPreviewResponse
  | CajaSignPreviewResponse;

export default function UploadModal({
  semester,
  isOpen,
  onClose,
  onCompleted,
}: UploadModalProps) {
  const [phase, setPhase] = useState<Phase>("choose");
  const [path, setPath] = useState<UploadPath>("anses_sign");

  // Form state
  const [files, setFiles] = useState<File[]>([]);
  const [driveFolderId, setDriveFolderId] = useState("");
  const [signatures, setSignatures] = useState<SignatureResponse[]>([]);
  const [selectedSigIds, setSelectedSigIds] = useState<Set<string>>(new Set());
  const [sigsLoading, setSigsLoading] = useState(false);

  // Preview state
  const [preview, setPreview] = useState<AnyPreview | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);

  // Progress state
  const [job, setJob] = useState<SignJobResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const completedNotifiedRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load signatures when entering the form phase for paths that need them.
  useEffect(() => {
    if (!isOpen || phase !== "form" || path === "caja_publish") return;
    setSigsLoading(true);
    listSignatures()
      .then((sigs) => {
        setSignatures(sigs);
        setSelectedSigIds(new Set(sigs.map((s) => s.id)));
      })
      .catch(() =>
        showToast({ kind: "error", message: ADMIN_STRINGS.toastNetworkError }),
      )
      .finally(() => setSigsLoading(false));
  }, [isOpen, phase, path]);

  // Reset all state on close.
  useEffect(() => {
    if (!isOpen) {
      setPhase("choose");
      setPath("anses_sign");
      setFiles([]);
      setDriveFolderId("");
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

  const needsDrive = path !== "caja_local_sign";
  const needsSigs = path !== "caja_publish";

  const buildFormData = () => {
    const fd = new FormData();
    files.forEach((f) => fd.append("files", f));
    if (needsDrive) fd.append("drive_folder_id", driveFolderId.trim());
    if (needsSigs)
      fd.append("signature_ids", JSON.stringify([...selectedSigIds]));
    return fd;
  };

  const removeFile = (index: number) =>
    setFiles((prev) => prev.filter((_, i) => i !== index));

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
    (!needsDrive || driveFolderId.trim().length > 0) &&
    (!needsSigs || selectedSigIds.size > 0);

  // ── phase handlers ──

  const handlePreview = async () => {
    setIsPreviewing(true);
    try {
      const fd = buildFormData();
      let result: AnyPreview;
      if (path === "anses_sign") result = await previewSignJob(semester.id, fd);
      else if (path === "caja_publish")
        result = await previewPublishJob(semester.id, fd);
      else result = await previewCajaSignJob(semester.id, fd);
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
      const fd = buildFormData();
      let created: SignJobResponse;
      if (path === "anses_sign") created = await submitSignJob(semester.id, fd);
      else if (path === "caja_publish")
        created = await submitPublishJob(semester.id, fd);
      else created = await submitCajaSignJob(semester.id, fd);
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

  // Type-narrowed preview accessors.
  const previewWithDrive =
    preview && needsDrive
      ? (preview as SignJobPreviewResponse | PublishPreviewResponse)
      : null;
  const previewWithRotation =
  preview && needsSigs
    ? (preview as {
        rotation_breakdown: RotationBreakdownEntry[];
      })
    : null;

  const canConfirm =
    preview !== null &&
    preview.file_count > 0 &&
    (previewWithDrive === null ||
      (previewWithDrive.drive_folder_valid &&
        previewWithDrive.drive_folder_writable));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${ADMIN_STRINGS.uploadModalTitle} — ${semester.id}`}
      dismissOnBackdrop={
        phase === "choose" ||
        phase === "form" ||
        (phase === "progress" && isTerminal)
      }
    >
      {/* ═══ PHASE 0: Choose path ═══ */}
      {phase === "choose" && (
        <div className="space-y-4">
          <p className="text-sm font-medium text-gray-700">
            {ADMIN_STRINGS.uploadPathLabel}
          </p>
          <div className="space-y-2">
            {(
              ["anses_sign", "caja_publish", "caja_local_sign"] as UploadPath[]
            ).map((p) => (
              <label
                key={p}
                className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                  path === p
                    ? "border-[#2c4264] bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="upload-path"
                  value={p}
                  checked={path === p}
                  onChange={() => setPath(p)}
                  className="mt-1"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {PATH_INFO[p].label}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {PATH_INFO[p].desc}
                  </p>
                </div>
              </label>
            ))}
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
              onClick={() => setPhase("form")}
              className="px-4 py-2 rounded-md bg-[#2c4264] text-sm font-medium text-white hover:bg-[#243652] transition-colors"
            >
              {ADMIN_STRINGS.uploadPathNextButton}
            </button>
          </div>
        </div>
      )}

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
                  return [
                    ...prev,
                    ...incoming.filter((f) => !existingNames.has(f.name)),
                  ];
                });
                e.target.value = "";
              }}
              className="block w-full text-sm text-gray-700 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border file:border-gray-300 file:text-sm file:bg-gray-50 hover:file:bg-gray-100"
            />
            {files.length > 0 && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">
                    {files.length} archivo(s)
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
                    <div
                      key={i}
                      className="flex items-center justify-between px-3 py-1"
                    >
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

          {/* Drive folder (anses_sign and caja_publish only) */}
          {needsDrive && (
            <div>
              <label
                htmlFor="upload-drive"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {ADMIN_STRINGS.signDriveFolderLabel}
              </label>
              <input
                id="upload-drive"
                type="text"
                value={driveFolderId}
                onChange={(e) => setDriveFolderId(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2c4264]"
              />
            </div>
          )}

          {/* Signatures (anses_sign and caja_local_sign only) */}
          {needsSigs && (
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
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setPhase("choose")}
              className="px-4 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {ADMIN_STRINGS.signBackButton}
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
          <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
            <span className="font-medium text-gray-700">Archivos válidos: </span>
            <span className="font-mono text-gray-900">{preview.file_count}</span>
          </div>

          {previewWithDrive && (
            <div className="rounded-md border border-gray-200 p-3 text-sm">
              <span className="font-medium text-gray-700">
                {ADMIN_STRINGS.signPreviewFolder}:{" "}
              </span>
              {previewWithDrive.drive_folder_valid ? (
                <>
                  <span className="text-gray-900">
                    {previewWithDrive.drive_folder_name || driveFolderId}
                  </span>
                  {!previewWithDrive.drive_folder_writable && (
                    <span className="ml-2 text-xs text-red-600">
                      ({ADMIN_STRINGS.signPreviewFolderNotWritable})
                    </span>
                  )}
                </>
              ) : (
                <span className="text-red-600">
                  {ADMIN_STRINGS.signPreviewFolderInvalid}
                </span>
              )}
            </div>
          )}

          {previewWithRotation &&
            previewWithRotation.rotation_breakdown.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-1">
                  {ADMIN_STRINGS.signPreviewRotation}
                </p>
                <table className="w-full text-xs border border-gray-200 rounded overflow-hidden">
                  <tbody className="divide-y divide-gray-100">
                    {previewWithRotation.rotation_breakdown.map((entry) => (
                     <tr key={entry.signature_id} className="bg-white">
                       <td className="px-3 py-1.5 text-gray-800">
                         {entry.signature_name ?? entry.signature_id}
                       </td>
                      <td className="px-3 py-1.5 text-right font-mono text-gray-700">
                       {entry.count}
                     </td>
                   </tr>
                  ))}
                  </tbody>
                </table>
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
              disabled={isSubmitting || !canConfirm}
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
            <ProgressCounter
              label={ADMIN_STRINGS.signTotalFiles}
              value={job.total_files}
            />
            <ProgressCounter
              label={ADMIN_STRINGS.signSigned}
              value={job.signed_count}
              tone="green"
            />
            <ProgressCounter
              label={ADMIN_STRINGS.signErrors}
              value={job.error_count}
              tone={job.error_count > 0 ? "red" : "gray"}
            />
          </div>

          {/* ZIP download — caja_local_sign only */}
          {path === "caja_local_sign" &&
            job.status === "completed" &&
            job.output_zip_url && (
              <a
                href={job.output_zip_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-md bg-green-700 text-sm font-medium text-white hover:bg-green-800 transition-colors"
              >
                {ADMIN_STRINGS.signDownloadZip}
              </a>
            )}

          {/* Error list */}
          {job.error_details && job.error_details.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                {ADMIN_STRINGS.signErrorListHeading} ({job.error_details.length}
                )
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

function ProgressCounter({
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
