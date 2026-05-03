"use client";

import { useEffect, useState } from "react";
import { ADMIN_STRINGS } from "@/lib/adminStrings";
import {
  AdminApiError,
  deleteSemester,
  listSemesters,
  patchSemester,
} from "@/lib/adminApi";
import type { SemesterResponse, SemesterStatus } from "@/types/api";
import NewSemesterModal from "./NewSemesterModal";
import ImportModal from "./ImportModal";
import UploadModal from "./UploadModal";
import ConfirmDialog from "./ConfirmDialog";
import { showToast } from "./ToastContainer";

const STATUS_LABEL: Record<SemesterStatus, string> = {
  active: ADMIN_STRINGS.statusActive,
  inactive: ADMIN_STRINGS.statusInactive,
  deleted: ADMIN_STRINGS.statusDeleted,
};

const STATUS_STYLE: Record<SemesterStatus, string> = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-gray-100 text-gray-700",
  deleted: "bg-red-100 text-red-800",
};

export default function SemestersTab() {
  const [semesters, setSemesters] = useState<SemesterResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [importTarget, setImportTarget] = useState<SemesterResponse | null>(null);
  const [signTarget, setSignTarget] = useState<SemesterResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SemesterResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const refresh = async () => {
    try {
      const list = await listSemesters();
      setSemesters(list);
    } catch (err) {
      if (err instanceof AdminApiError && err.status !== 401) {
        showToast({ kind: "error", message: ADMIN_STRINGS.toastNetworkError });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const toggleVisibility = async (sem: SemesterResponse, next: boolean) => {
    // Optimistic update — flip immediately, revert on error.
    const prev = sem.is_visible;
    setSemesters((list) =>
      list.map((s) => (s.id === sem.id ? { ...s, is_visible: next } : s)),
    );
    try {
      await patchSemester(sem.id, { is_visible: next });
    } catch {
      setSemesters((list) =>
        list.map((s) => (s.id === sem.id ? { ...s, is_visible: prev } : s)),
      );
      showToast({
        kind: "error",
        message: ADMIN_STRINGS.toastVisibilityChangeFailed,
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const result = await deleteSemester(deleteTarget.id);
      showToast({
        kind: "success",
        message: ADMIN_STRINGS.toastSemesterDeleted,
      });
      setDeleteTarget(null);
      await refresh();
      if (result.promoted_semester_id) {
        showToast({
          kind: "success",
          message: ADMIN_STRINGS.toastSemesterPromoted(result.promoted_semester_id),
        });
      }
    } catch {
      showToast({
        kind: "error",
        message: ADMIN_STRINGS.toastSemesterDeleteFailed,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section
      role="tabpanel"
      id="tab-panel-semesters"
      aria-labelledby="tab-semesters"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          {ADMIN_STRINGS.semestersHeading}
        </h2>
        <button
          type="button"
          onClick={() => setShowNew(true)}
          className="px-4 py-2 rounded-md bg-[#2c4264] text-sm font-medium text-white hover:bg-[#243652] transition-colors"
        >
          {ADMIN_STRINGS.newSemesterButton}
        </button>
      </div>

      {isLoading ? (
        <SkeletonRows />
      ) : semesters.length === 0 ? (
        <div className="text-center py-12 text-sm text-gray-500 bg-white rounded-lg border border-gray-200">
          {ADMIN_STRINGS.semestersEmpty}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-600">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium">
                  {ADMIN_STRINGS.semesterTableId}
                </th>
                <th className="px-4 py-2.5 text-left font-medium">
                  {ADMIN_STRINGS.semesterTableLabel}
                </th>
                <th className="px-4 py-2.5 text-left font-medium">
                  {ADMIN_STRINGS.semesterTableDates}
                </th>
                <th className="px-4 py-2.5 text-left font-medium">
                  {ADMIN_STRINGS.semesterTableStatus}
                </th>
                <th className="px-4 py-2.5 text-left font-medium">
                  {ADMIN_STRINGS.semesterTableVisible}
                </th>
                <th className="px-4 py-2.5 text-right font-medium">
                  {ADMIN_STRINGS.semesterTableCount}
                </th>
                <th className="px-4 py-2.5 text-right font-medium">
                  {ADMIN_STRINGS.semesterTableActions}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {semesters.map((sem) => (
                <tr key={sem.id} className="leading-tight hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-mono text-gray-700">
                    {sem.id}
                  </td>
                  <td className="px-4 py-2.5 text-gray-900">{sem.label}</td>
                  <td className="px-4 py-2.5 text-gray-600 text-xs">
                    {sem.start_date} → {sem.end_date}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        STATUS_STYLE[sem.status]
                      }`}
                    >
                      {STATUS_LABEL[sem.status]}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <input
                      type="checkbox"
                      checked={sem.is_visible}
                      onChange={(e) =>
                        toggleVisibility(sem, e.target.checked)
                      }
                      disabled={sem.status === "deleted"}
                      aria-label={`Visibilidad de ${sem.id}`}
                      className="h-4 w-4 rounded text-[#2c4264] focus:ring-[#2c4264] disabled:opacity-50"
                    />
                  </td>
                  <td className="px-4 py-2.5 text-right text-gray-700 font-mono">
                    {sem.certificate_count}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="inline-flex gap-2">
                      <button
                        type="button"
                        onClick={() => setImportTarget(sem)}
                        disabled={sem.status === "deleted"}
                        className="text-xs px-2.5 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        {ADMIN_STRINGS.semesterActionImport}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSignTarget(sem)}
                        disabled={sem.status === "deleted"}
                        className="text-xs px-2.5 py-1 rounded border border-[#2c4264] text-[#2c4264] hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        {ADMIN_STRINGS.semesterActionSign}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(sem)}
                        disabled={sem.status === "deleted"}
                        className="text-xs px-2.5 py-1 rounded border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        {ADMIN_STRINGS.semesterActionDelete}
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
      <NewSemesterModal
        isOpen={showNew}
        onClose={() => setShowNew(false)}
        onCreated={() => void refresh()}
      />
      <ImportModal
        semester={importTarget}
        isOpen={importTarget !== null}
        onClose={() => setImportTarget(null)}
        onCompleted={() => void refresh()}
      />
      <UploadModal
        semester={signTarget}
        isOpen={signTarget !== null}
        onClose={() => setSignTarget(null)}
        onCompleted={() => void refresh()}
      />
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title={ADMIN_STRINGS.confirmDeleteSemesterTitle}
        confirmLabel={ADMIN_STRINGS.confirmDeleteSemesterConfirm}
        message={(() => {
          if (!deleteTarget) return "";
          const isActive = deleteTarget.status === "active";
          if (!isActive) {
            return ADMIN_STRINGS.confirmDeleteSemesterMessage(
              deleteTarget.id,
              deleteTarget.certificate_count,
            );
          }
          const promotionTarget = semesters.find(
            (s) => s.id !== deleteTarget.id && s.status !== "deleted",
          );
          return promotionTarget
            ? ADMIN_STRINGS.confirmDeleteSemesterActiveWithPreviousMessage(
                deleteTarget.id,
                promotionTarget.id,
                deleteTarget.certificate_count,
              )
            : ADMIN_STRINGS.confirmDeleteSemesterActiveNoPreviousMessage(
                deleteTarget.id,
                deleteTarget.certificate_count,
              );
        })()}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isProcessing={isDeleting}
      />
    </section>
  );
}

function SkeletonRows() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 px-4 py-2.5">
        <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse" />
      </div>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="px-4 py-3 border-t border-gray-100 flex items-center gap-4"
        >
          <div className="h-3 bg-gray-200 rounded w-20 animate-pulse" />
          <div className="h-3 bg-gray-200 rounded w-32 animate-pulse" />
          <div className="h-3 bg-gray-200 rounded w-24 animate-pulse" />
          <div className="h-3 bg-gray-200 rounded w-16 animate-pulse" />
        </div>
      ))}
    </div>
  );
}
