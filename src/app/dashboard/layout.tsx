import { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { DashboardHeaderControls } from "@/components/dashboard-header-controls";
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
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  CalendarDays,
  CalendarSync,
  BanknoteArrowDown,
  BanknoteArrowUp,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import { NavUser } from "@/components/auth/nav-user";
import { Separator } from "@/components/ui/separator";
import { DashboardBreadcrumbs } from "@/components/dashboard-breadcrumbs";
import { ScrollArea } from "@/components/ui/scroll-area";

export const metadata: Metadata = {
  title: "Dashboard | Budgeteer",
  description: "Manage your personal finances with Budgeteer",
};

// Define navigation items
const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/income", label: "Income", icon: BanknoteArrowUp },
  { href: "/dashboard/spending", label: "Spending", icon: BanknoteArrowDown },
  {
    href: "/dashboard/subscriptions",
    label: "Subscriptions",
    icon: CalendarSync,
  },
  { href: "/dashboard/calendar", label: "Calendar", icon: CalendarDays },
  {
    href: "/dashboard/advisor?tab=assistant",
    label: "AI Advisor",
    icon: Sparkles,
  },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

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
      <Sidebar collapsible="icon" variant="inset">
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
        <SidebarContent className="pt-4 group-data-[collapsible=icon]:px-3">
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild tooltip={item.label}>
                  <Link href={item.href} className="flex items-center gap-2">
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
      </Sidebar>

      {/* Wrap the main content area with SidebarInset */}
      <SidebarInset>
        <div className="flex flex-col h-screen">
          <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <DashboardBreadcrumbs />
            <DashboardHeaderControls />
          </header>
          <main className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="flex flex-col gap-4 p-4 lg:p-6">{children}</div>
            </ScrollArea>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
