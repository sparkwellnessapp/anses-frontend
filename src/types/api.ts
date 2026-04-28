/**
 * Admin API types — manually mirror the backend's Pydantic schemas
 * (app/schemas/{semester,certificate,import_job,auth}.py).
 *
 * Kept hand-written, not auto-generated. The surface is small enough
 * that the cost of a code-gen tool exceeds the cost of editing two
 * files when the contract changes.
 */

// ---------- Auth ----------

export interface LoginRequest {
  password: string;
}

export interface TokenResponse {
  token: string;
}

// ---------- Semesters ----------

export type SemesterStatus = "active" | "inactive" | "deleted";

export interface SemesterResponse {
  id: string;
  label: string;
  start_date: string; // YYYY-MM-DD
  end_date: string;
  status: SemesterStatus;
  is_visible: boolean;
  drive_folder_id: string | null;
  certificate_count: number;
  created_at: string; // ISO-8601
  updated_at: string;
}

export interface SemesterCreate {
  id: string;
  label: string;
  start_date: string;
  end_date: string;
  drive_folder_id?: string | null;
}

export interface SemesterUpdate {
  label?: string;
  status?: SemesterStatus;
  is_visible?: boolean;
  drive_folder_id?: string | null;
}

// ---------- Certificates ----------

export type CertificateSource = "import" | "manual";

export interface CertificateResponse {
  id: string;
  semester_id: string;
  dni: string;
  gcs_path: string;
  source: CertificateSource;
  is_visible: boolean;
  file_size: number;
  created_at: string;
  updated_at: string; // ISO-8601; bumped by DB trigger on every UPDATE
}

export interface CertificateUpdate {
  is_visible?: boolean;
}

export interface BulkVisibilityRequest {
  ids: string[];
  is_visible: boolean;
}

export interface BulkDeleteRequest {
  ids: string[];
}

export interface BulkResponse {
  affected: number;
}

export interface AdminDownloadResponse {
  download_url: string;
  expires_at: string;
}

// ---------- Import jobs ----------

export type ImportJobStatus = "pending" | "running" | "completed" | "failed";
export type ImportJobMode = "skip_existing" | "replace";

// Note: triggered_by + pipeline_batch_id are added by Phase 7's webhook
// migration. The frontend already accommodates them so the import-history
// view doesn't require a code change once the backend ships them.
export type ImportJobTriggeredBy = "admin" | "pipeline_webhook";

export interface ImportJobResponse {
  id: string;
  semester_id: string;
  drive_folder_id: string;
  mode: ImportJobMode;
  status: ImportJobStatus;
  triggered_by?: ImportJobTriggeredBy;
  pipeline_batch_id?: string | null;
  total_files: number;
  imported_count: number;
  skipped_count: number;
  error_count: number;
  error_details: Array<Record<string, unknown>> | null;
  started_at: string;
  completed_at: string | null;
}

export interface ImportTriggerRequest {
  drive_folder_id: string;
  mode: ImportJobMode;
}

// ---------- Existing public types (kept) ----------

export interface PublicCertificateResult {
  semester_id: string;
  semester_label: string;
  dni: string;
  download_url: string;
  expires_at: string;
}

export interface PublicLookupResponse {
  results: PublicCertificateResult[];
}

export interface ApiErrorBody {
  detail: string;
  code: string;
}
