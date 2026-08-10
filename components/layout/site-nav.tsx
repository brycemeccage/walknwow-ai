"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "@/components/auth/logout-button";

type SiteNavProps = {
  signedIn?: boolean;
  userLabel?: string;
};

export default function SiteNav({
  signedIn = false,
  userLabel = "",
}: SiteNavProps) {
  const pathname = usePathname();

  const items = signedIn
    ? [
        { href: "/home", label: "Home" },
        { href: "/home#studio", label: "New Project" },
        { href: "/dashboard#videos", label: "Past Videos" },
        { href: "/dashboard#profile", label: "Agent Profile" },
        { href: "/dashboard#billing", label: "Billing" },
      ]
    : [
        { href: "/home", label: "Home" },
        { href: "/home#examples", label: "Examples" },
        { href: "/home#pricing", label: "Pricing" },
        { href: "/home#contact", label: "Contact" },
      ];

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#05070a]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/home" className="flex shrink-0 items-center gap-3">
          <span className="flex h-10 w-10 overflow-hidden rounded-xl bg-white">
            <img
              src="/branding/walknwow-logo.png"
              alt="WalkNWow AI logo"
              className="h-full w-full object-cover"
            />
          </span>

          <span className="text-xl font-black sm:text-2xl">
            WalkNWow<span className="text-cyan-300">.AI</span>
          </span>
        </Link>

        <div className="hidden items-center gap-5 text-sm text-white/55 lg:flex">
          {items.map((item) => {
            const active =
              item.href === pathname ||
              (item.href === "/home" && pathname === "/home");

            return (
              <Link
                key={item.href + item.label}
                href={item.href}
                className={`transition hover:text-white ${
                  active ? "text-white" : ""
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          {signedIn ? (
            <>
              {userLabel && (
                <span className="hidden max-w-44 truncate text-sm text-white/40 sm:block">
                  {userLabel}
                </span>
              )}
              <LogoutButton />
            </>
          ) : (
            <>
              <Link
                href="/"
                className="hidden rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white/70 hover:bg-white/[0.05] sm:block"
              >
                Log in
              </Link>

              <Link
                href="/"
                className="rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-bold text-black hover:bg-cyan-200"
              >
                Create account
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="border-t border-white/5 px-3 py-2 lg:hidden">
        <div className="flex gap-2 overflow-x-auto">
          {items.map((item) => (
            <Link
              key={item.href + item.label}
              href={item.href}
              className="whitespace-nowrap rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-white/60"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
