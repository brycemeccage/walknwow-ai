import Link from "next/link";
import { redirect } from "next/navigation";

import LogoutButton from "@/components/auth/logout-button";
import { createClient } from "@/utils/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const fullName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : "";

  return (
    <main className="min-h-screen bg-[#05070a] text-white">
      <nav className="border-b border-white/10 bg-black/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/home" className="flex items-center gap-3">
            <span className="flex h-10 w-10 overflow-hidden rounded-xl bg-white">
              <img
                src="/branding/walknwow-logo.png"
                alt="WalkNWow AI logo"
                className="h-full w-full object-cover"
              />
            </span>
            <span className="text-2xl font-black">
              WalkNWow<span className="text-cyan-300">.AI</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-white/40 sm:block">
              {fullName || user.email}
            </span>
            <LogoutButton />
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-300">
              Agent workspace
            </p>
            <h1 className="mt-2 text-4xl font-black">
              {fullName ? `Welcome, ${fullName}.` : "Your WalkNWow dashboard."}
            </h1>
            <p className="mt-3 text-white/45">
              Projects, past videos, branding, membership and billing will live here.
            </p>
          </div>

          <Link
            href="/home#studio"
            className="rounded-xl bg-cyan-300 px-5 py-3 text-center font-bold text-black"
          >
            + New Project
          </Link>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            ["Past videos", "0", "Completed property videos"],
            ["Active projects", "0", "Listings currently in production"],
            ["Membership", "—", "Plan and billing status"],
          ].map(([label, value, detail]) => (
            <div
              key={label}
              className="rounded-3xl border border-white/10 bg-white/[0.035] p-6"
            >
              <p className="text-sm text-white/40">{label}</p>
              <p className="mt-3 text-4xl font-black">{value}</p>
              <p className="mt-2 text-xs text-white/30">{detail}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-7">
            <h2 className="text-xl font-bold">Past videos</h2>
            <p className="mt-2 text-sm text-white/40">
              Finished purchases will appear here with preview, property address,
              package, date and download.
            </p>
            <div className="mt-6 rounded-2xl border border-dashed border-white/15 p-10 text-center text-sm text-white/30">
              No completed videos yet.
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-7">
            <h2 className="text-xl font-bold">Agent profile</h2>
            <p className="mt-2 text-sm text-white/40">
              Your saved headshot and contact information will power every closing card.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                "Headshot",
                "Full name",
                "Phone",
                "Email",
                "Brokerage",
                "License #",
                "Website",
                "Closing CTA",
              ].map((field) => (
                <div
                  key={field}
                  className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/35"
                >
                  {field}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-7">
            <h2 className="text-xl font-bold">Brokerage information</h2>
            <p className="mt-2 text-sm text-white/40">
              Company name, logo, office details and website will be saved to your account.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-7">
            <h2 className="text-xl font-bold">Membership & billing</h2>
            <p className="mt-2 text-sm text-white/40">
              Stripe will handle plans, cards, bank payments, invoices, purchases and upgrades.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
