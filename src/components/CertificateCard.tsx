"use client";

import { t, type Locale } from "@/lib/i18n";
import type { PublicCertificateResult } from "@/types/api";

interface CertificateCardProps {
  locale: Locale;
  result: PublicCertificateResult;
}

/**
 * A single result card. Contains:
 *   - Semester label (large, prominent)
 *   - DNI in canonical form (subtle, monospace)
 *   - Big download button — opens the signed URL in a new tab
 *   - Expiry notice — links are short-lived; tell the user
 *
 * target="_blank" + rel="noopener noreferrer" is the safe default for
 * any user-clickable external link.
 */
export default function CertificateCard({
  locale,
  result,
}: CertificateCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {result.semester_label}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            DNI:{" "}
            <span className="font-mono font-medium text-gray-700">
              {result.dni}
            </span>
          </p>
        </div>

        <a
          href={result.download_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-md bg-[#2c4264] px-5 py-3 text-base font-medium text-white hover:bg-[#243652] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2c4264] transition-colors whitespace-nowrap"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 3a1 1 0 011 1v8.586l2.293-2.293a1 1 0 011.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L9 12.586V4a1 1 0 011-1zm-7 12a1 1 0 011 1v1h12v-1a1 1 0 112 0v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          {t(locale, "resultDownloadButton")}
        </a>
      </div>

      <p className="mt-4 text-xs text-gray-500">
        {t(locale, "resultExpiryNotice")}
      </p>
    </div>
  );
}
