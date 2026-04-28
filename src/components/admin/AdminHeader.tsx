"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ADMIN_STRINGS } from "@/lib/adminStrings";
import { clearToken } from "@/lib/auth";

/**
 * Admin header — same brand identity as the public Header, with:
 *   - Subtitle "Panel administrativo" (vs. "República Argentina" public)
 *   - "Cerrar sesión" button replaces the language toggle
 *   - No locale state (admin is Spanish-only)
 */
export default function AdminHeader() {
  const router = useRouter();

  const handleLogout = () => {
    clearToken();
    router.replace("/admin/login");
  };

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
                {ADMIN_STRINGS.adminHeaderTitle}
              </h1>
              <p className="text-sm md:text-base text-gray-200">
                {ADMIN_STRINGS.adminHeaderSubtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="px-4 py-2 rounded-md border border-white/30 text-sm font-medium text-white hover:bg-white/10 transition-colors"
          >
            {ADMIN_STRINGS.logoutButton}
          </button>
        </div>
      </div>
    </header>
  );
}
