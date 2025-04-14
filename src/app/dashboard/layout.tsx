import { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers"; // Import cookies
import { auth } from "@/lib/auth";
import { ModeToggle } from "@/components/mode-toggle";
// Import the specific sidebar components including Provider and Inset
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider, // Import Provider
  SidebarInset, // Import Inset
} from "@/components/ui/sidebar";
import {
  HomeIcon,
  DollarSign,
  Receipt,
  CalendarIcon,
  CreditCard,
} from "lucide-react";
import Image from "next/image";
import { NavUser } from "@/components/auth/nav-user";

export const metadata: Metadata = {
  title: "Dashboard | Budgeteer",
  description: "Manage your personal finances with Budgeteer",
};

// Define navigation items
const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: HomeIcon },
  { href: "/dashboard/income", label: "Income", icon: DollarSign },
  { href: "/dashboard/spending", label: "Spending", icon: Receipt },
  {
    href: "/dashboard/subscriptions",
    label: "Subscriptions",
    icon: CreditCard,
  },
  { href: "/dashboard/calendar", label: "Calendar", icon: CalendarIcon },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const cookieStore = await cookies(); // Get cookies
  // Determine default state from cookie, default to true if not set or invalid
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

  if (!session?.user) {
    redirect("/login");
  }

  return (
    // Wrap everything in SidebarProvider
    <SidebarProvider defaultOpen={defaultOpen}>
      {/* The actual Sidebar component */}
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center">
            <Image
              src="/lines-logo.png"
              width={25}
              height={25}
              alt="Budgeteer Logo"
            />
            <span className="ml-2 text-lg font-bold">Budgeteer</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild>
                  <Link href={item.href}>
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <NavUser />
        </SidebarFooter>
      </Sidebar>

      {/* Wrap the main content area with SidebarInset */}
      <SidebarInset>
        <div className="flex flex-col min-h-screen">
          {" "}
          {/* Ensure flex container takes height */}
          <header className="flex h-14 shrink-0 items-center gap-4 border-b px-4 lg:px-6">
            {" "}
            {/* Use shrink-0 */}
            <div className="ml-auto flex items-center gap-2">
              <ModeToggle />
            </div>
          </header>
          <main className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
            {" "}
            {/* Use flex-1 */}
            {children}
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
