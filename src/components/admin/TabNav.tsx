"use client";

import { ADMIN_STRINGS } from "@/lib/adminStrings";

export type AdminTab = "semesters" | "certificates" | "signatures";

interface TabNavProps {
  active: AdminTab;
  onChange: (tab: AdminTab) => void;
}

/**
 * Tab navigation. Controlled — the page owns the active-tab state and
 * pushes URL changes (so refresh keeps the tab).
 *
 * Pill-style tabs with brand-blue active state. Standard ARIA tab
 * semantics — proper roving tab order, role="tablist".
 */
export default function TabNav({ active, onChange }: TabNavProps) {
  const tabs: Array<{ key: AdminTab; label: string }> = [
    { key: "semesters", label: ADMIN_STRINGS.tabSemesters },
    { key: "certificates", label: ADMIN_STRINGS.tabCertificates },
    { key: "signatures", label: ADMIN_STRINGS.tabSignatures },
  ];

  return (
    <div
      role="tablist"
      aria-label="Secciones administrativas"
      className="border-b border-gray-200 mb-6"
    >
      <div className="flex gap-1">
        {tabs.map((tab) => {
          const isActive = active === tab.key;
          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={isActive}
              aria-controls={`tab-panel-${tab.key}`}
              id={`tab-${tab.key}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onChange(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                isActive
                  ? "border-[#2c4264] text-[#2c4264]"
                  : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
