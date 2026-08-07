"use client";

import { Card } from "../ui/Card";
import { Input } from "../ui/Input";

export type BrandingForm = {
  realtorName: string;
  phone: string;
  email: string;
  website: string;
  brokerage: string;
};

export function BrandingPanel({
  value,
  onChange,
}: {
  value: BrandingForm;
  onChange: (value: BrandingForm) => void;
}) {
  const update = (key: keyof BrandingForm, next: string) => {
    onChange({ ...value, [key]: next });
  };

  return (
    <Card className="p-5">
      <p className="text-sm font-semibold">Realtor Branding</p>
      <p className="mt-1 text-xs text-white/40">
        Used on the six-second closing page.
      </p>

      <div className="mt-4 grid gap-3">
        <Input
          placeholder="Realtor name"
          value={value.realtorName}
          onChange={(e) => update("realtorName", e.target.value)}
        />
        <Input
          placeholder="Brokerage"
          value={value.brokerage}
          onChange={(e) => update("brokerage", e.target.value)}
        />
        <Input
          placeholder="Phone"
          value={value.phone}
          onChange={(e) => update("phone", e.target.value)}
        />
        <Input
          placeholder="Email"
          value={value.email}
          onChange={(e) => update("email", e.target.value)}
        />
        <Input
          placeholder="Website"
          value={value.website}
          onChange={(e) => update("website", e.target.value)}
        />
      </div>
    </Card>
  );
}
