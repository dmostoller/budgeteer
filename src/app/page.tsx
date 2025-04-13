import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3, DollarSign, ListChecks } from "lucide-react";
import { auth } from "@/lib/auth";

export default async function HomePage() {
  const session = await auth();

  // Redirect to dashboard if already authenticated
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col max-w-screen-2xl mx-auto">
      <header className="px-4 lg:px-6 h-14 flex items-center">
        <Link className="flex items-center justify-center" href="/">
          <DollarSign className="h-6 w-6" />
          <span className="ml-2 text-xl font-bold">Budgeteer</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link
            className="text-sm font-medium hover:underline underline-offset-4"
            href="/login"
          >
            Log In
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-40">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Manage Your Finances with Ease
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Track income, expenses, and subscriptions in one place.
                    Visualize your financial activity and plan for the future.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link href="/login">
                    <Button size="lg" className="w-full">
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-2">
                  <div className="grid gap-4">
                    <div className="rounded-lg border bg-card p-6 shadow-sm">
                      <DollarSign className="h-12 w-12 text-primary" />
                      <h3 className="mt-4 font-bold">
                        Track Income & Expenses
                      </h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Easily record your financial transactions with detailed
                        categorization.
                      </p>
                    </div>
                    <div className="rounded-lg border bg-card p-6 shadow-sm">
                      <ListChecks className="h-12 w-12 text-primary" />
                      <h3 className="mt-4 font-bold">Manage Subscriptions</h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Keep track of recurring payments and never miss a due
                        date.
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-4">
                    <div className="rounded-lg border bg-card p-6 shadow-sm">
                      <BarChart3 className="h-12 w-12 text-primary" />
                      <h3 className="mt-4 font-bold">Visualize & Plan</h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        See your financial activity on a calendar and through
                        insightful charts.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t">
        <div className="container flex flex-col gap-2 py-6 md:flex-row md:items-center md:justify-between md:py-8">
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} Budgeteer. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
