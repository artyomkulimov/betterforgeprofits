import type { ForgeProfileSummary } from "@betterforgeprofits/forge-core/types";
import { CustomSelect } from "@/components/custom-select";

export function ProfilePicker({
  profiles,
  value,
  onChange,
  disabled,
  placeholder,
}: {
  profiles: ForgeProfileSummary[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const options = profiles.map((profile) => ({
    value: profile.profileId,
    label: profile.cuteName ?? "Unnamed Profile",
    detail: [
      profile.selected ? "selected" : null,
      profile.hotmTier ? `HOTM ${profile.hotmTier}` : null,
    ]
      .filter(Boolean)
      .join(" · "),
  }));

  return (
    <div className="block">
      <span className="mb-2 block text-[11px] text-[var(--text-faint)] uppercase tracking-[0.26em]">
        Profile
      </span>
      <CustomSelect
        disabled={disabled}
        onChange={onChange}
        options={options}
        placeholder={placeholder}
        value={value}
      />
    </div>
  );
}
