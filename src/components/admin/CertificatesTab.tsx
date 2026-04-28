"use client";

import { useEffect, useMemo, useState } from "react";
import { ADMIN_STRINGS } from "@/lib/adminStrings";
import {
  bulkDelete,
  bulkVisibility,
  deleteCertificate,
  getCertificateDownload,
  listCertificates,
  listSemesters,
  patchCertificate,
} from "@/lib/adminApi";
import type {
  CertificateResponse,
  SemesterResponse,
} from "@/types/api";
import UploadCertModal from "./UploadCertModal";
import ConfirmDialog from "./ConfirmDialog";
import { showToast } from "./ToastContainer";

type VisibilityFilter = "all" | "visible" | "hidden";

const ALL_SEMESTERS = "__all__";

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return iso.slice(0, 10);
}

function normalizeDniSearch(raw: string): string {
  return raw.replace(/\D/g, "");
}

export default function CertificatesTab() {
  const [semesters, setSemesters] = useState<SemesterResponse[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<string>("");
  const [dniSearch, setDniSearch] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>("all");

  const [allCertificates, setAllCertificates] = useState<CertificateResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Client-side prefix filter — no backend round-trip for DNI changes.
  const certificates = useMemo(() => {
    const prefix = normalizeDniSearch(dniSearch);
    if (!prefix) return allCertificates;
    return allCertificates.filter((c) => c.dni.startsWith(prefix));
  }, [allCertificates, dniSearch]);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [singleDeleteTarget, setSingleDeleteTarget] = useState<CertificateResponse | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  // Initial: load semesters, default to most recent active.
  useEffect(() => {
    void (async () => {
      try {
        const list = await listSemesters();
        setSemesters(list);
        // Most recent active = first active semester (list is already
        // ordered by start_date desc on the backend).
        const firstActive = list.find((s) => s.status === "active");
        setSelectedSemester(firstActive?.id ?? "");
      } catch {
        showToast({ kind: "error", message: ADMIN_STRINGS.toastNetworkError });
      }
    })();
  }, []);

  // Reload all certs for the current semester/visibility from the backend.
  // DNI filtering is done client-side via the `certificates` memo above.
  useEffect(() => {
    if (semesters.length === 0) return;

    const handle = setTimeout(() => {
      void (async () => {
        setIsLoading(true);
        try {
          const filters: { semester_id?: string; is_visible?: boolean } = {};
          if (selectedSemester && selectedSemester !== ALL_SEMESTERS)
            filters.semester_id = selectedSemester;
          if (visibilityFilter === "visible") filters.is_visible = true;
          else if (visibilityFilter === "hidden") filters.is_visible = false;

          const list = await listCertificates(filters);
          setAllCertificates(list);
          // Drop selections for certs no longer in the backend result.
          setSelectedIds((prev) => {
            const visible = new Set(list.map((c) => c.id));
            const filtered = new Set<string>();
            for (const id of prev) if (visible.has(id)) filtered.add(id);
            return filtered;
          });
        } catch {
          showToast({
            kind: "error",
            message: ADMIN_STRINGS.toastNetworkError,
          });
        } finally {
          setIsLoading(false);
        }
      })();
    }, 500);

    return () => clearTimeout(handle);
  }, [semesters.length, selectedSemester, visibilityFilter]);

  const refreshCertificates = async () => {
    const filters: { semester_id?: string; is_visible?: boolean } = {};
    if (selectedSemester && selectedSemester !== ALL_SEMESTERS)
      filters.semester_id = selectedSemester;
    if (visibilityFilter === "visible") filters.is_visible = true;
    else if (visibilityFilter === "hidden") filters.is_visible = false;
    try {
      const list = await listCertificates(filters);
      setAllCertificates(list);
    } catch {
      showToast({ kind: "error", message: ADMIN_STRINGS.toastNetworkError });
    }
  };

  // ---------- Selection helpers ----------

  const allVisibleSelected = useMemo(
    () =>
      certificates.length > 0 &&
      certificates.every((c) => selectedIds.has(c.id)),
    [certificates, selectedIds],
  );

  const toggleAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(certificates.map((c) => c.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ---------- Mutations ----------

  const toggleVisibilityOptimistic = async (
    cert: CertificateResponse,
    next: boolean,
  ) => {
    const prev = cert.is_visible;
    setAllCertificates((list) =>
      list.map((c) => (c.id === cert.id ? { ...c, is_visible: next } : c)),
    );
    try {
      await patchCertificate(cert.id, { is_visible: next });
    } catch {
      setAllCertificates((list) =>
        list.map((c) => (c.id === cert.id ? { ...c, is_visible: prev } : c)),
      );
      showToast({
        kind: "error",
        message: ADMIN_STRINGS.toastVisibilityChangeFailed,
      });
    }
  };

  const downloadCertificate = async (cert: CertificateResponse) => {
    try {
      const { download_url } = await getCertificateDownload(cert.id);
      window.open(download_url, "_blank", "noopener,noreferrer");
    } catch {
      showToast({ kind: "error", message: ADMIN_STRINGS.toastNetworkError });
    }
  };

  const handleSingleDelete = async () => {
    if (!singleDeleteTarget) return;
    try {
      await deleteCertificate(singleDeleteTarget.id);
      showToast({
        kind: "success",
        message: ADMIN_STRINGS.toastDeleteSuccess,
      });
      setSingleDeleteTarget(null);
      await refreshCertificates();
    } catch {
      showToast({
        kind: "error",
        message: ADMIN_STRINGS.toastDeleteFailed,
      });
    }
  };

  const handleBulkVisibility = async (next: boolean) => {
    setIsBulkProcessing(true);
    const ids = Array.from(selectedIds);
    try {
      const { affected } = await bulkVisibility(ids, next);
      showToast({
        kind: "success",
        message: ADMIN_STRINGS.toastBulkVisibilitySuccess(affected),
      });
      setSelectedIds(new Set());
      await refreshCertificates();
    } catch {
      showToast({
        kind: "error",
        message: ADMIN_STRINGS.toastBulkVisibilityFailed,
      });
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    setIsBulkProcessing(true);
    const ids = Array.from(selectedIds);
    try {
      const { affected } = await bulkDelete(ids);
      showToast({
        kind: "success",
        message: ADMIN_STRINGS.toastBulkDeleteSuccess(affected),
      });
      setSelectedIds(new Set());
      setBulkDeleteOpen(false);
      await refreshCertificates();
    } catch {
      showToast({ kind: "error", message: ADMIN_STRINGS.toastDeleteFailed });
    } finally {
      setIsBulkProcessing(false);
    }
  };

  // ---------- Render ----------

  return (
    <section
      role="tabpanel"
      id="tab-panel-certificates"
      aria-labelledby="tab-certificates"
    >
      {/* Filters */}
      <div className="flex items-end justify-between gap-4 mb-4 flex-wrap">
        <div className="flex items-end gap-3 flex-wrap">
          <div>
            <label
              htmlFor="cert-semester"
              className="block text-xs font-medium text-gray-600 mb-1"
            >
              {ADMIN_STRINGS.certificatesSemesterLabel}
            </label>
            <select
              id="cert-semester"
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2c4264]"
            >
              <option value={ALL_SEMESTERS}>
                {ADMIN_STRINGS.certificatesAllSemesters}
              </option>
              {semesters.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.id} — {s.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="cert-dni"
              className="block text-xs font-medium text-gray-600 mb-1"
            >
              {ADMIN_STRINGS.certificatesDniSearchLabel}
            </label>
            <input
              id="cert-dni"
              type="text"
              inputMode="numeric"
              value={dniSearch}
              onChange={(e) => setDniSearch(e.target.value)}
              placeholder={ADMIN_STRINGS.certificatesDniSearchPlaceholder}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#2c4264]"
            />
          </div>

          <div>
            <label
              htmlFor="cert-vis"
              className="block text-xs font-medium text-gray-600 mb-1"
            >
              {ADMIN_STRINGS.certificatesVisibilityFilter}
            </label>
            <select
              id="cert-vis"
              value={visibilityFilter}
              onChange={(e) =>
                setVisibilityFilter(e.target.value as VisibilityFilter)
              }
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2c4264]"
            >
              <option value="all">{ADMIN_STRINGS.certificatesVisibilityAll}</option>
              <option value="visible">
                {ADMIN_STRINGS.certificatesVisibilityVisible}
              </option>
              <option value="hidden">
                {ADMIN_STRINGS.certificatesVisibilityHidden}
              </option>
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowUpload(true)}
          className="px-4 py-2 rounded-md bg-[#2c4264] text-sm font-medium text-white hover:bg-[#243652] transition-colors"
        >
          {ADMIN_STRINGS.certificatesUploadButton}
        </button>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="sticky top-0 z-10 bg-white border border-gray-200 rounded-md shadow-sm px-4 py-2.5 mb-3 flex items-center justify-between gap-3 animate-fade-in">
          <span className="text-sm font-medium text-gray-700">
            {ADMIN_STRINGS.bulkSelectedCount(selectedIds.size)}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleBulkVisibility(true)}
              disabled={isBulkProcessing}
              className="text-xs px-2.5 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {ADMIN_STRINGS.bulkShow}
            </button>
            <button
              type="button"
              onClick={() => handleBulkVisibility(false)}
              disabled={isBulkProcessing}
              className="text-xs px-2.5 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {ADMIN_STRINGS.bulkHide}
            </button>
            <button
              type="button"
              onClick={() => setBulkDeleteOpen(true)}
              disabled={isBulkProcessing}
              className="text-xs px-2.5 py-1 rounded border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              {ADMIN_STRINGS.bulkDelete}
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="text-xs px-2.5 py-1 text-gray-500 hover:text-gray-700 transition-colors"
            >
              {ADMIN_STRINGS.bulkClearSelection}
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <SkeletonRows />
      ) : certificates.length === 0 ? (
        <div className="text-center py-12 text-sm text-gray-500 bg-white rounded-lg border border-gray-200">
          {ADMIN_STRINGS.certificatesEmpty}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-600">
              <tr>
                <th className="px-3 py-2 w-10">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={(e) => toggleAll(e.target.checked)}
                    aria-label="Seleccionar todos"
                    className="h-4 w-4 rounded text-[#2c4264] focus:ring-[#2c4264]"
                  />
                </th>
                <th className="px-3 py-2 text-left font-medium">
                  {ADMIN_STRINGS.certificateTableDni}
                </th>
                <th className="px-3 py-2 text-left font-medium">
                  {ADMIN_STRINGS.certificateTableSource}
                </th>
                <th className="px-3 py-2 text-left font-medium">
                  {ADMIN_STRINGS.certificateTableVisible}
                </th>
                <th className="px-3 py-2 text-right font-medium">
                  {ADMIN_STRINGS.certificateTableSize}
                </th>
                <th className="px-3 py-2 text-left font-medium">
                  {ADMIN_STRINGS.certificateTableCreated}
                </th>
                <th className="px-3 py-2 text-right font-medium">
                  {ADMIN_STRINGS.certificateTableActions}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {certificates.map((cert) => (
                <tr key={cert.id} className="leading-tight hover:bg-gray-50">
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(cert.id)}
                      onChange={() => toggleOne(cert.id)}
                      aria-label={`Seleccionar ${cert.dni}`}
                      className="h-4 w-4 rounded text-[#2c4264] focus:ring-[#2c4264]"
                    />
                  </td>
                  <td className="px-3 py-2 font-mono text-gray-700">
                    {cert.dni}
                  </td>
                  <td className="px-3 py-2 text-gray-600">
                    {cert.source === "import"
                      ? ADMIN_STRINGS.sourceImport
                      : ADMIN_STRINGS.sourceManual}
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={cert.is_visible}
                      onChange={(e) =>
                        toggleVisibilityOptimistic(cert, e.target.checked)
                      }
                      aria-label={`Visibilidad ${cert.dni}`}
                      className="h-4 w-4 rounded text-[#2c4264] focus:ring-[#2c4264]"
                    />
                  </td>
                  <td className="px-3 py-2 text-right text-gray-600 text-xs">
                    {formatBytes(cert.file_size)}
                  </td>
                  <td className="px-3 py-2 text-gray-600 text-xs">
                    {formatDate(cert.created_at)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="inline-flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => downloadCertificate(cert)}
                        className="text-xs px-2 py-0.5 rounded border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        {ADMIN_STRINGS.certActionDownload}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSingleDeleteTarget(cert)}
                        className="text-xs px-2 py-0.5 rounded border border-red-300 text-red-700 hover:bg-red-50 transition-colors"
                      >
                        {ADMIN_STRINGS.certActionDelete}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      <UploadCertModal
        semesters={semesters}
        defaultSemesterId={
          selectedSemester && selectedSemester !== ALL_SEMESTERS
            ? selectedSemester
            : null
        }
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
        onUploaded={() => void refreshCertificates()}
      />
      <ConfirmDialog
        isOpen={singleDeleteTarget !== null}
        title={ADMIN_STRINGS.confirmDeleteCertificateTitle}
        message={ADMIN_STRINGS.confirmDeleteCertificateMessage}
        onConfirm={handleSingleDelete}
        onCancel={() => setSingleDeleteTarget(null)}
      />
      <ConfirmDialog
        isOpen={bulkDeleteOpen}
        title={ADMIN_STRINGS.confirmBulkDeleteTitle}
        message={ADMIN_STRINGS.confirmBulkDeleteMessage(selectedIds.size)}
        onConfirm={handleBulkDelete}
        onCancel={() => setBulkDeleteOpen(false)}
        isProcessing={isBulkProcessing}
      />
    </section>
  );
}

function SkeletonRows() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 px-4 py-2.5">
        <div className="h-3 bg-gray-200 rounded w-1/3 animate-pulse" />
      </div>
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="px-4 py-2 border-t border-gray-100 flex items-center gap-4"
        >
          <div className="h-3 w-4 bg-gray-200 rounded animate-pulse" />
          <div className="h-3 bg-gray-200 rounded w-20 animate-pulse" />
          <div className="h-3 bg-gray-200 rounded w-16 animate-pulse" />
          <div className="h-3 bg-gray-200 rounded w-12 animate-pulse" />
          <div className="h-3 bg-gray-200 rounded w-12 animate-pulse" />
        </div>
      ))}
    </div>
  );
}
