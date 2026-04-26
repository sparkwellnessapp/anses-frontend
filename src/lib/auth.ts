/**
 * Admin auth — token storage helpers.
 *
 * sessionStorage was the explicit choice in the PRD: token disappears
 * when the tab closes, which is the right default for a shared
 * consulate computer. localStorage would persist across tab close,
 * which we don't want.
 *
 * All access goes through these helpers (rather than touching
 * sessionStorage directly) so SSR safety and the storage key are
 * defined in exactly one place.
 */

const TOKEN_KEY = "anses_admin_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(TOKEN_KEY);
}
