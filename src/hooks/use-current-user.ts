"use client";

import { useEffect, useState } from "react";
import { getAuth } from "@/lib/auth";

export function useCurrentUser() {
  const [user, setUser] = useState<{
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const session = await getAuth();
        setUser(session?.user || null);
      } catch (error) {
        console.error("Failed to fetch user:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUser();
  }, []);

  return { user, isLoading };
}
