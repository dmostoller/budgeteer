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
  SidebarTrigger,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  HomeIcon,
  DollarSign,
  Receipt,
  CalendarIcon,
  CreditCard,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import { NavUser } from "@/components/auth/nav-user";
import { Separator } from "@/components/ui/separator";
import { DashboardBreadcrumbs } from "@/components/dashboard-breadcrumbs";

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
  { href: "/dashboard/advisor", label: "AI Advisor", icon: Sparkles },
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
    <SidebarProvider
      defaultOpen={defaultOpen}
      style={
        {
          "--sidebar-width-icon": "4rem",
        } as React.CSSProperties
      }
    >
      {/* The actual Sidebar component */}
      <Sidebar collapsible="icon">
        <SidebarHeader className="group-data-[collapsible=icon]:px-2">
          <div className="flex items-center group-data-[collapsible=icon]:justify-center">
            {/* Show mascot when expanded */}
            <Image
              src="/mascot.png"
              width={100}
              height={100}
              alt="Budgeteer Logo"
              className="transition-all duration-200 group-data-[collapsible=icon]:hidden"
            />
            {/* Show B logo when collapsed */}
            <Image
              src="/b-logo.png"
              width={32}
              height={32}
              alt="Budgeteer Logo"
              className="hidden transition-all duration-200 group-data-[collapsible=icon]:block"
            />
            <span className="ml-2 text-xl font-bold transition-all duration-200 group-data-[collapsible=icon]:hidden">
              Budgeteer
            </span>
          </div>
        </SidebarHeader>
        <SidebarContent className="pt-4 px-2">
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild tooltip={item.label}>
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <NavUser />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      {/* Wrap the main content area with SidebarInset */}
      <SidebarInset>
        <div className="flex flex-col min-h-screen">
          <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <DashboardBreadcrumbs />
            <div className="ml-auto">
              <ModeToggle />
            </div>
          </header>
          <main className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
            {children}
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
