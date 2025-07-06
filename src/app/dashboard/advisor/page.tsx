"use client";

import { useState } from "react";
import { SpendingAdvisor } from "@/components/ai/spending-advisor";
import { FinancialAssistant } from "@/components/ai/financial-assistant";
import { StatementUpload } from "@/components/ai/statement-upload";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BrainCircuit,
  FileText,
  MessageSquare,
  SparkleIcon,
} from "lucide-react";

export default function AdvisorPage() {
  const [activeTab, setActiveTab] = useState("assistant");

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">AI Financial Hub</h1>
        <p className="text-muted-foreground">
          Your intelligent financial assistant - analyze, import, and manage your finances with AI
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="assistant" className="flex items-center gap-2">
            <BrainCircuit className="h-4 w-4" />
            Assistant
          </TabsTrigger>
          <TabsTrigger value="import" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Import
          </TabsTrigger>
          <TabsTrigger value="advisor" className="flex items-center gap-2">
            <SparkleIcon className="h-4 w-4" />
            Advisor
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assistant" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <FinancialAssistant />
            </div>
            <div className="space-y-6">
              <div className="bg-card rounded-xl border p-6 shadow-sm">
                <h2 className="font-semibold mb-4 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Natural Language Finance
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Chat naturally with your financial data. Ask questions, add transactions,
                  and get insights using everyday language.
                </p>
                <div className="space-y-2">
                  <h3 className="text-xs font-medium text-muted-foreground uppercase">Examples:</h3>
                  <ul className="text-sm space-y-1">
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>&ldquo;How much did I spend last month?&rdquo;</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>&ldquo;Add $45 grocery expense from yesterday&rdquo;</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>&ldquo;What&apos;s my most expensive subscription?&rdquo;</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-primary/5 rounded-xl border border-primary/20 p-6">
                <h3 className="font-semibold mb-2">🚀 Quick Actions</h3>
                <p className="text-sm text-muted-foreground">
                  The assistant can help you add transactions instantly.
                  Just type naturally like &ldquo;spent $30 on lunch&rdquo; and it will
                  create the expense for you!
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="import" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <StatementUpload
                onImportComplete={() => {
                  // Could refresh data or show success message
                  setActiveTab("assistant");
                }}
              />
            </div>
            <div className="space-y-6">
              <div className="bg-card rounded-xl border p-6 shadow-sm">
                <h2 className="font-semibold mb-4">Supported Formats</h2>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• PDF bank statements</li>
                  <li>• CSV transaction exports</li>
                  <li>• Screenshot images (PNG, JPG)</li>
                  <li>• Text-based statements</li>
                </ul>
              </div>

              <div className="bg-card rounded-xl border p-6 shadow-sm">
                <h2 className="font-semibold mb-4">AI-Powered Analysis</h2>
                <p className="text-sm text-muted-foreground">
                  Our AI automatically:
                </p>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                  <li>• Extracts transaction data</li>
                  <li>• Categorizes expenses</li>
                  <li>• Detects recurring payments</li>
                  <li>• Identifies duplicates</li>
                  <li>• Suggests improvements</li>
                </ul>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="advisor" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <SpendingAdvisor />
            </div>
            <div className="space-y-6">
              <div className="bg-card rounded-xl border p-6 shadow-sm">
                <h2 className="font-semibold mb-4">About the AI Advisor</h2>
                <p className="text-sm text-muted-foreground">
                  The AI Spending Advisor analyzes your financial data to provide personalized recommendations
                  on how you can save money and optimize your budget. It examines your spending patterns,
                  subscriptions, and recurring expenses to identify potential savings opportunities.
                </p>
              </div>

              <div className="bg-card rounded-xl border p-6 shadow-sm">
                <h2 className="font-semibold mb-4">Tips for Better Advice</h2>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Be specific about which areas you want to improve</li>
                  <li>• Ask about particular expense categories</li>
                  <li>• Request comparisons between months or categories</li>
                  <li>• Ask for actionable steps you can take today</li>
                  <li>• Request savings estimates for different scenarios</li>
                </ul>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}