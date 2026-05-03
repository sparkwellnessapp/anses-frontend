/**
 * Spanish-only string constants for the admin UI.
 *
 * Why not extend lib/i18n.ts? The admin panel is Spanish-only by design
 * (consul staff, not citizens). Forcing it into the public-page's
 * dual-locale dictionary means either carrying empty English entries
 * forever, or splitting the Locale type — both worse than a separate
 * flat module. Keep the i18n machinery for the page that actually
 * needs it.
 */

export const ADMIN_STRINGS = {
  // Login
  loginTitle: "Acceso administrativo",
  loginPasswordLabel: "Contraseña",
  loginButton: "Ingresar",
  loginButtonLoading: "Ingresando...",
  loginError: "Contraseña incorrecta",

  // Header / navigation
  adminHeaderTitle: "Consulado General en Tel Aviv",
  adminHeaderSubtitle: "Panel administrativo",
  logoutButton: "Cerrar sesión",
  tabSemesters: "Semestres",
  tabCertificates: "Certificados",
  tabSignatures: "Firmas",

  // Semesters tab
  semestersHeading: "Semestres",
  newSemesterButton: "+ Nuevo semestre",
  semesterTableId: "ID",
  semesterTableLabel: "Etiqueta",
  semesterTableDates: "Fechas",
  semesterTableStatus: "Estado",
  semesterTableVisible: "Visible",
  semesterTableCount: "Certificados",
  semesterTableActions: "Acciones",
  statusActive: "Activo",
  statusInactive: "Inactivo",
  statusDeleted: "Eliminado",
  semesterActionImport: "Importar",
  semesterActionSign: "Cargar",
  semesterActionDelete: "Eliminar",
  semestersEmpty: "No hay semestres aún. Crea uno para comenzar.",

  // New semester modal
  newSemesterTitle: "Nuevo semestre",
  newSemesterIdLabel: "ID del semestre",
  newSemesterIdHint: "Formato: AAAA-S1 o AAAA-S2 (ej: 2026-S1)",
  newSemesterIdInvalid: "Formato inválido. Use AAAA-S1 o AAAA-S2.",
  newSemesterLabelLabel: "Etiqueta",
  newSemesterLabelPlaceholder: "ej: I Semestre 2026",
  newSemesterStartLabel: "Fecha de inicio",
  newSemesterEndLabel: "Fecha de fin",
  newSemesterDriveFolderLabel: "ID de carpeta de Drive (opcional)",
  newSemesterDriveFolderHint: "Se puede agregar luego al importar.",
  newSemesterSubmit: "Crear semestre",
  newSemesterSubmitting: "Creando...",
  newSemesterCancel: "Cancelar",

  // Import modal
  importTitle: "Importar desde Drive",
  importDriveFolderLabel: "ID de carpeta de Drive",
  importModeLabel: "Modo",
  importModeSkipExisting: "Omitir existentes",
  importModeSkipExistingHint:
    "Solo importa certificados que aún no estén en la nube.",
  importModeReplace: "Reemplazar todos",
  importModeReplaceHint:
    "Sobrescribe todos los certificados existentes del semestre.",
  importStartButton: "Iniciar importación",
  importStarting: "Iniciando...",
  importInProgress: "Importación en curso",
  importTotalFiles: "Total",
  importImported: "Importados",
  importSkipped: "Omitidos",
  importErrors: "Errores",
  importCompleted: "Importación completada",
  importFailed: "Importación fallida",
  importErrorListHeading: "Errores",
  importCloseButton: "Cerrar",

  // Certificates tab
  certificatesHeading: "Certificados",
  certificatesSemesterLabel: "Semestre",
  certificatesAllSemesters: "Todos los semestres",
  certificatesDniSearchLabel: "Buscar por DNI",
  certificatesDniSearchPlaceholder: "Ingresa un DNI",
  dniSearchHint: "Ingresá 7 u 8 dígitos.",
  certificatesVisibilityFilter: "Visibilidad",
  certificatesVisibilityAll: "Todos",
  certificatesVisibilityVisible: "Visibles",
  certificatesVisibilityHidden: "Ocultos",
  certificatesUploadButton: "+ Subir certificado",
  certificateTableDni: "DNI",
  certificateTableSource: "Origen",
  certificateTableVisible: "Visible",
  certificateTableSize: "Tamaño",
  certificateTableCreated: "Creado",
  certificateTableActions: "Acciones",
  certificatesEmpty: "No hay certificados que coincidan con los filtros.",
  certActionDownload: "Descargar",
  certActionDelete: "Eliminar",
  sourceImport: "Importación",
  sourceManual: "Manual",
  triggeredByAdmin: "Manual",
  triggeredByPipeline: "Auto",

  // Bulk actions
  bulkSelectedCount: (n: number) =>
    n === 1
      ? "1 certificado seleccionado"
      : `${n} certificados seleccionados`,
  bulkHide: "Ocultar seleccionados",
  bulkShow: "Mostrar seleccionados",
  bulkDelete: "Eliminar seleccionados",
  bulkClearSelection: "Limpiar selección",

  // Upload modal
  uploadTitle: "Subir certificado manualmente",
  uploadSemesterLabel: "Semestre",
  uploadDniLabel: "DNI",
  uploadDniPlaceholder: "ej: 12345678 o 12.345.678",
  uploadFileLabel: "Archivo PDF",
  uploadSubmit: "Subir",
  uploadSubmitting: "Subiendo...",
  uploadDuplicateConfirm:
    "Ya existe un certificado para este DNI en este semestre. ¿Reemplazar?",
  uploadReplaceConfirm: "Reemplazar",
  uploadCancel: "Cancelar",
  uploadFileNotPdf: "El archivo no es un PDF válido.",

  // Confirm dialogs
  confirmDeleteSemesterTitle: "Eliminar semestre",
  // Non-active semester: existing behavior, no cascade.
  confirmDeleteSemesterMessage: (id: string, count: number) =>
    `Esta acción eliminará permanentemente el semestre ${id} y sus ${count} certificado(s). No se puede deshacer.`,
  // Active semester with a previous semester to promote.
  confirmDeleteSemesterActiveWithPreviousMessage: (
    deletedId: string,
    promotedId: string,
    count: number,
  ) =>
    `Al eliminar ${deletedId}, todos sus ${count} certificado(s) serán eliminados permanentemente. El semestre ${promotedId} pasará a ser el semestre actual y todos sus certificados volverán a estar públicamente visibles. Esta acción no se puede deshacer.`,
  // Active semester with no previous: system will have zero active semesters.
  confirmDeleteSemesterActiveNoPreviousMessage: (deletedId: string, count: number) =>
    `Al eliminar ${deletedId}, todos sus ${count} certificado(s) serán eliminados permanentemente. No hay semestre anterior, por lo que el sistema quedará sin semestres activos hasta que se cree uno nuevo. Esta acción no se puede deshacer.`,
  confirmDeleteSemesterConfirm: "Eliminar permanentemente",
  confirmDeleteCertificateTitle: "Eliminar certificado",
  confirmDeleteCertificateMessage: "¿Eliminar este certificado? No se puede deshacer.",
  confirmBulkDeleteTitle: "Eliminar certificados",
  confirmBulkDeleteMessage: (n: number) =>
    `¿Eliminar ${n} certificado(s)? No se puede deshacer.`,
  confirmYes: "Eliminar",
  confirmCancel: "Cancelar",

  // Generic
  cancelButton: "Cancelar",
  closeButton: "Cerrar",
  loadingShort: "Cargando...",
  retryButton: "Reintentar",

  // Auth guard
  verifyingSession: "Verificando sesión...",

  // Toasts
  toastVisibilityChangeFailed:
    "No se pudo cambiar la visibilidad. Reintenta.",
  toastBulkVisibilitySuccess: (n: number) =>
    `${n} certificado(s) actualizado(s).`,
  toastBulkVisibilityFailed: "Error al actualizar la visibilidad.",
  toastDeleteSuccess: "Eliminado correctamente.",
  toastDeleteFailed: "No se pudo eliminar. Reintenta.",
  toastBulkDeleteSuccess: (n: number) =>
    `${n} certificado(s) eliminado(s).`,
  toastSemesterCreated: "Semestre creado correctamente.",
  toastSemesterCreateFailed: "No se pudo crear el semestre.",
  toastSemesterDeleted: "Semestre eliminado correctamente.",
  toastSemesterDeleteFailed: "No se pudo eliminar el semestre.",
  toastSemesterPromoted: (id: string) => `El semestre ${id} es ahora el actual.`,
  toastUploadSuccess: "Certificado subido correctamente.",
  toastUploadFailed: "Error al subir el certificado.",
  toastImportStartFailed: "No se pudo iniciar la importación.",
  toastSessionExpired: "Sesión expirada. Por favor inicia sesión de nuevo.",
  toastNetworkError: "Error de red. Verifica tu conexión.",

  // Signatures tab
  signaturesHeading: "Firmas del cónsul",
  sealHeading: "Sello consular",
  signaturesUploadButton: "+ Subir firma",
  sealUploadButton: "Reemplazar sello",
  sealNotUploaded: "Sello no cargado aún.",
  signaturesEmpty: "No hay firmas cargadas aún.",
  signatureNameLabel: "Nombre del firmante",
  signatureNamePlaceholder: "",
  signatureFileLabel: "Imagen PNG de la firma",
  signatureSealFileLabel: "Imagen PNG del sello",
  signatureUploadSubmit: "Subir",
  signatureUploadSubmitting: "Subiendo...",
  signatureUploadCancel: "Cancelar",
  signatureDeleteConfirmTitle: "Eliminar firma",
  signatureDeleteConfirmMessage: (name: string) =>
    `¿Eliminar la firma de "${name}"? No se puede deshacer.`,
  toastSignatureUploaded: "Firma subida correctamente.",
  toastSignatureUploadFailed: "No se pudo subir la firma.",
  toastSignatureDeleted: "Firma eliminada.",
  toastSignatureDeleteFailed: "No se pudo eliminar la firma.",
  toastSealUploaded: "Sello actualizado correctamente.",
  toastSealUploadFailed: "No se pudo actualizar el sello.",
  invalidPngFile: "El archivo debe ser una imagen PNG.",

  // Upload modal (unified — replaces SignModal)
  uploadModalTitle: "Cargar certificados",
  uploadPathLabel: "Tipo de carga",
  uploadPathAnsesSign: "ANSES — Firmar y publicar",
  uploadPathAnsesSignDesc:
    "Firma certificados ANSES y los publica en Drive, GCS y la base de datos.",
  uploadPathCajaPublish: "Caja — Publicar firmados",
  uploadPathCajaPublishDesc:
    "Sube certificados Caja ya firmados (sin volver a firmar).",
  uploadPathCajaLocal: "Caja — Firmar y descargar",
  uploadPathCajaLocalDesc:
    "Firma certificados Caja localmente y descarga un ZIP (no se publica en Drive).",
  uploadPathNextButton: "Continuar",

  // Sign form / preview / progress (reused across all three paths)
  signFilesLabel: "Archivos PDF",
  signDriveFolderLabel: "ID de carpeta de Drive (destino)",
  signSignaturesLabel: "Firmas a utilizar",
  signPreviewButton: "Continuar",
  signPreviewing: "Cargando previsualización...",
  signPreviewFolder: "Carpeta Drive",
  signPreviewFolderInvalid: "No accesible",
  signPreviewFolderNotWritable: "Sin permisos de escritura",
  signPreviewRotation: "Distribución de firmas",
  signBackButton: "Volver",
  signConfirmButton: "Confirmar",
  signSubmitting: "Iniciando...",
  signJobInProgress: "En curso",
  signJobCompleted: "Completado",
  signJobFailed: "Fallido",
  signJobPending: "Pendiente",
  signTotalFiles: "Total",
  signSigned: "Procesados",
  signSkipped: "Omitidos",
  signErrors: "Errores",
  signErrorListHeading: "Errores",
  signCloseButton: "Cerrar",
  signDownloadZip: "Descargar ZIP",
  toastSignJobStartFailed: "No se pudo iniciar la operación.",
  toastSignPreviewFailed: "No se pudo obtener la previsualización.",
  signNoSignaturesAvailable:
    "No hay firmas disponibles. Sube una en la pestaña Firmas.",

  // Password reset
  forgotPasswordLink: "¿Olvidé mi contraseña?",
  forgotPasswordSending: "Enviando...",
  forgotPasswordSent:
    "Se envió un enlace de restablecimiento al correo del administrador.",
  forgotPasswordError: "No se pudo enviar el correo. Reintenta.",
  resetPasswordTitle: "Restablecer contraseña",
  resetPasswordNewLabel: "Nueva contraseña",
  resetPasswordConfirmLabel: "Confirmar contraseña",
  resetPasswordSubmit: "Cambiar contraseña",
  resetPasswordSubmitting: "Guardando...",
  resetPasswordSuccess: "Contraseña actualizada correctamente.",
  resetPasswordInvalidToken:
    "El enlace es inválido, ha expirado o ya fue usado.",
  resetPasswordMismatch: "Las contraseñas no coinciden.",
} as const;

export type AdminStringKey = keyof typeof ADMIN_STRINGS;
