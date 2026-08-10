export type WalkNWowPackage =
  | "starter"
  | "signature"
  | "estate"
  | "premium";

export type WalkNWowAddon =
  | "4k"
  | "voiceover"
  | "agent_card";

export async function startStripeCheckout({
  projectId,
  packageKey,
  addons = [],
}: {
  projectId: string;
  packageKey: WalkNWowPackage;
  addons?: WalkNWowAddon[];
}) {
  const response = await fetch("/api/checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      projectId,
      package: packageKey,
      addons,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Could not start checkout.");
  }

  window.location.href = data.url;
}
