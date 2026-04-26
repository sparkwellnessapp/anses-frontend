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
  confirmDeleteSemesterMessage: (id: string, count: number) =>
    `Esta acción eliminará permanentemente el semestre ${id} y sus ${count} certificado(s). No se puede deshacer.`,
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
  toastUploadSuccess: "Certificado subido correctamente.",
  toastUploadFailed: "Error al subir el certificado.",
  toastImportStartFailed: "No se pudo iniciar la importación.",
  toastSessionExpired: "Sesión expirada. Por favor inicia sesión de nuevo.",
  toastNetworkError: "Error de red. Verifica tu conexión.",
} as const;

export type AdminStringKey = keyof typeof ADMIN_STRINGS;
