import { auth } from "@/lib/auth";
import { IncomeContent } from "./income-content";

export const dynamic = "force-dynamic";

export default async function IncomePage() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  return <IncomeContent />;
}
