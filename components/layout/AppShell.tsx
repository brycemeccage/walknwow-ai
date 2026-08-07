import type { ReactNode } from "react";
import { Navbar } from "./Navbar";

export function AppShell({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#05070A] text-white">
      <Navbar />
      <div className="mx-auto max-w-[1600px] px-5 py-6 lg:px-8">
        {children}
      </div>
    </main>
  );
}
