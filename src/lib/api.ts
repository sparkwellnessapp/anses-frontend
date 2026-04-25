import type {
  ApiErrorBody,
  PublicLookupResponse,
} from "@/types/api";

/**
 * Typed fetch wrapper for the public lookup endpoint.
 *
 * Returns a discriminated result rather than throwing — the page
 * handles three distinct outcomes (success, validation error, generic
 * error) and a thrown exception conflates them.
 */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type LookupResult =
  | { kind: "ok"; data: PublicLookupResponse }
  | { kind: "invalid_dni"; message: string }
  | { kind: "error"; message: string };

export async function lookupCertificates(dni: string): Promise<LookupResult> {
  const url = new URL("/api/public/certificates", API_URL);
  url.searchParams.set("dni", dni);

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      method: "GET",
      // No credentials — the public endpoint is unauthenticated.
      // Cache: no-store. Each lookup is a live query; previous results
      // would conflict with signed-URL expiry.
      cache: "no-store",
    });
  } catch {
    // Network failure (offline, DNS, CORS preflight blocked, etc.)
    return { kind: "error", message: "network" };
  }

  if (response.ok) {
    const data = (await response.json()) as PublicLookupResponse;
    return { kind: "ok", data };
  }

  // Parse the error body if possible. Backend always returns
  // { detail, code } per the error contract; if it doesn't (e.g.,
  // a stray Cloud Run 502), fall back to a generic error.
  let body: ApiErrorBody | null = null;
  try {
    body = (await response.json()) as ApiErrorBody;
  } catch {
    // ignore
  }

  if (response.status === 400 && body?.code === "invalid_dni") {
    return { kind: "invalid_dni", message: body.detail };
  }

  return { kind: "error", message: body?.detail ?? "unknown" };
}
