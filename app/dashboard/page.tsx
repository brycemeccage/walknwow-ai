"use client";

import Link from "next/link";

const nav = ["Overview", "New Project", "My Projects", "Agent Profile", "Brokerage", "Billing"];

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-[#05070a] text-white">
      <nav className="border-b border-white/10 bg-black/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-2xl font-black">
            WalkNWow<span className="text-cyan-300">.AI</span>
          </Link>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/55">
            Agent Dashboard
          </span>
        </div>
      </nav>

      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[220px_1fr]">
        <aside className="space-y-2">
          {nav.map((item, index) => (
            <button
              key={item}
              className={`w-full rounded-xl px-4 py-3 text-left text-sm font-semibold ${
                index === 0 ? "bg-cyan-300 text-black" : "text-white/55 hover:bg-white/[0.05] hover:text-white"
              }`}
            >
              {item}
            </button>
          ))}
        </aside>

        <section>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-300">Account</p>
              <h1 className="mt-2 text-4xl font-black">Your WalkNWow workspace.</h1>
              <p className="mt-3 text-white/45">Projects, videos, branding and billing in one place.</p>
            </div>
            <Link href="/#studio" className="rounded-xl bg-cyan-300 px-5 py-3 text-center font-bold text-black">
              + New Project
            </Link>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              ["Past videos", "0", "Your completed property videos"],
              ["Active projects", "0", "Listings currently in production"],
              ["Membership", "—", "Plan and billing status"],
            ].map(([label, value, detail]) => (
              <div key={label} className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
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
                Completed orders will appear here with preview, property address, package, date and download.
              </p>
              <div className="mt-6 rounded-2xl border border-dashed border-white/15 p-10 text-center text-sm text-white/30">
                No completed videos yet.
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-7">
              <h2 className="text-xl font-bold">Agent profile</h2>
              <p className="mt-2 text-sm text-white/40">
                Saved once and reused for closing cards across every listing.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {["Headshot", "Full name", "Phone", "Email", "Brokerage", "License #", "Website", "Closing CTA"].map((field) => (
                  <div key={field} className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/35">
                    {field}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-7">
              <h2 className="text-xl font-bold">Brokerage information</h2>
              <p className="mt-2 text-sm text-white/40">
                Company name, office details and logo for branded deliverables.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-7">
              <h2 className="text-xl font-bold">Membership & billing</h2>
              <p className="mt-2 text-sm text-white/40">
                Manage plan, payment methods, purchases, invoices and upgrades. Payment details will be securely handled by Stripe.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
