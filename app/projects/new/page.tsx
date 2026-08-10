import { redirect } from "next/navigation";

import SiteNav from "@/components/layout/site-nav";
import NewProjectForm from "@/components/projects/new-project-form";
import { createClient } from "@/utils/supabase/server";

export default async function NewProjectPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/projects/new");
  }

  return (
    <main className="min-h-screen bg-[#05070a] text-white">
      <SiteNav signedIn userLabel={user.email || ""} />

      <div className="mx-auto max-w-3xl px-5 py-10 sm:py-14">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-300">
          New video
        </p>

        <h1 className="mt-3 text-4xl font-black tracking-[-0.03em] sm:text-5xl">
          Let&apos;s make your property video.
        </h1>

        <p className="mt-4 max-w-xl text-lg text-white/50">
          Paste your listing below. We&apos;ll keep the rest simple.
        </p>

        <div className="mt-8">
          <NewProjectForm userId={user.id} />
        </div>
      </div>
    </main>
  );
}