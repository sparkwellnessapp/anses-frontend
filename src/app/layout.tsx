import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Certificados de Supervivencia — Consulado General en Tel Aviv",
  description:
    "Descargue su certificado de supervivencia por número de DNI. Consulado General de la República Argentina en Tel Aviv.",
};

/**
 * Root layout. Intentionally thin — the header is rendered at the page
 * level because it consumes locale state, which is owned by the page
 * component (no global context, no provider tree). If we add more
 * pages later, we can promote shared layout pieces here.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
