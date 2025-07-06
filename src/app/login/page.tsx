import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginButton } from "@/components/auth/login-button";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Login | Budgeteer",
  description: "Login to your Budgeteer account",
};

export default async function LoginPage() {
  const session = await auth();

  // Redirect to dashboard if already authenticated
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px] px-8">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-3xl font-bold">Budgeteer</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to access your budget tracker
          </p>
        </div>
        <div className="flex flex-col gap-4">
          <LoginButton />
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                or
              </span>
            </div>
          </div>
          <Link href="/" passHref>
            <Button variant="outline" className="w-full">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
