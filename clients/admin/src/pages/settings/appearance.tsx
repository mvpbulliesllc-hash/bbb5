import { Moon, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SettingsSection } from "@/components/list";

/**
 * AppearanceSettings — the admin ships a single dark, liquid-glass theme
 * matched to the MVP Built Bullies marketing site (see theme-provider.tsx,
 * where the light theme was retired). This page states that instead of
 * offering a picker that can't change anything.
 */
export function AppearanceSettings() {
  return (
    <div className="space-y-5 fsh-enter">
      {/* Theme */}
      <SettingsSection
        title="Theme"
        icon={Palette}
        description="The admin ships one theme: black-and-gold liquid glass, matched to the MVP Built Bullies site. The WebGL backdrop and glass surfaces are dark-first, so there is no light mode."
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div
            aria-current="true"
            className="group/card relative overflow-hidden flex flex-col items-start gap-2 rounded-xl border p-4 text-left border-[var(--color-accent-signal)] bg-[oklch(from_var(--color-accent-signal)_l_c_h_/_0.08)]"
          >
            <div className="flex w-full items-center justify-between">
              <span className="grid h-8 w-8 place-items-center rounded-md bg-[oklch(from_var(--color-accent-signal)_l_c_h_/_0.12)] text-[var(--color-accent-signal)]">
                <Moon className="h-4 w-4" />
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-accent-signal)]">
                Active
              </span>
            </div>
            <span className="text-sm font-semibold tracking-tight text-[var(--color-accent-signal)]">
              Dark
            </span>
            <span className="text-xs leading-relaxed text-[var(--color-muted-foreground)]">
              Black-and-gold liquid glass. The only mode, by design.
            </span>
          </div>
        </div>
      </SettingsSection>

      {/* Density — placeholder for a future compact toggle */}
      <SettingsSection
        title="Density"
        icon={Palette}
        description="Compact mode will reduce card padding and row height for data-dense screens — similar to the dashboard's density toggle."
      >
        <Button variant="outline" size="sm" disabled>
          Compact rows · coming soon
        </Button>
      </SettingsSection>
    </div>
  );
}
