"use client";

import { useRouter } from "next/navigation";

import { createClient } from "@/utils/supabase/client";

export default function LogoutButton() {
  const router = useRouter();

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={logout}
      className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white/65 transition hover:bg-white/[0.08] hover:text-white"
    >
      Log out
    </button>
  );
}
