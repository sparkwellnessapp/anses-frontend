"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ADMIN_STRINGS } from "@/lib/adminStrings";
import { AdminApiError, login } from "@/lib/adminApi";
import { setToken } from "@/lib/auth";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const { token } = await login(password);
      setToken(token);
      router.replace("/admin");
    } catch (err) {
      if (err instanceof AdminApiError && err.status === 401) {
        setError(ADMIN_STRINGS.loginError);
      } else {
        setError(ADMIN_STRINGS.toastNetworkError);
      }
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Compact header — same brand styling, but smaller. The login
          page is utilitarian; it doesn't need the full main-page header. */}
      <div className="bg-[#2c4264] text-white py-4">
        <div className="container mx-auto px-4 flex items-center gap-3">
          <Image
            src="/escudo-argentina-lineas-blanco-2024.png"
            alt="Escudo Argentina"
            width={36}
            height={36}
            className="object-contain"
            priority
          />
          <div>
            <h1 className="text-base font-semibold leading-tight">
              {ADMIN_STRINGS.adminHeaderTitle}
            </h1>
            <p className="text-xs text-gray-200">
              {ADMIN_STRINGS.adminHeaderSubtitle}
            </p>
          </div>
        </div>
      </div>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 w-full max-w-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 text-center">
            {ADMIN_STRINGS.loginTitle}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {ADMIN_STRINGS.loginPasswordLabel}
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                autoFocus
                aria-invalid={error !== null}
                aria-describedby={error ? "login-error" : undefined}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2c4264] focus:border-[#2c4264] disabled:bg-gray-50"
              />
            </div>

            {error && (
              <p id="login-error" className="text-sm text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !password}
              className="w-full px-4 py-2.5 rounded-md bg-[#2c4264] text-sm font-medium text-white hover:bg-[#243652] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting
                ? ADMIN_STRINGS.loginButtonLoading
                : ADMIN_STRINGS.loginButton}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
