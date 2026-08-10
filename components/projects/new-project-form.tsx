"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/utils/supabase/client";

export default function NewProjectForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [listingUrl, setListingUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const url = listingUrl.trim();

    if (!url) {
      setError("Paste your property listing link first.");
      return;
    }

    try {
      new URL(url);
    } catch {
      setError("Please paste a full listing link, including https://");
      return;
    }

    setSaving(true);
    setError("");

    const supabase = createClient();

    const { data, error: insertError } = await supabase
      .from("projects")
      .insert({
        user_id: userId,
        listing_url: url,
        status: "draft",
      })
      .select("id")
      .single();

    if (insertError || !data?.id) {
      console.error("Create project error:", insertError);
      setError(insertError?.message || "Could not create your project.");
      setSaving(false);
      return;
    }

    router.push(`/projects/${data.id}`);
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 sm:p-7"
    >
      <label
        htmlFor="listing-url"
        className="text-sm font-black text-white"
      >
        Property listing link
      </label>

      <p className="mt-2 text-sm leading-6 text-white/45">
        Paste a Zillow, Weichert, Realtor.com, or other public listing link.
      </p>

      <input
        id="listing-url"
        type="url"
        inputMode="url"
        autoComplete="url"
        placeholder="https://www.weichert.com/..."
        value={listingUrl}
        onChange={(event) => setListingUrl(event.target.value)}
        className="mt-5 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-base text-white outline-none placeholder:text-white/25 focus:border-cyan-300"
      />

      {error && (
        <div className="mt-4 rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="mt-5 w-full rounded-2xl bg-cyan-300 px-6 py-4 text-lg font-black text-black transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? "Creating your video…" : "Continue →"}
      </button>
    </form>
  );
}