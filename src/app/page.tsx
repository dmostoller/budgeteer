import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3, DollarSign, ListChecks } from "lucide-react";
import { auth } from "@/lib/auth";
import Image from "next/image";

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
          <Image
            src="/lines-logo.png"
            width={25}
            height={25}
            alt="Budgeteer Logo"
          />
          <span className="ml-2 text-xl font-bold">Budgeteer</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Button variant="ghost" size="sm" asChild>
            {/* Use asChild to make the Button render the Link */}
            <Link href="/login">Log In</Link>
          </Button>
        </nav>
      </header>
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24">
          <div className="container px-4 md:px-6">
            <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-12 lg:gap-16">
              {/* Left Column: Text Content */}
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
                  <Button size="lg" asChild>
                    <Link href="/login">
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
              {/* Right Column: Mascot Image */}
              <div className="hidden items-center justify-center md:flex">
                <Image
                  src="/mascot.png"
                  width={400} // Increased size slightly for better presence
                  height={400}
                  alt="Budgeteer Mascot"
                  className="overflow-hidden rounded-xl object-contain" // Use object-contain if aspect ratio is important
                />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full pb-12">
          {" "}
          {/* Added bg-muted for slight visual separation */}
          <div className="container px-4 md:px-6">
            {/* Optional: Add a title for the features section */}
            {/* <h2 className="text-3xl font-bold tracking-tighter text-center mb-8 md:mb-12">
              Core Features
            </h2> */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
              {/* Feature Card 1 */}
              <div className="rounded-lg border bg-card p-6 shadow-sm flex flex-col">
                {" "}
                {/* Use flex-col for consistent structure */}
                <DollarSign className="h-12 w-12 text-primary mb-4" />{" "}
                {/* Added margin-bottom */}
                <h3 className="text-lg font-bold">Track Income & Expenses</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Easily record your financial transactions with detailed
                  categorization.
                </p>
              </div>
              {/* Feature Card 2 */}
              <div className="rounded-lg border bg-card p-6 shadow-sm flex flex-col">
                <BarChart3 className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-lg font-bold">Visualize & Plan</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  See your financial activity on a calendar and through
                  insightful charts.
                </p>
              </div>
              {/* Feature Card 3 */}
              <div className="rounded-lg border bg-card p-6 shadow-sm flex flex-col">
                <ListChecks className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-lg font-bold">Manage Subscriptions</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Keep track of recurring payments and never miss a due date.
                </p>
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
          {/* You can add footer links here if needed */}
        </div>
      </footer>
    </div>
  );
}
