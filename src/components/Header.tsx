"use client";

import Image from "next/image";
import LanguageToggle from "./LanguageToggle";
import type { Locale } from "@/lib/i18n";

interface HeaderProps {
  title: string;
  subtitle: string;
  languageLabel: string;
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
}

/**
 * Consulate header. Ported from the previous project, with the
 * following changes:
 *   - Title/subtitle now come in as props (different copy per page).
 *   - LanguageToggle is controlled by the parent (single source of
 *     truth for locale state).
 *   - Marked "use client" because it owns interactive controls.
 *
 * The dark-blue brand color #2c4264 is kept inline (matches the
 * previous project; arbitrary Tailwind value avoids a theme indirection
 * for one color).
 */
export default function Header({
  title,
  subtitle,
  languageLabel,
  locale,
  onLocaleChange,
}: HeaderProps) {
  return (
    <header className="bg-[#2c4264] text-white">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/escudo-argentina-lineas-blanco-2024.png"
              alt="Escudo Argentina"
              width={60}
              height={60}
              className="object-contain"
              style={{ mixBlendMode: "screen" }}
              priority
            />
            <div>
              <h1 className="text-xl md:text-2xl font-bold leading-tight">
                {title}
              </h1>
              <p className="text-sm md:text-base text-gray-200">{subtitle}</p>
            </div>
          </div>

          <div className="ml-4">
            <LanguageToggle
              locale={locale}
              onChange={onLocaleChange}
              label={languageLabel}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
