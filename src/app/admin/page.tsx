"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import TabNav, { type AdminTab } from "@/components/admin/TabNav";
import SemestersTab from "@/components/admin/SemestersTab";
import CertificatesTab from "@/components/admin/CertificatesTab";
import SignaturesTab from "@/components/admin/SignaturesTab";

/**
 * Admin shell. Owns the tab state, persisting it in the URL via
 * search params (?tab=semesters | ?tab=certificates) so refresh
 * keeps the admin's place.
 *
 * The tabs themselves render their full content when active. We don't
 * use display:none on the inactive tab — unmounting frees state and
 * stops any in-flight polling cleanly.
 */
export default function AdminPage() {
  const router = useRouter();
  const params = useSearchParams();

  const rawTab = params.get("tab");
  const initial: AdminTab =
    rawTab === "certificates"
      ? "certificates"
      : rawTab === "signatures"
        ? "signatures"
        : "semesters";

  const [tab, setTab] = useState<AdminTab>(initial);

  // Mirror tab → URL so refresh restores it.
  useEffect(() => {
    const next = new URLSearchParams(params.toString());
    next.set("tab", tab);
    router.replace(`/admin?${next.toString()}`);
    // Intentionally not depending on `params` or `router` — we only
    // want to push when `tab` changes from user action.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  return (
    <div className="min-h-screen flex flex-col">
      <AdminHeader />

      <main className="flex-1 container mx-auto px-4 py-8">
        <TabNav active={tab} onChange={setTab} />

        {tab === "semesters" && <SemestersTab />}
        {tab === "certificates" && <CertificatesTab />}
        {tab === "signatures" && <SignaturesTab />}
      </main>
    </div>
  );
}
