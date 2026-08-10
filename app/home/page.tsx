import Link from "next/link";
import SiteNav from "@/components/layout/site-nav";

const plans = [
  ["Starter", "$99", "A simple polished property video"],
  ["Signature", "$129", "More photos and a longer tour"],
  ["Estate", "$150", "Made for larger properties"],
  ["Premium", "$199", "Voice-over and subtitles included"],
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#fffaf4] text-[#172026]">
      <SiteNav />

      <section className="px-5 pb-14 pt-12 sm:pb-20 sm:pt-20">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="inline-flex rounded-full border border-cyan-200 bg-white px-4 py-2 text-sm font-bold text-cyan-700 shadow-sm">
              ✨ Made for real-estate agents
            </div>

            <h1 className="mt-6 text-5xl font-black leading-[1.03] tracking-[-0.045em] sm:text-6xl">
              Turn your listing photos into a
              <span className="text-cyan-600"> beautiful property video.</span>
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
              Paste your listing. WalkNWow handles the rest.
            </p>

            <Link
              href="/projects/new"
              className="mt-7 inline-flex w-full justify-center rounded-2xl bg-cyan-500 px-7 py-4 text-lg font-black text-white shadow-[0_14px_35px_rgba(6,182,212,.20)] sm:w-auto"
            >
              Create My Video →
            </Link>

            <p className="mt-3 text-sm font-semibold text-slate-400">
              Starting at $99.99
            </p>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-3 shadow-[0_24px_65px_rgba(39,58,71,.12)]">
            <video
              src="/examples/dottie-polak-5-indian-plantation-st.mp4#t=3"
              muted
              controls
              playsInline
              preload="auto"
              className="aspect-video w-full rounded-[1.5rem] bg-black object-cover"
            />
            <p className="px-4 pb-3 pt-4 text-sm font-bold text-slate-500">
              A real WalkNWow property video
            </p>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="px-5 py-12">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-black">It’s really this easy.</h2>
          <div className="mt-7 grid gap-3 md:grid-cols-3">
            {[
              ["1", "Paste your listing"],
              ["2", "We create your video"],
              ["3", "Download & share"],
            ].map(([number, text]) => (
              <div key={number} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-100 font-black text-cyan-700">
                  {number}
                </span>
                <p className="font-black">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="examples" className="px-5 py-14">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-black uppercase tracking-[.18em] text-cyan-600">Featured work</p>
          <h2 className="mt-3 text-4xl font-black tracking-[-.03em]">
            See what your listing can become.
          </h2>
          <div className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-3 shadow-lg">
            <video
              src="/examples/dottie-polak-5-indian-plantation-st.mp4#t=3"
              muted
              controls
              playsInline
              preload="auto"
              className="aspect-video w-full rounded-[1.5rem] bg-black object-cover"
            />
          </div>
        </div>
      </section>

      <section id="pricing" className="bg-white px-5 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-4xl font-black tracking-[-.03em]">Simple pricing.</h2>
            <p className="mt-3 text-slate-500">Choose the property size. We do the rest.</p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-[1.75rem] border border-slate-200 bg-[#fffaf4] p-6">
              <h3 className="text-xl font-black">Starter</h3>
              <p className="mt-3 flex items-start gap-0.5 text-4xl font-black">$99<span className="mt-1 text-base font-black">99</span></p>
              <p className="mt-4 text-sm leading-6 text-slate-500">
                A simple polished property video
              </p>
            </div>

            <div className="relative rounded-[1.75rem] border border-cyan-300 bg-cyan-50 p-6 shadow-[0_18px_45px_rgba(6,182,212,.12)]">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-cyan-500 px-4 py-1.5 text-xs font-black uppercase tracking-wide text-white">
                ★ Most Popular
              </div>
              <h3 className="text-xl font-black">Signature</h3>
              <p className="mt-3 flex items-start gap-0.5 text-4xl font-black text-cyan-600">$129<span className="mt-1 text-base font-black">99</span></p>
              <p className="mt-4 text-sm leading-6 text-slate-500">
                More photos and a longer tour
              </p>
            </div>

            <div className="rounded-[1.75rem] border border-slate-200 bg-[#fffaf4] p-6">
              <h3 className="text-xl font-black">Estate</h3>
              <p className="mt-3 flex items-start gap-0.5 text-4xl font-black">$149<span className="mt-1 text-base font-black">99</span></p>
              <p className="mt-4 text-sm leading-6 text-slate-500">
                Made for larger properties
              </p>
            </div>

            <div className="rounded-[1.75rem] border border-slate-200 bg-[#fffaf4] p-6">
              <h3 className="text-xl font-black">Premium</h3>
              <p className="mt-3 flex items-start gap-0.5 text-4xl font-black">$199<span className="mt-1 text-base font-black">99</span></p>
              <p className="mt-4 text-sm leading-6 text-slate-500">
                Our biggest property-video package
              </p>
            </div>
          </div>

          <div className="mt-7 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-black">Add-ons</h3>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <div className="flex items-center justify-between rounded-2xl bg-[#f5fbfd] p-4">
                <div>
                  <p className="font-black text-cyan-700">4K Resolution</p>
                  <p className="mt-1 text-sm text-slate-500">Ultra-sharp finished video</p>
                </div>
                <p className="flex items-start gap-0.5 text-lg font-black">+$34<span className="mt-0.5 text-[11px] font-black">99</span></p>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-[#f5fbfd] p-4">
                <div>
                  <p className="font-black text-cyan-700">Voice-over</p>
                  <p className="mt-1 text-sm text-slate-500">Professional narration</p>
                </div>
                <p className="flex items-start gap-0.5 text-lg font-black">+$29<span className="mt-0.5 text-[11px] font-black">99</span></p>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-[#f5fbfd] p-4">
                <div>
                  <p className="font-black text-cyan-700">Real Estate Photo Card</p>
                  <p className="mt-1 text-sm text-slate-500">Branded end slide with agent info</p>
                </div>
                <p className="flex items-start gap-0.5 text-lg font-black">+$9<span className="mt-0.5 text-[11px] font-black">99</span></p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-14">
        <div className="mx-auto grid max-w-6xl gap-6 rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm md:grid-cols-[.9fr_1.4fr] md:p-9">
          <div className="rounded-[1.5rem] bg-[#fffaf4] p-6 text-center">
            <p className="text-xs font-black uppercase tracking-[.2em] text-slate-400">
              Used by agents at
            </p>
            <p className="mt-4 text-3xl font-black">
              Weichert <span className="font-medium text-slate-500">REALTORS®</span>
            </p>
            <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-slate-500">
              Built to help real-estate agents market listings with polished video while saving editing time.
            </p>
            <p className="mx-auto mt-5 max-w-md text-[11px] leading-5 text-slate-400">
              “Used by agents at” refers to individual real-estate professionals using or testing WalkNWow and does not imply a corporate endorsement or partnership.
            </p>
          </div>

          <div>
            <h3 className="text-3xl font-black tracking-[-.03em]">
              WalkNWow helps agents <span className="text-cyan-600">win more.</span>
            </h3>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 p-5">
                <p className="text-2xl">📈</p>
                <p className="mt-3 font-black">Attract more buyers</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Give listings a more engaging way to stand out online.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 p-5">
                <p className="text-2xl">⏱️</p>
                <p className="mt-3 font-black">Save hours</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  WalkNWow handles the video creation so you can focus on clients.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 p-5">
                <p className="text-2xl">✨</p>
                <p className="mt-3 font-black">Look more professional</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Deliver polished marketing without learning editing software.
                </p>
              </div>
            </div>

            <p className="mt-6 text-center text-sm font-semibold text-slate-500">
              More engagement. More showings. More opportunities. That’s the power of video.
            </p>
          </div>
        </div>
      </section>

      <section id="contact" className="px-5 pb-20 pt-6">
        <div className="mx-auto max-w-5xl rounded-[2rem] bg-cyan-500 p-8 text-center text-white sm:p-12">
          <h2 className="text-4xl font-black">Ready for your next listing?</h2>
          <p className="mt-3 text-cyan-50">Questions? walknwowai@gmail.com</p>
          <Link
            href="/projects/new"
            className="mt-7 inline-flex rounded-2xl bg-white px-7 py-4 text-lg font-black text-cyan-700"
          >
            Create My Video →
          </Link>
        </div>
      </section>
    </main>
  );
}