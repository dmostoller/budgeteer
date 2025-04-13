import { createSafeActionClient } from "next-safe-action";

import { auth } from "@/lib/auth";

export const getCurrentUser = async () => {
  const session = await auth();
  return session?.user;
};

// Create a safe action client that includes the current user in the context
export const action = createSafeActionClient({
  async middleware() {
    const user = await getCurrentUser();
    
    // Throw an error if the user is not authenticated
    if (!user) {
      throw new Error("Unauthorized");
    }
    
    return { user };
  },
});
