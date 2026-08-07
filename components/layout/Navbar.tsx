export function Navbar() {
  return (
    <nav className="border-b border-white/10 bg-black/20 backdrop-blur">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-5 py-4 lg:px-8">
        <div>
          <p className="text-xl font-bold tracking-tight">
            WalkNWow<span className="text-cyan-300">.AI</span>
          </p>
          <p className="text-xs text-white/35">AI Production Studio</p>
        </div>

        <div className="flex items-center gap-3">
          <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs text-emerald-100">
            System Online
          </span>
          <div className="h-9 w-9 rounded-full border border-white/10 bg-white/5" />
        </div>
      </div>
    </nav>
  );
}
