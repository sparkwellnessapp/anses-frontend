/**
 * Lightweight i18n. No library — just a typed dictionary and a helper.
 *
 * Why not next-intl / react-i18next: ~20 strings, two languages, single
 * page. Pulling in a library would add 30–50 KB for what amounts to
 * a key→string lookup. The TypeScript types below give us the same
 * "missing key" safety a library would provide, at zero runtime cost.
 */

export type Locale = "es" | "en";

export const DEFAULT_LOCALE: Locale = "es";

const dictionary = {
  es: {
    headerTitle: "Consulado General en Tel Aviv",
    headerSubtitle: "República Argentina",

    languageLabel: "Idioma",

    pageTitle: "Certificados de Supervivencia",
    pageSubtitle: "Descargue su certificado por número de DNI",

    inputLabel: "Número de DNI",
    inputPlaceholder: "Ej: 12345678 o 12.345.678",
    inputHint: "Ingrese su número de DNI sin importar el formato.",
    inputNormalizedPrefix: "Buscando como:",

    submitButton: "Buscar",
    submitButtonLoading: "Buscando...",

    resultsHeading: "Certificados encontrados",
    resultDownloadButton: "Descargar PDF",
    resultExpiryNotice: "Este enlace expira en 15 minutos.",

    emptyTitle: "No se encontraron certificados",
    emptyMessage:
      "No se encontraron certificados asociados a este DNI. Si cree que esto es un error, verifique el número ingresado o contacte al consulado.",
    emptyResetButton: "Volver a buscar",

    errorTitle: "Ocurrió un error",
    errorMessage:
      "No pudimos completar la consulta. Por favor intente nuevamente en unos minutos.",
    errorInvalidDni: "El DNI ingresado no es válido. Verifique el número.",
  },
  en: {
    headerTitle: "Consulate General in Tel Aviv",
    headerSubtitle: "Argentine Republic",

    languageLabel: "Language",

    pageTitle: "Certificates of Survival",
    pageSubtitle: "Download your certificate by DNI number",

    inputLabel: "DNI number",
    inputPlaceholder: "E.g. 12345678",
    inputHint: "Enter your DNI in any format.",
    inputNormalizedPrefix: "Searching as:",

    submitButton: "Search",
    submitButtonLoading: "Searching...",

    resultsHeading: "Certificates found",
    resultDownloadButton: "Download PDF",
    resultExpiryNotice: "This link expires in 15 minutes.",

    emptyTitle: "No certificates found",
    emptyMessage:
      "No certificates were found for this DNI. If you believe this is an error, please verify the number or contact the consulate.",
    emptyResetButton: "Search again",

    errorTitle: "An error occurred",
    errorMessage:
      "We could not complete the lookup. Please try again in a few minutes.",
    errorInvalidDni: "The DNI entered is not valid. Please verify the number.",
  },
} as const;

// Derive the key type from the canonical (Spanish) dictionary so missing
// keys in `en` would surface as a TypeScript error.
export type TranslationKey = keyof (typeof dictionary)["es"];

export function t(locale: Locale, key: TranslationKey): string {
  return dictionary[locale][key];
}

export const LOCALE_STORAGE_KEY = "anses_locale";
