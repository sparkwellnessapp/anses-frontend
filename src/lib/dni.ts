/**
 * Client-side DNI normalizer — mirrors backend services/dni.py.
 *
 * Used ONLY for the live "Searching as: 12345678" preview under the
 * input. The backend is still the authoritative validator; this just
 * gives the user instant feedback on what they're about to submit.
 *
 * Returns null when the input cannot be normalized (so the preview
 * just disappears rather than showing an error inline).
 */

const DIGITS_RE = /\D+/g;

export function normalizeDni(raw: string): string | null {
  const digits = raw.replace(DIGITS_RE, "");
  if (!digits) return null;
  if (digits.length === 7) return "0" + digits;
  if (digits.length === 8) return digits;
  return null;
}
