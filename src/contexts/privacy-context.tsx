"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

interface PrivacyContextType {
  isPrivacyMode: boolean;
  togglePrivacyMode: () => void;
}

const PrivacyContext = createContext<PrivacyContextType | undefined>(undefined);

export function PrivacyProvider({ children }: { children: React.ReactNode }) {
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Load privacy mode from localStorage on mount
    const savedPrivacyMode = localStorage.getItem("budgeteer_privacy_mode");
    if (savedPrivacyMode !== null) {
      setIsPrivacyMode(savedPrivacyMode === "true");
    }
    setMounted(true);
  }, []);

  const togglePrivacyMode = useCallback(() => {
    // Only allow toggling after mount to avoid hydration issues
    if (!mounted) return;

    const newPrivacyMode = !isPrivacyMode;
    setIsPrivacyMode(newPrivacyMode);
    localStorage.setItem("budgeteer_privacy_mode", newPrivacyMode.toString());
  }, [mounted, isPrivacyMode]);

  // Add keyboard shortcut to toggle privacy mode (Cmd/Ctrl + /)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Cmd/Ctrl + / (slash) for privacy toggle
      if (
        (event.key === "/" || event.code === "Slash") &&
        (event.metaKey || event.ctrlKey) &&
        !event.shiftKey &&
        !event.altKey
      ) {
        event.preventDefault();
        togglePrivacyMode();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePrivacyMode]);

  // Always provide context, even before mount
  return (
    <PrivacyContext.Provider value={{ isPrivacyMode, togglePrivacyMode }}>
      {children}
    </PrivacyContext.Provider>
  );
}

export function usePrivacy() {
  const context = useContext(PrivacyContext);
  if (context === undefined) {
    throw new Error("usePrivacy must be used within a PrivacyProvider");
  }
  return context;
}
