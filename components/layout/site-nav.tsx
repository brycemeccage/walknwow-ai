"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import LogoutButton from "@/components/auth/logout-button";
import { createClient } from "@/utils/supabase/client";

export default function SiteNav({
  signedIn = false,
  userLabel = "",
}: {
  signedIn?: boolean;
  userLabel?: string;
}) {
  const [sessionSignedIn, setSessionSignedIn] = useState(signedIn);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      setSessionSignedIn(Boolean(data.user));
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionSignedIn(Boolean(session?.user));
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const isSignedIn = signedIn || sessionSignedIn;

  if (signedIn) {
    return (
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#05070a]/95 text-white backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link href="/home" className="flex items-center gap-3">
            <img
              src="/branding/walknwow-logo.png"
              alt="WalkNWow AI"
              className="h-10 w-10 rounded-xl bg-white object-cover"
            />
            <span className="text-xl font-black">
              WalkNWow<span className="text-cyan-300">.AI</span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="rounded-xl px-4 py-2.5 text-sm font-bold text-white/70 hover:bg-white/[.06]"
            >
              Dashboard
            </Link>

            {userLabel && (
              <span className="hidden text-sm text-white/30 lg:block">
                {userLabel}
              </span>
            )}

            <LogoutButton />
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200/70 bg-[#fffaf4]/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
        <Link href="/home" className="flex items-center gap-3">
          <img
            src="/branding/walknwow-logo.png"
            alt="WalkNWow AI"
            className="h-10 w-10 rounded-xl bg-white object-cover shadow-sm"
          />
          <span className="text-xl font-black text-[#172026]">
            WalkNWow<span className="text-cyan-600">.AI</span>
          </span>
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          <a
            href="/home#how-it-works"
            className="text-sm font-bold text-slate-500 hover:text-cyan-600"
          >
            How It Works
          </a>
          <a
            href="/home#pricing"
            className="text-sm font-bold text-slate-500 hover:text-cyan-600"
          >
            Pricing
          </a>
        </div>

        <div className="flex items-center gap-2">
          {isSignedIn ? (
            <Link
              href="/dashboard"
              className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 hover:text-cyan-600"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 hover:text-cyan-600"
            >
              Log in
            </Link>
          )}

          <Link
            href="/projects/new"
            className="rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-black text-white shadow-sm"
          >
            Create Video
          </Link>
        </div>
      </div>
    </nav>
  );
}