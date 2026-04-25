"use client";

import { t, type Locale } from "@/lib/i18n";

interface ErrorStateProps {
  locale: Locale;
}

export default function ErrorState({ locale }: ErrorStateProps) {
  return (
    <div
      className="bg-red-50 border border-red-200 rounded-lg p-6 animate-fade-in"
      role="alert"
    >
      <div className="flex gap-3">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-red-500 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>

        <div>
          <h3 className="text-base font-semibold text-red-900">
            {t(locale, "errorTitle")}
          </h3>
          <p className="mt-1 text-sm text-red-800">
            {t(locale, "errorMessage")}
          </p>
        </div>
      </div>
    </div>
  );
}
