"use client";

import { useState } from "react";
import { normalizeDni } from "@/lib/dni";
import { t, type Locale } from "@/lib/i18n";

interface DNIFormProps {
  locale: Locale;
  isLoading: boolean;
  inlineError: string | null;
  onSubmit: (dni: string) => void;
}

/**
 * The lookup form: DNI input + submit button.
 *
 * Real <form> element so Enter-to-submit works without a synthetic
 * handler. The submit button is the only action; if isLoading is true,
 * the button shows a spinner and the input is disabled.
 *
 * Below the input, a tiny live preview shows the normalized form of
 * what the user has typed — gives elderly users instant confirmation
 * that "12.345.678" and "12345678" are both interpreted the same way.
 */
export default function DNIForm({
  locale,
  isLoading,
  inlineError,
  onSubmit,
}: DNIFormProps) {
  const [value, setValue] = useState("");

  const normalized = normalizeDni(value);
  const showPreview = value.trim().length > 0 && normalized !== null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isLoading) return;
    if (!value.trim()) return;
    onSubmit(value.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <label
        htmlFor="dni"
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        {t(locale, "inputLabel")}
      </label>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          id="dni"
          name="dni"
          type="tel"
          inputMode="numeric"
          autoComplete="off"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t(locale, "inputPlaceholder")}
          disabled={isLoading}
          aria-invalid={inlineError != null}
          aria-describedby={inlineError ? "dni-error" : "dni-hint"}
          className="flex-1 rounded-md border border-gray-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#2c4264] focus:border-[#2c4264] disabled:bg-gray-50 disabled:text-gray-500"
        />

        <button
          type="submit"
          disabled={isLoading || !value.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-[#2c4264] px-6 py-3 text-base font-medium text-white hover:bg-[#243652] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2c4264] disabled:opacity-60 disabled:cursor-not-allowed transition-colors min-w-[140px]"
        >
          {isLoading ? (
            <>
              <span
                className="inline-block h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin-slow"
                aria-hidden="true"
              />
              {t(locale, "submitButtonLoading")}
            </>
          ) : (
            t(locale, "submitButton")
          )}
        </button>
      </div>

      {/* Hint / live preview / inline error — exactly one of these is
          rendered at a time, prioritized: error > preview > hint. */}
      <div className="mt-2 min-h-[1.25rem] text-sm">
        {inlineError ? (
          <p id="dni-error" className="text-red-600">
            {inlineError}
          </p>
        ) : showPreview ? (
          <p className="text-gray-500">
            {t(locale, "inputNormalizedPrefix")}{" "}
            <span className="font-mono font-semibold text-gray-700">
              {normalized}
            </span>
          </p>
        ) : (
          <p id="dni-hint" className="text-gray-500">
            {t(locale, "inputHint")}
          </p>
        )}
      </div>
    </form>
  );
}
