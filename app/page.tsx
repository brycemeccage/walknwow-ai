"use client";

import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#05070a] px-6 py-10 text-white">
      <nav className="mx-auto flex max-w-6xl items-center justify-between">
        <Link href="/home" className="flex items-center gap-3">
          <span className="flex h-10 w-10 overflow-hidden rounded-xl bg-white">
            <img src="/branding/walknwow-logo.png" alt="WalkNWow AI logo" className="h-full w-full object-cover" />
          </span>
          <span className="text-2xl font-black">
            WalkNWow<span className="text-cyan-300">.AI</span>
          </span>
        </Link>
        <Link href="/home" className="text-sm text-white/50 hover:text-white">View website</Link>
      </nav>

      <section className="mx-auto mt-16 max-w-md rounded-[2rem] border border-white/10 bg-white/[0.04] p-8">
        <div className="mx-auto mb-7 flex h-24 w-24 overflow-hidden rounded-[1.75rem] bg-white p-1">
          <img src="/branding/walknwow-logo.png" alt="WalkNWow AI" className="h-full w-full object-cover" />
        </div>
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-300">Agent account</p>
        <h1 className="mt-3 text-4xl font-black">Welcome back.</h1>
        <p className="mt-3 text-sm leading-6 text-white/45">
          Sign in to manage projects, past videos, agent branding, membership and billing.
        </p>

        <div className="mt-8 space-y-4">
          <input type="email" placeholder="Email address" className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 outline-none focus:border-cyan-300/60" />
          <input type="password" placeholder="Password" className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 outline-none focus:border-cyan-300/60" />
          <Link href="/dashboard" className="block rounded-xl bg-cyan-300 px-5 py-3 text-center font-bold text-black hover:bg-cyan-200">
            Log in
          </Link>
        </div>

        <div className="my-6 h-px bg-white/10" />
        <p className="text-center text-sm text-white/45">
          New to WalkNWow? <span className="font-semibold text-cyan-300">Create an account</span>
        </p>
        <p className="mt-4 text-center text-xs text-white/25">
          Secure account authentication, saved projects and billing will be connected next.
        </p>

        <Link
          href="/home"
          className="mt-6 block text-center text-sm font-semibold text-white/45 hover:text-white"
        >
          Not ready to sign in? View the WalkNWow website
        </Link>
      </section>
    </main>
  );
}
