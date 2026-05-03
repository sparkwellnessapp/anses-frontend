"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { ADMIN_STRINGS } from "@/lib/adminStrings";
import { AdminApiError, resetPassword } from "@/lib/adminApi";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <p className="text-sm text-red-600 text-center">
        {ADMIN_STRINGS.resetPasswordInvalidToken}
      </p>
    );
  }

  if (success) {
    return (
      <div className="text-center space-y-4">
        <p className="text-sm text-green-700">
          {ADMIN_STRINGS.resetPasswordSuccess}
        </p>
        <button
          type="button"
          onClick={() => router.replace("/admin/login")}
          className="text-sm text-[#2c4264] hover:underline"
        >
          Ir al inicio de sesión
        </button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError(ADMIN_STRINGS.resetPasswordMismatch);
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword(token, newPassword);
      setSuccess(true);
    } catch (err) {
      if (
        err instanceof AdminApiError &&
        (err.code === "invalid_token" || err.code === "password_too_short")
      ) {
        setError(
          err.code === "invalid_token"
            ? ADMIN_STRINGS.resetPasswordInvalidToken
            : err.message,
        );
      } else {
        setError(ADMIN_STRINGS.toastNetworkError);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="new-password"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {ADMIN_STRINGS.resetPasswordNewLabel}
        </label>
        <input
          id="new-password"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          disabled={isSubmitting}
          autoFocus
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2c4264] disabled:bg-gray-50"
        />
      </div>

      <div>
        <label
          htmlFor="confirm-password"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {ADMIN_STRINGS.resetPasswordConfirmLabel}
        </label>
        <input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={isSubmitting}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2c4264] disabled:bg-gray-50"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isSubmitting || !newPassword || !confirmPassword}
        className="w-full px-4 py-2.5 rounded-md bg-[#2c4264] text-sm font-medium text-white hover:bg-[#243652] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting
          ? ADMIN_STRINGS.resetPasswordSubmitting
          : ADMIN_STRINGS.resetPasswordSubmit}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="bg-[#2c4264] text-white py-4">
        <div className="container mx-auto px-4 flex items-center gap-3">
          <Image
            src="/escudo-argentina-lineas-blanco-2024.png"
            alt="Escudo Argentina"
            width={36}
            height={36}
            className="object-contain"
            style={{ mixBlendMode: "screen" }}
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
            {ADMIN_STRINGS.resetPasswordTitle}
          </h2>
          <Suspense
            fallback={
              <div className="h-10 bg-gray-100 rounded animate-pulse" />
            }
          >
            <ResetPasswordForm />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
