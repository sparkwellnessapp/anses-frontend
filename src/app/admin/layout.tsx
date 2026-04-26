"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ADMIN_STRINGS } from "@/lib/adminStrings";
import { AdminApiError, verifyToken } from "@/lib/adminApi";
import { clearToken, getToken } from "@/lib/auth";
import ToastContainer, { showToast } from "@/components/admin/ToastContainer";

/**
 * Admin layout — auth guard.
 *
 * Pattern:
 *   1. On mount, if no token: redirect to /admin/login
 *   2. Otherwise call /api/auth/verify to check the token is still valid
 *   3. While checking: show a centered "Verificando..." spinner
 *   4. On 401: clear the token, redirect to login
 *   5. On success: render children
 *
 * The login page is exempt — it lives under /admin/login but doesn't
 * need the guard. We detect that via pathname.
 */

type Phase = "checking" | "ok" | "redirecting";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>("checking");

  // The login page renders without the auth guard. Detect by pathname.
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) {
      setPhase("ok");
      return;
    }

    let cancelled = false;

    void (async () => {
      const token = getToken();
      if (!token) {
        if (!cancelled) {
          setPhase("redirecting");
          router.replace("/admin/login");
        }
        return;
      }

      try {
        await verifyToken();
        if (!cancelled) setPhase("ok");
      } catch (err) {
        if (cancelled) return;
        if (err instanceof AdminApiError && err.isAuthError) {
          clearToken();
          showToast({
            kind: "error",
            message: ADMIN_STRINGS.toastSessionExpired,
          });
        }
        setPhase("redirecting");
        router.replace("/admin/login");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoginPage, router]);

  return (
    <>
      {phase === "checking" || phase === "redirecting" ? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span
              className="inline-block h-4 w-4 rounded-full border-2 border-[#2c4264] border-t-transparent animate-spin-slow"
              aria-hidden="true"
            />
            {ADMIN_STRINGS.verifyingSession}
          </div>
        </div>
      ) : (
        children
      )}
      <ToastContainer />
    </>
  );
}
