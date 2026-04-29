/**
 * Admin API client.
 *
 * Single source of truth for every admin endpoint. Each function:
 *   1. Reads the JWT from sessionStorage and adds Authorization header
 *   2. Throws AdminApiError on non-2xx responses (typed `code` + `status`)
 *   3. On 401, the caller's catch handler clears the token and
 *      redirects to /admin/login. We don't redirect from inside the
 *      client — the caller has React-router context, the client
 *      doesn't.
 *
 * Why throw instead of returning a discriminated union (like lib/api.ts
 * does for the public endpoint)? The admin surface has many endpoints,
 * each with different success shapes; a uniform throw-on-error pattern
 * pairs cleanly with try/catch in the React layer, while a discriminated
 * union per endpoint would multiply boilerplate.
 */

import type {
  AdminDownloadResponse,
  BulkResponse,
  BulkVisibilityRequest,
  CertificateResponse,
  CertificateUpdate,
  ImportJobResponse,
  ImportTriggerRequest,
  LoginRequest,
  SealResponse,
  SemesterCreate,
  SemesterResponse,
  SemesterUpdate,
  SignJobPreviewResponse,
  SignJobResponse,
  SignatureResponse,
  TokenResponse,
} from "@/types/api";
import { getToken } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class AdminApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "AdminApiError";
  }

  /** True when the caller should redirect to /admin/login. */
  get isAuthError(): boolean {
    return this.status === 401;
  }
}

// ---------- Internal request helper ----------

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE" | "PUT";
  body?: unknown;
  /** When true, sends FormData (multipart) and skips JSON content-type. */
  formData?: FormData;
  /** When true, skips Authorization header (for /api/auth/login itself). */
  skipAuth?: boolean;
  /** Query-string params; values are stringified and URL-encoded. */
  query?: Record<string, string | number | boolean | undefined>;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const url = new URL(path, API_URL);
  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      if (v !== undefined) url.searchParams.set(k, String(v));
    }
  }

  const headers: Record<string, string> = {};
  if (!opts.skipAuth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  let body: BodyInit | undefined;
  if (opts.formData) {
    body = opts.formData;
    // Don't set content-type — fetch sets multipart/form-data with boundary.
  } else if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.body);
  }

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      method: opts.method ?? "GET",
      headers,
      body,
      cache: "no-store",
    });
  } catch {
    throw new AdminApiError(0, "network", "Network error");
  }

  // 204 No Content — common for DELETE / verify
  if (response.status === 204) {
    return undefined as T;
  }

  if (!response.ok) {
    let detail = response.statusText;
    let code = "unknown";
    try {
      const errBody = await response.json();
      detail = errBody.detail ?? detail;
      code = errBody.code ?? code;
    } catch {
      // ignore — fall back to statusText
    }
    throw new AdminApiError(response.status, code, detail);
  }

  return (await response.json()) as T;
}

// ---------- Auth ----------

export async function login(password: string): Promise<TokenResponse> {
  return request<TokenResponse>("/api/auth/login", {
    method: "POST",
    body: { password } satisfies LoginRequest,
    skipAuth: true,
  });
}

export async function verifyToken(): Promise<void> {
  await request<void>("/api/auth/verify", { method: "POST" });
}

// ---------- Semesters ----------

export function listSemesters(): Promise<SemesterResponse[]> {
  return request<SemesterResponse[]>("/api/admin/semesters");
}

export function createSemester(
  body: SemesterCreate,
): Promise<SemesterResponse> {
  return request<SemesterResponse>("/api/admin/semesters", {
    method: "POST",
    body,
  });
}

export function patchSemester(
  id: string,
  body: SemesterUpdate,
): Promise<SemesterResponse> {
  return request<SemesterResponse>(`/api/admin/semesters/${id}`, {
    method: "PATCH",
    body,
  });
}

export function deleteSemester(id: string): Promise<void> {
  return request<void>(`/api/admin/semesters/${id}`, { method: "DELETE" });
}

// ---------- Imports ----------

export function triggerImport(
  semesterId: string,
  body: ImportTriggerRequest,
): Promise<ImportJobResponse> {
  return request<ImportJobResponse>(
    `/api/admin/semesters/${semesterId}/import`,
    { method: "POST", body },
  );
}

export function getImportJob(jobId: string): Promise<ImportJobResponse> {
  return request<ImportJobResponse>(`/api/admin/import-jobs/${jobId}`);
}

export function listImportJobsForSemester(
  semesterId: string,
): Promise<ImportJobResponse[]> {
  return request<ImportJobResponse[]>(
    `/api/admin/semesters/${semesterId}/import-jobs`,
  );
}

// ---------- Certificates ----------

export interface ListCertificatesFilters {
  semester_id?: string;
  dni?: string;
  is_visible?: boolean;
}

export function listCertificates(
  filters: ListCertificatesFilters = {},
): Promise<CertificateResponse[]> {
  return request<CertificateResponse[]>("/api/admin/certificates", {
    query: {
      semester_id: filters.semester_id,
      dni: filters.dni,
      is_visible: filters.is_visible,
    },
  });
}

export function uploadCertificate(
  formData: FormData,
  replace: boolean = false,
): Promise<CertificateResponse> {
  return request<CertificateResponse>("/api/admin/certificates/upload", {
    method: "POST",
    formData,
    query: { replace },
  });
}

export function patchCertificate(
  id: string,
  body: CertificateUpdate,
): Promise<CertificateResponse> {
  return request<CertificateResponse>(`/api/admin/certificates/${id}`, {
    method: "PATCH",
    body,
  });
}

export function bulkVisibility(
  ids: string[],
  isVisible: boolean,
): Promise<BulkResponse> {
  return request<BulkResponse>("/api/admin/certificates/bulk/visibility", {
    method: "PATCH",
    body: { ids, is_visible: isVisible } satisfies BulkVisibilityRequest,
  });
}

export function deleteCertificate(id: string): Promise<void> {
  return request<void>(`/api/admin/certificates/${id}`, { method: "DELETE" });
}

export function bulkDelete(ids: string[]): Promise<BulkResponse> {
  return request<BulkResponse>("/api/admin/certificates/bulk", {
    method: "DELETE",
    body: { ids },
  });
}

export function getCertificateDownload(
  id: string,
): Promise<AdminDownloadResponse> {
  return request<AdminDownloadResponse>(
    `/api/admin/certificates/${id}/download`,
  );
}

// ---------- Signatures ----------

export function listSignatures(): Promise<SignatureResponse[]> {
  return request<SignatureResponse[]>("/api/admin/signatures");
}

export function uploadSignature(formData: FormData): Promise<SignatureResponse> {
  return request<SignatureResponse>("/api/admin/signatures", {
    method: "POST",
    formData,
  });
}

export function deleteSignature(id: string): Promise<void> {
  return request<void>(`/api/admin/signatures/${id}`, { method: "DELETE" });
}

// ---------- Seal ----------

export function getSeal(): Promise<SealResponse> {
  return request<SealResponse>("/api/admin/seal");
}

export function replaceSeal(formData: FormData): Promise<SealResponse> {
  return request<SealResponse>("/api/admin/seal", { method: "PUT", formData });
}

// ---------- Sign jobs ----------

export function previewSignJob(
  semesterId: string,
  formData: FormData,
): Promise<SignJobPreviewResponse> {
  return request<SignJobPreviewResponse>(
    `/api/admin/semesters/${semesterId}/sign/preview`,
    { method: "POST", formData },
  );
}

export function submitSignJob(
  semesterId: string,
  formData: FormData,
): Promise<SignJobResponse> {
  return request<SignJobResponse>(
    `/api/admin/semesters/${semesterId}/sign`,
    { method: "POST", formData },
  );
}

export function getSignJob(jobId: string): Promise<SignJobResponse> {
  return request<SignJobResponse>(`/api/admin/sign-jobs/${jobId}`);
}

export function listSignJobsForSemester(
  semesterId: string,
): Promise<SignJobResponse[]> {
  return request<SignJobResponse[]>(
    `/api/admin/semesters/${semesterId}/sign-jobs`,
  );
}
