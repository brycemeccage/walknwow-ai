"use client";

import { FormEvent, useMemo, useState } from "react";

import { createClient } from "@/utils/supabase/client";

export type AgentProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  license_number: string | null;
  website: string | null;
  closing_cta: string | null;
  headshot_url: string | null;
  brokerage_name: string | null;
  brokerage_logo_url: string | null;
  office_phone: string | null;
  office_email: string | null;
  office_address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
};

type Props = {
  userId: string;
  initialProfile: AgentProfile;
};

function clean(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export default function AgentProfileForm({
  userId,
  initialProfile,
}: Props) {
  const supabase = useMemo(() => createClient(), []);

  const [profile, setProfile] = useState<AgentProfile>(initialProfile);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingHeadshot, setIsUploadingHeadshot] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  function update<K extends keyof AgentProfile>(
    key: K,
    value: AgentProfile[K]
  ) {
    setProfile((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function uploadImage(
    file: File,
    kind: "headshot" | "brokerage-logo"
  ) {
    if (!file.type.startsWith("image/")) {
      throw new Error("Please choose an image file.");
    }

    if (file.size > 8 * 1024 * 1024) {
      throw new Error("Please use an image smaller than 8 MB.");
    }

    const extension =
      file.name.split(".").pop()?.toLowerCase() || "jpg";

    const filePath =
      `${userId}/${kind}-${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } =
      await supabase.storage
        .from("agent-assets")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

    if (uploadError) {
      throw uploadError;
    }

    const { data } =
      supabase.storage
        .from("agent-assets")
        .getPublicUrl(filePath);

    return data.publicUrl;
  }

  async function handleHeadshot(file?: File) {
    if (!file) return;

    setIsUploadingHeadshot(true);
    setMessage("");
    setErrorMessage("");

    try {
      const publicUrl =
        await uploadImage(file, "headshot");

      update("headshot_url", publicUrl);

      setMessage(
        "Headshot uploaded. Click Save profile to keep it."
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Headshot upload failed."
      );
    } finally {
      setIsUploadingHeadshot(false);
    }
  }

  async function handleBrokerageLogo(file?: File) {
    if (!file) return;

    setIsUploadingLogo(true);
    setMessage("");
    setErrorMessage("");

    try {
      const publicUrl =
        await uploadImage(file, "brokerage-logo");

      update("brokerage_logo_url", publicUrl);

      setMessage(
        "Brokerage logo uploaded. Click Save profile to keep it."
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Brokerage logo upload failed."
      );
    } finally {
      setIsUploadingLogo(false);
    }
  }

  async function saveProfile(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (isSaving) return;

    setIsSaving(true);
    setMessage("");
    setErrorMessage("");

    try {
      const payload = {
        id: userId,
        email: clean(profile.email ?? ""),
        full_name: clean(profile.full_name ?? ""),
        phone: clean(profile.phone ?? ""),
        license_number: clean(profile.license_number ?? ""),
        website: clean(profile.website ?? ""),
        closing_cta: clean(profile.closing_cta ?? ""),
        headshot_url: clean(profile.headshot_url ?? ""),
        brokerage_name: clean(profile.brokerage_name ?? ""),
        brokerage_logo_url: clean(profile.brokerage_logo_url ?? ""),
        office_phone: clean(profile.office_phone ?? ""),
        office_email: clean(profile.office_email ?? ""),
        office_address: clean(profile.office_address ?? ""),
        city: clean(profile.city ?? ""),
        state: clean(profile.state ?? ""),
        postal_code: clean(profile.postal_code ?? ""),
      };

      const { error } =
        await supabase
          .from("agent_profiles")
          .upsert(payload, {
            onConflict: "id",
          });

      if (error) throw error;

      setMessage("Profile saved.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Profile could not be saved."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form
      onSubmit={saveProfile}
      className="space-y-6"
    >
      <div className="grid gap-6 xl:grid-cols-2">
        <section
          id="profile"
          className="scroll-mt-32 rounded-3xl border border-white/10 bg-white/[0.035] p-7"
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/40">
              {profile.headshot_url ? (
                <img
                  src={profile.headshot_url}
                  alt="Agent headshot"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-xs text-white/30">
                  Headshot
                </span>
              )}
            </div>

            <div className="flex-1">
              <h2 className="text-xl font-bold">
                Agent profile
              </h2>
              <p className="mt-2 text-sm leading-6 text-white/40">
                Saved once and reused for your WalkNWow account and closing cards.
              </p>

              <label className="mt-4 block">
                <span className="text-xs font-semibold uppercase tracking-wide text-white/35">
                  Upload headshot
                </span>
                <input
                  type="file"
                  accept="image/*"
                  disabled={isUploadingHeadshot}
                  onChange={(event) =>
                    handleHeadshot(
                      event.target.files?.[0]
                    )
                  }
                  className="mt-2 block w-full text-sm text-white/50 file:mr-4 file:rounded-xl file:border-0 file:bg-cyan-300 file:px-4 file:py-2 file:font-bold file:text-black"
                />
              </label>
            </div>
          </div>

          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            <Field
              label="Full name"
              value={profile.full_name ?? ""}
              onChange={(value) =>
                update("full_name", value)
              }
            />
            <Field
              label="Phone"
              value={profile.phone ?? ""}
              onChange={(value) =>
                update("phone", value)
              }
            />
            <Field
              label="Email"
              type="email"
              value={profile.email ?? ""}
              onChange={(value) =>
                update("email", value)
              }
            />
            <Field
              label="License #"
              value={profile.license_number ?? ""}
              onChange={(value) =>
                update("license_number", value)
              }
            />
            <Field
              label="Website"
              value={profile.website ?? ""}
              onChange={(value) =>
                update("website", value)
              }
            />
            <Field
              label="Closing CTA"
              value={profile.closing_cta ?? ""}
              placeholder="Call me to schedule a showing"
              onChange={(value) =>
                update("closing_cta", value)
              }
            />
          </div>
        </section>

        <section
          id="brokerage"
          className="scroll-mt-32 rounded-3xl border border-white/10 bg-white/[0.035] p-7"
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white">
              {profile.brokerage_logo_url ? (
                <img
                  src={profile.brokerage_logo_url}
                  alt="Brokerage logo"
                  className="h-full w-full object-contain p-2"
                />
              ) : (
                <span className="text-xs text-black/35">
                  Brokerage logo
                </span>
              )}
            </div>

            <div className="flex-1">
              <h2 className="text-xl font-bold">
                Brokerage information
              </h2>
              <p className="mt-2 text-sm leading-6 text-white/40">
                Company and office details for branded videos and invoices.
              </p>

              <label className="mt-4 block">
                <span className="text-xs font-semibold uppercase tracking-wide text-white/35">
                  Upload brokerage logo
                </span>
                <input
                  type="file"
                  accept="image/*"
                  disabled={isUploadingLogo}
                  onChange={(event) =>
                    handleBrokerageLogo(
                      event.target.files?.[0]
                    )
                  }
                  className="mt-2 block w-full text-sm text-white/50 file:mr-4 file:rounded-xl file:border-0 file:bg-white file:px-4 file:py-2 file:font-bold file:text-black"
                />
              </label>
            </div>
          </div>

          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            <Field
              label="Brokerage name"
              value={profile.brokerage_name ?? ""}
              onChange={(value) =>
                update("brokerage_name", value)
              }
            />
            <Field
              label="Office phone"
              value={profile.office_phone ?? ""}
              onChange={(value) =>
                update("office_phone", value)
              }
            />
            <Field
              label="Office email"
              type="email"
              value={profile.office_email ?? ""}
              onChange={(value) =>
                update("office_email", value)
              }
            />
            <Field
              label="Office address"
              value={profile.office_address ?? ""}
              onChange={(value) =>
                update("office_address", value)
              }
            />
            <Field
              label="City"
              value={profile.city ?? ""}
              onChange={(value) =>
                update("city", value)
              }
            />
            <Field
              label="State"
              value={profile.state ?? ""}
              onChange={(value) =>
                update("state", value)
              }
            />
            <Field
              label="ZIP / postal code"
              value={profile.postal_code ?? ""}
              onChange={(value) =>
                update("postal_code", value)
              }
            />
          </div>
        </section>
      </div>

      {errorMessage && (
        <p className="rounded-2xl border border-red-300/20 bg-red-300/[0.08] px-5 py-4 text-sm text-red-100">
          {errorMessage}
        </p>
      )}

      {message && (
        <p className="rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.08] px-5 py-4 text-sm text-emerald-100">
          {message}
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={
            isSaving ||
            isUploadingHeadshot ||
            isUploadingLogo
          }
          className="rounded-xl bg-cyan-300 px-6 py-3 font-bold text-black transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save profile"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-white/35">
        {label}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none placeholder:text-white/20 focus:border-cyan-300/60"
      />
    </label>
  );
}
