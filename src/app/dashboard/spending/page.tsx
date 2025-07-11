import { auth } from "@/lib/auth";
import { SpendingContent } from "./spending-content";

export const dynamic = "force-dynamic";

export default async function SpendingPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  return <SpendingContent />;
}
