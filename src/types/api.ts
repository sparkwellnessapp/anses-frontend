/**
 * Types mirroring the backend's `PublicLookupResponse` from
 * app/schemas/certificate.py. Kept manually in sync — small surface,
 * not worth code-gen.
 */

export interface PublicCertificateResult {
  semester_id: string;
  semester_label: string;
  dni: string;
  download_url: string;
  expires_at: string; // ISO-8601
}

export interface PublicLookupResponse {
  results: PublicCertificateResult[];
}

export interface ApiErrorBody {
  detail: string;
  code: string;
}
