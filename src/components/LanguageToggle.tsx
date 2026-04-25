"use client";

import type { Locale } from "@/lib/i18n";

interface LanguageToggleProps {
  locale: Locale;
  onChange: (locale: Locale) => void;
  label: string;
}

/**
 * Two-button language toggle. Controlled — the parent owns the
 * locale state. This component just renders and emits change events.
 *
 * Pill-style "ES | EN" matching the previous consulate project.
 * Active language has a white background; inactive is transparent
 * with a subtle border, both keeping the white text legible against
 * the dark blue header.
 */
export default function LanguageToggle({
  locale,
  onChange,
  label,
}: LanguageToggleProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium hidden sm:inline">{label}:</span>
      <div
        role="group"
        aria-label={label}
        className="flex rounded-md overflow-hidden border border-white/30"
      >
        <button
          type="button"
          onClick={() => onChange("es")}
          aria-pressed={locale === "es"}
          className={`px-3 py-1 text-sm font-medium transition-colors ${
            locale === "es"
              ? "bg-white text-[#2c4264]"
              : "bg-transparent text-white hover:bg-white/10"
          }`}
        >
          ES
        </button>
        <button
          type="button"
          onClick={() => onChange("en")}
          aria-pressed={locale === "en"}
          className={`px-3 py-1 text-sm font-medium transition-colors ${
            locale === "en"
              ? "bg-white text-[#2c4264]"
              : "bg-transparent text-white hover:bg-white/10"
          }`}
        >
          EN
        </button>
      </div>
    </div>
  );
}
