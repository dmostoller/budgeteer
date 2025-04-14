import { SpendingAdvisor } from "@/components/ai/spending-advisor";

export default function AdvisorPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">AI Spending Advisor</h1>
      <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
        <div className="md:col-span-4">
          <SpendingAdvisor />
        </div>
        <div className="md:col-span-2 space-y-6">
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
    </div>
  );
}