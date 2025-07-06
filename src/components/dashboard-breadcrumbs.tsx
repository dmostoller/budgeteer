"use client";

import * as React from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export function DashboardBreadcrumbs() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pathSegments = pathname.split("/").filter((segment) => segment);

  // Map of path segments to display names
  const segmentNames: Record<string, string> = {
    dashboard: "Dashboard",
    income: "Income",
    spending: "Spending",
    subscriptions: "Subscriptions",
    calendar: "Calendar",
    advisor: "AI Advisor",
  };
  
  // Map of advisor tab values to display names
  const advisorTabNames: Record<string, string> = {
    assistant: "Assistant",
    import: "Import",
    advisor: "Advisor",
  };

  // Check if we're on the advisor page and have a tab param
  const isAdvisorPage = pathname === "/dashboard/advisor";
  const activeTab = isAdvisorPage ? searchParams.get("tab") || "assistant" : null;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {pathSegments.map((segment, index) => {
          const href = "/" + pathSegments.slice(0, index + 1).join("/");
          const isLast = index === pathSegments.length - 1 && !activeTab;
          const displayName = segmentNames[segment] || segment;

          return (
            <React.Fragment key={segment}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{displayName}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={href}>{displayName}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {(!isLast || activeTab) && <BreadcrumbSeparator />}
            </React.Fragment>
          );
        })}
        
        {/* Add tab breadcrumb for advisor page */}
        {activeTab && (
          <BreadcrumbItem>
            <BreadcrumbPage>{advisorTabNames[activeTab] || activeTab}</BreadcrumbPage>
          </BreadcrumbItem>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
