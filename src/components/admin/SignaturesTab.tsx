"use client";

import { useEffect, useRef, useState } from "react";
import { ADMIN_STRINGS } from "@/lib/adminStrings";
import {
  AdminApiError,
  deleteSignature,
  getSeal,
  listSignatures,
  replaceSeal,
  uploadSignature,
} from "@/lib/adminApi";
import type { SealResponse, SignatureResponse } from "@/types/api";
import ConfirmDialog from "./ConfirmDialog";
import Modal from "./Modal";
import { showToast } from "./ToastContainer";

const _PNG_MAGIC = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

async function isPng(file: File): Promise<boolean> {
  const buf = await file.slice(0, 8).arrayBuffer();
  const bytes = new Uint8Array(buf);
  return _PNG_MAGIC.every((b, i) => bytes[i] === b);
}

export default function SignaturesTab() {
  const [signatures, setSignatures] = useState<SignatureResponse[]>([]);
  const [seal, setSeal] = useState<SealResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [showUploadSig, setShowUploadSig] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SignatureResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSealUploading, setIsSealUploading] = useState(false);

  const sealInputRef = useRef<HTMLInputElement>(null);

  const refresh = async () => {
    try {
      const [sigs, sealData] = await Promise.allSettled([
        listSignatures(),
        getSeal(),
      ]);
      if (sigs.status === "fulfilled") setSignatures(sigs.value);
      if (sealData.status === "fulfilled") setSeal(sealData.value);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const handleSealFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!(await isPng(file))) {
      showToast({ kind: "error", message: ADMIN_STRINGS.invalidPngFile });
      e.target.value = "";
      return;
    }
    setIsSealUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const updated = await replaceSeal(fd);
      setSeal(updated);
      showToast({ kind: "success", message: ADMIN_STRINGS.toastSealUploaded });
    } catch {
      showToast({ kind: "error", message: ADMIN_STRINGS.toastSealUploadFailed });
    } finally {
      setIsSealUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteSignature(deleteTarget.id);
      showToast({ kind: "success", message: ADMIN_STRINGS.toastSignatureDeleted });
      setDeleteTarget(null);
      setSignatures((prev) => prev.filter((s) => s.id !== deleteTarget.id));
    } catch {
      showToast({ kind: "error", message: ADMIN_STRINGS.toastSignatureDeleteFailed });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section
      role="tabpanel"
      id="tab-panel-signatures"
      aria-labelledby="tab-signatures"
      className="space-y-10"
    >
      {/* ── Seal section ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">
            {ADMIN_STRINGS.sealHeading}
          </h2>
          <button
            type="button"
            disabled={isSealUploading}
            onClick={() => sealInputRef.current?.click()}
            className="px-3 py-1.5 rounded-md bg-[#2c4264] text-xs font-medium text-white hover:bg-[#243652] disabled:opacity-60 transition-colors"
          >
            {isSealUploading ? ADMIN_STRINGS.signatureUploadSubmitting : ADMIN_STRINGS.sealUploadButton}
          </button>
          <input
            ref={sealInputRef}
            type="file"
            accept="image/png"
            className="hidden"
            onChange={handleSealFileChange}
          />
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          {isLoading ? (
            <div className="h-20 bg-gray-100 rounded animate-pulse w-32" />
          ) : seal ? (
            <div className="flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={seal.preview_url}
                alt="Sello consular"
                className="h-20 object-contain border border-gray-200 rounded bg-gray-50 p-1"
              />
              <div className="text-xs text-gray-500">
                <div className="font-mono">{seal.gcs_path}</div>
                <div className="mt-1">
                  Actualizado: {new Date(seal.updated_at).toLocaleString("es-AR")}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">{ADMIN_STRINGS.sealNotUploaded}</p>
          )}
        </div>
      </div>

      {/* ── Signatures section ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">
            {ADMIN_STRINGS.signaturesHeading}
          </h2>
          <button
            type="button"
            onClick={() => setShowUploadSig(true)}
            className="px-3 py-1.5 rounded-md bg-[#2c4264] text-xs font-medium text-white hover:bg-[#243652] transition-colors"
          >
            {ADMIN_STRINGS.signaturesUploadButton}
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-28 bg-gray-100 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : signatures.length === 0 ? (
          <div className="text-center py-10 text-sm text-gray-500 bg-white rounded-lg border border-gray-200">
            {ADMIN_STRINGS.signaturesEmpty}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {signatures.map((sig) => (
              <div
                key={sig.id}
                className="bg-white rounded-lg border border-gray-200 p-3 flex flex-col gap-2"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={sig.preview_url}
                  alt={sig.name}
                  className="h-16 object-contain bg-gray-50 rounded border border-gray-100"
                />
                <p className="text-xs font-medium text-gray-800 leading-snug">
                  {sig.name}
                </p>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(sig)}
                  className="self-start text-xs px-2 py-0.5 rounded border border-red-300 text-red-700 hover:bg-red-50 transition-colors"
                >
                  {ADMIN_STRINGS.certActionDelete}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload signature modal */}
      <UploadSignatureModal
        isOpen={showUploadSig}
        onClose={() => setShowUploadSig(false)}
        onUploaded={(sig) => {
          setSignatures((prev) => [sig, ...prev]);
          setShowUploadSig(false);
        }}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title={ADMIN_STRINGS.signatureDeleteConfirmTitle}
        message={
          deleteTarget
            ? ADMIN_STRINGS.signatureDeleteConfirmMessage(deleteTarget.name)
            : ""
        }
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isProcessing={isDeleting}
      />
    </section>
  );
}

// ── Upload modal (inline small component) ──

function UploadSignatureModal({
  isOpen,
  onClose,
  onUploaded,
}: {
  isOpen: boolean;
  onClose: () => void;
  onUploaded: (sig: SignatureResponse) => void;
}) {
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setName("");
      setFile(null);
      setFileError(null);
    }
  }, [isOpen]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    if (f && !(await isPng(f))) {
      setFileError(ADMIN_STRINGS.invalidPngFile);
    } else {
      setFileError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !name.trim() || fileError) return;
    setIsSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("name", name.trim());
      fd.append("file", file);
      const sig = await uploadSignature(fd);
      showToast({ kind: "success", message: ADMIN_STRINGS.toastSignatureUploaded });
      onUploaded(sig);
    } catch (err) {
      const msg =
        err instanceof AdminApiError
          ? err.message
          : ADMIN_STRINGS.toastSignatureUploadFailed;
      showToast({ kind: "error", message: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={ADMIN_STRINGS.signaturesUploadButton}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="sig-name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {ADMIN_STRINGS.signatureNameLabel}
          </label>
          <input
            id="sig-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={ADMIN_STRINGS.signatureNamePlaceholder}
            required
            disabled={isSubmitting}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2c4264] disabled:bg-gray-50"
          />
        </div>

        <div>
          <label
            htmlFor="sig-file"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {ADMIN_STRINGS.signatureFileLabel}
          </label>
          <input
            id="sig-file"
            type="file"
            accept="image/png"
            onChange={handleFileChange}
            required
            disabled={isSubmitting}
            className="block w-full text-sm text-gray-700 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border file:border-gray-300 file:text-sm file:bg-gray-50 hover:file:bg-gray-100"
          />
          {fileError && (
            <p className="mt-1 text-xs text-red-600">{fileError}</p>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {ADMIN_STRINGS.signatureUploadCancel}
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !name.trim() || !file || !!fileError}
            className="px-4 py-2 rounded-md bg-[#2c4264] text-sm font-medium text-white hover:bg-[#243652] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting
              ? ADMIN_STRINGS.signatureUploadSubmitting
              : ADMIN_STRINGS.signatureUploadSubmit}
          </button>
        </div>
      </form>
    </Modal>
  );
}
