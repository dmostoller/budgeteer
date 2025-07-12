import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import AuthProvider from "@/components/auth-provider";
import { QueryProvider } from "@/app/providers/query-provider";
import { PrivacyProvider } from "@/contexts/privacy-context";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Budgeteer - Personal Finance Tracker",
  description: "Track your income, expenses, and subscriptions with Budgeteer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          <QueryProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <PrivacyProvider>
                {children}
                <Toaster position="bottom-right" />
              </PrivacyProvider>
            </ThemeProvider>
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
