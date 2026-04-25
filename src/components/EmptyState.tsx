"use client";

import { t, type Locale } from "@/lib/i18n";

interface EmptyStateProps {
  locale: Locale;
  onReset: () => void;
}

export default function EmptyState({ locale, onReset }: EmptyStateProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-8 text-center animate-fade-in">
      <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {t(locale, "emptyTitle")}
      </h3>

      <p className="text-sm text-gray-600 max-w-md mx-auto mb-6">
        {t(locale, "emptyMessage")}
      </p>

      <button
        type="button"
        onClick={onReset}
        className="inline-flex items-center px-5 py-2 rounded-md border border-[#2c4264] text-[#2c4264] hover:bg-[#2c4264] hover:text-white transition-colors text-sm font-medium"
      >
        {t(locale, "emptyResetButton")}
      </button>
    </div>
  );
}
