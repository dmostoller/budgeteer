"use client";

import { ModeToggle } from "@/components/mode-toggle";
import { PrivacyToggle } from "@/components/privacy-toggle";

export function DashboardHeaderControls() {
  return (
    <div className="ml-auto flex items-center gap-2">
      <PrivacyToggle />
      <ModeToggle />
    </div>
  );
}
