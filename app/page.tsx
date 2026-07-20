"use client";

import { FormEvent, useState } from "react";

export default function Home() {
  const [listingUrl, setListingUrl] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!listingUrl.trim()) {
      setMessage("Please paste a real estate listing link.");
      return;
    }

    try {
      const parsedUrl = new URL(listingUrl);

      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        throw new Error("Invalid protocol");
      }

      setMessage(
        "Your link was accepted. Next, we will connect this form to the AI walkthrough engine."
      );
    } catch {
      setMessage(
        "That does not look like a valid link. Include the full address beginning with https://"
      );
    }
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <nav className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="text-2xl font-bold tracking-tight">
            WalkNWow<span className="text-cyan-400">.AI</span>
          </div>

          <div className="hidden items-center gap-8 text-sm text-white/70 md:flex">
            <a href="#how-it-works" className="transition hover:text-white">
              How it works
            </a>
            <a href="#features" className="transition hover:text-white">
              Features
            </a>
            <a href="#pricing" className="transition hover:text-white">
              Pricing
            </a>
          </div>

          <button
            type="button"
            className="rounded-full border border-white/20 px-5 py-2 text-sm font-medium transition hover:border-white/50 hover:bg-white/10"
          >
            Sign in
          </button>
        </div>
      </nav>

      <section className="relative overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-cyan-500/20 blur-[140px]" />

        <div className="relative mx-auto flex min-h-[760px] max-w-7xl flex-col items-center justify-center px-6 py-24 text-center">
          <div className="mb-6 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200">
            AI-powered real estate walkthroughs
          </div>

          <h1 className="max-w-5xl text-5xl font-bold leading-tight tracking-tight sm:text-6xl lg:text-8xl">
            Turn listing photos into a cinematic walkthrough.
          </h1>

          <p className="mt-7 max-w-3xl text-lg leading-8 text-white/65 sm:text-xl">
            Paste a real estate listing link and let WalkNWow.AI transform the
            property photos into a polished video designed for listings,
            websites and social media.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-10 w-full max-w-3xl rounded-3xl border border-white/15 bg-white/[0.07] p-3 shadow-2xl backdrop-blur"
          >
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="url"
                value={listingUrl}
                onChange={(event) => {
                  setListingUrl(event.target.value);
                  setMessage("");
                }}
                placeholder="Paste a Zillow, Realtor, Airbnb, Vrbo or listing URL"
                aria-label="Real estate listing URL"
                className="min-h-14 flex-1 rounded-2xl border border-white/10 bg-black/50 px-5 text-base text-white outline-none transition placeholder:text-white/35 focus:border-cyan-400"
              />

              <button
                type="submit"
                className="min-h-14 rounded-2xl bg-white px-7 font-semibold text-black transition hover:scale-[1.02] hover:bg-cyan-100"
              >
                Create walkthrough
              </button>
            </div>

            {message && (
              <p className="px-2 pb-1 pt-3 text-left text-sm text-cyan-200">
                {message}
              </p>
            )}
          </form>

          <div className="mt-7 flex flex-wrap justify-center gap-x-7 gap-y-3 text-sm text-white/50">
            <span>✓ No filming required</span>
            <span>✓ Listing photos transformed by AI</span>
            <span>✓ Social-ready exports</span>
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="border-y border-white/10 bg-white/[0.025] px-6 py-24"
      >
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">
              How it works
            </p>
            <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
              From listing link to finished video.
            </h2>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              {
                number: "01",
                title: "Paste the property link",
                description:
                  "Submit a supported listing URL or upload the property photos directly.",
              },
              {
                number: "02",
                title: "AI builds the walkthrough",
                description:
                  "The system organizes the rooms, creates realistic movement and assembles the story.",
              },
              {
                number: "03",
                title: "Download and share",
                description:
                  "Receive polished versions for listing pages, websites and social media.",
              },
            ].map((step) => (
              <article
                key={step.number}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-8"
              >
                <p className="text-sm font-bold text-cyan-300">{step.number}</p>
                <h3 className="mt-8 text-2xl font-semibold">{step.title}</h3>
                <p className="mt-4 leading-7 text-white/55">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="px-6 py-24">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">
              Built for real estate
            </p>
            <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
              Create better property marketing without another photo shoot.
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-8 text-white/60">
              WalkNWow.AI is being designed for agents, property managers,
              vacation-rental hosts, photographers and brokerages.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              "Realistic camera movement",
              "Automatic room ordering",
              "Agent branding",
              "Vertical social versions",
              "Music and captions",
              "1080p and 4K options",
            ].map((feature) => (
              <div
                key={feature}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-white/80"
              >
                <span className="mr-3 text-cyan-300">✦</span>
                {feature}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="px-6 pb-24">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-8 sm:p-12">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">
                Early access
              </p>
              <h2 className="mt-4 text-4xl font-bold">
                Be one of the first to try WalkNWow.AI.
              </h2>
              <p className="mt-4 max-w-2xl text-white/55">
                Pricing and generation options will be added after the core AI
                walkthrough engine is connected.
              </p>
            </div>

            <button
              type="button"
              className="rounded-2xl bg-cyan-300 px-7 py-4 font-semibold text-black transition hover:bg-cyan-200"
            >
              Join early access
            </button>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 px-6 py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 text-sm text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 WalkNWow.AI</p>
          <p>AI-powered property walkthroughs.</p>
        </div>
      </footer>
    </main>
  );
}