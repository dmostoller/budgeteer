"use client";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePrivacy } from "@/contexts/privacy-context";

export function PrivacyToggle() {
  const { isPrivacyMode, togglePrivacyMode } = usePrivacy();

  return (
    <Button
      variant="outline"
      size="icon"
      className="bg-transparent hover:bg-accent transition-colors hover:text-foreground"
      onClick={togglePrivacyMode}
    >
      <Eye
        className={`h-[1.2rem] w-[1.2rem] transition-all duration-300 ${
          isPrivacyMode ? "rotate-90 scale-0" : "rotate-0 scale-100"
        }`}
      />
      <EyeOff
        className={`absolute h-[1.2rem] w-[1.2rem] transition-all duration-300 ${
          isPrivacyMode ? "rotate-0 scale-100" : "rotate-90 scale-0"
        }`}
      />
      <span className="sr-only">
        {isPrivacyMode ? "Show financial amounts (Cmd+/)" : "Hide financial amounts (Cmd+/)"}
      </span>
    </Button>
  );
}
