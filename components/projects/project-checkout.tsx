"use client";

import { useMemo, useState } from "react";

import {
  startStripeCheckout,
  type WalkNWowAddon,
  type WalkNWowPackage,
} from "@/lib/stripe-checkout";

const packages: {
  key: WalkNWowPackage;
  name: string;
  dollars: string;
  cents: string;
  description: string;
  popular?: boolean;
}[] = [
  {
    key: "starter",
    name: "Starter",
    dollars: "$99",
    cents: "99",
    description: "A simple polished property video.",
  },
  {
    key: "signature",
    name: "Signature",
    dollars: "$129",
    cents: "99",
    description: "More photos and a longer tour.",
    popular: true,
  },
  {
    key: "estate",
    name: "Estate",
    dollars: "$149",
    cents: "99",
    description: "Made for larger properties.",
  },
  {
    key: "premium",
    name: "Premium",
    dollars: "$199",
    cents: "99",
    description: "Our biggest property-video package.",
  },
];

const addons: {
  key: WalkNWowAddon;
  name: string;
  dollars: string;
  cents: string;
  description: string;
}[] = [
  {
    key: "4k",
    name: "4K Resolution",
    dollars: "+$34",
    cents: "99",
    description: "Ultra-sharp finished video.",
  },
  {
    key: "voiceover",
    name: "Voice-over",
    dollars: "+$29",
    cents: "99",
    description: "Professional narration.",
  },
  {
    key: "agent_card",
    name: "Real Estate Photo Card",
    dollars: "+$9",
    cents: "99",
    description: "Branded end slide with your agent info.",
  },
];

function Price({
  dollars,
  cents,
  accent = false,
}: {
  dollars: string;
  cents: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`flex items-start ${
        accent ? "text-cyan-300" : "text-white"
      }`}
    >
      <span className="text-3xl font-black">{dollars}</span>
      <span className="ml-0.5 mt-1 text-sm font-black">{cents}</span>
    </div>
  );
}

export default function ProjectCheckout({
  projectId,
}: {
  projectId: string;
}) {
  const [packageKey, setPackageKey] =
    useState<WalkNWowPackage>("signature");
  const [selectedAddons, setSelectedAddons] = useState<WalkNWowAddon[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedPackage = useMemo(
    () => packages.find((item) => item.key === packageKey)!,
    [packageKey]
  );

  function toggleAddon(addon: WalkNWowAddon) {
    setSelectedAddons((current) =>
      current.includes(addon)
        ? current.filter((item) => item !== addon)
        : [...current, addon]
    );
  }

  async function checkout() {
    try {
      setLoading(true);
      setError("");

      await startStripeCheckout({
        projectId,
        packageKey,
        addons: selectedAddons,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not start checkout."
      );
      setLoading(false);
    }
  }

  return (
    <section className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 sm:p-7">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
          Step 1
        </p>
        <h2 className="mt-2 text-3xl font-black tracking-[-0.03em]">
          Choose your video
        </h2>
        <p className="mt-2 text-sm text-white/50">
          Pick one package. You can add extras underneath.
        </p>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {packages.map((item) => {
          const selected = packageKey === item.key;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setPackageKey(item.key)}
              className={`relative rounded-2xl border p-5 text-left transition ${
                selected
                  ? "border-cyan-300 bg-cyan-300/10"
                  : "border-white/10 bg-black/20 hover:border-white/20"
              }`}
            >
              {item.popular && (
                <span className="absolute -top-3 right-4 rounded-full bg-cyan-300 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-[#071014]">
                  ★ Most Popular
                </span>
              )}

              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-black">{item.name}</p>
                  <p className="mt-2 text-sm leading-6 text-white/50">
                    {item.description}
                  </p>
                </div>

                <Price
                  dollars={item.dollars}
                  cents={item.cents}
                  accent={selected}
                />
              </div>

              <div className="mt-5 flex items-center gap-2 text-sm font-bold">
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                    selected
                      ? "border-cyan-300 bg-cyan-300 text-[#071014]"
                      : "border-white/30"
                  }`}
                >
                  {selected ? "✓" : ""}
                </span>
                {selected ? "Selected" : "Choose this package"}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-8 border-t border-white/10 pt-7">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
          Step 2
        </p>
        <h3 className="mt-2 text-2xl font-black">Add extras if you want</h3>
        <p className="mt-2 text-sm text-white/50">
          Totally optional. Tap an extra to add or remove it.
        </p>

        <div className="mt-5 grid gap-3">
          {addons.map((addon) => {
            const checked = selectedAddons.includes(addon.key);

            return (
              <button
                key={addon.key}
                type="button"
                onClick={() => toggleAddon(addon.key)}
                className={`flex items-center justify-between gap-4 rounded-2xl border p-4 text-left transition ${
                  checked
                    ? "border-cyan-300 bg-cyan-300/10"
                    : "border-white/10 bg-black/20 hover:border-white/20"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border ${
                      checked
                        ? "border-cyan-300 bg-cyan-300 font-black text-[#071014]"
                        : "border-white/30"
                    }`}
                  >
                    {checked ? "✓" : ""}
                  </span>

                  <div>
                    <p className="font-black">{addon.name}</p>
                    <p className="mt-1 text-sm text-white/45">
                      {addon.description}
                    </p>
                  </div>
                </div>

                <Price dollars={addon.dollars} cents={addon.cents} />
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-8 rounded-2xl bg-cyan-300 p-5 text-[#071014]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] opacity-60">
              Your package
            </p>
            <p className="mt-1 text-xl font-black">{selectedPackage.name}</p>
            <p className="mt-1 text-sm font-semibold opacity-60">
              {selectedAddons.length === 0
                ? "No extras selected"
                : `${selectedAddons.length} extra${
                    selectedAddons.length === 1 ? "" : "s"
                  } selected`}
            </p>
          </div>

          <Price
            dollars={selectedPackage.dollars}
            cents={selectedPackage.cents}
            accent
          />
        </div>

        <button
          type="button"
          onClick={checkout}
          disabled={loading}
          className="mt-5 w-full rounded-xl bg-[#071014] px-5 py-4 text-base font-black text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Opening secure checkout…" : "Continue to Payment →"}
        </button>

        <p className="mt-3 text-center text-xs font-semibold opacity-55">
          Secure payment powered by Stripe
        </p>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200">
          {error}
        </div>
      )}
    </section>
  );
}
