"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import DNIForm from "@/components/DNIForm";
import CertificateCard from "@/components/CertificateCard";
import EmptyState from "@/components/EmptyState";
import ErrorState from "@/components/ErrorState";
import { lookupCertificates } from "@/lib/api";
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  t,
  type Locale,
} from "@/lib/i18n";
import type { PublicCertificateResult } from "@/types/api";

/**
 * The lookup page — orchestrates locale, the lookup state machine,
 * and result rendering.
 *
 * State shape:
 *   - locale: which language is shown. Persisted in localStorage so
 *     a returning user keeps their preference.
 *   - status: discriminated union — idle | loading | success | empty | error
 *   - inlineError: validation error shown directly under the input
 *     (separate from the top-level ErrorState card).
 *
 * Why a discriminated union and not separate booleans: each render
 * shows exactly ONE of {form-only, results, empty, error}. A union
 * makes that mutual exclusivity impossible to violate.
 */

type LookupStatus =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; results: PublicCertificateResult[] }
  | { kind: "empty" }
  | { kind: "error" };

export default function CertificadosPage() {
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);
  const [status, setStatus] = useState<LookupStatus>({ kind: "idle" });
  const [inlineError, setInlineError] = useState<string | null>(null);

  // Restore language preference on mount. Doing this in an effect
  // (rather than a useState initializer) avoids hydration mismatch:
  // the server renders DEFAULT_LOCALE, then the client updates if a
  // different one was stored.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored === "es" || stored === "en") {
      setLocale(stored);
    }
  }, []);

  // Persist language changes.
  const handleLocaleChange = (next: Locale) => {
    setLocale(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    }
  };

  const handleSubmit = async (dni: string) => {
    setInlineError(null);
    setStatus({ kind: "loading" });

    const result = await lookupCertificates(dni);

    if (result.kind === "invalid_dni") {
      setInlineError(t(locale, "errorInvalidDni"));
      setStatus({ kind: "idle" });
      return;
    }

    if (result.kind === "error") {
      setStatus({ kind: "error" });
      return;
    }

    if (result.data.results.length === 0) {
      setStatus({ kind: "empty" });
      return;
    }

    setStatus({ kind: "success", results: result.data.results });
  };

  const handleReset = () => {
    setStatus({ kind: "idle" });
    setInlineError(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        title={t(locale, "headerTitle")}
        subtitle={t(locale, "headerSubtitle")}
        languageLabel={t(locale, "languageLabel")}
        locale={locale}
        onLocaleChange={handleLocaleChange}
      />

      <main className="flex-1 container mx-auto px-4 py-12 md:py-16">
        {/* Page heading — always present, regardless of state */}
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            {t(locale, "pageTitle")}
          </h2>
          <p className="mt-3 text-base md:text-lg text-gray-600">
            {t(locale, "pageSubtitle")}
          </p>
          <p className="mt-2 text-sm text-gray-500">
            {t(locale, "pageExpiryNotice")}
          </p>
        </div>

        {/* Lookup form — always rendered. Disabled while loading. */}
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8">
          <DNIForm
            locale={locale}
            isLoading={status.kind === "loading"}
            inlineError={inlineError}
            onSubmit={handleSubmit}
          />
        </div>

        {/* Results region — exactly one of these renders at a time.
            aria-live so screen readers announce when results arrive. */}
        <div
          className="max-w-2xl mx-auto mt-8"
          aria-live="polite"
          aria-atomic="false"
        >
          {status.kind === "success" && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                {t(locale, "resultsHeading")}
              </h3>
              {status.results.map((r) => (
                <CertificateCard
                  key={r.id}
                  locale={locale}
                  result={r}
                />
              ))}
            </div>
          )}

          {status.kind === "empty" && (
            <EmptyState locale={locale} onReset={handleReset} />
          )}

          {status.kind === "error" && <ErrorState locale={locale} />}
        </div>
      </main>
    </div>
  );
}
