"use client";

import { useChat } from "@ai-sdk/react";
import { useState, useRef, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  SendIcon,
  BrainCircuit,
  RotateCcwIcon,
  PlusCircle,
  DollarSign,
  TrendingUp,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function FinancialAssistant() {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    reload,
  } = useChat({
    api: "/api/ai/chat",
    initialMessages: [
      {
        id: "welcome",
        role: "assistant",
        content:
          "Hello! I'm your AI financial assistant. I can help you:\n\n• Answer questions about your finances\n• Add new transactions (e.g., 'add $50 groceries')\n• Analyze spending patterns\n• Find specific transactions\n\nWhat would you like to know?",
      },
    ],
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [promptSuggestions] = useState([
    { icon: TrendingUp, text: "How much did I spend on food last month?" },
    { icon: PlusCircle, text: "Add $25 lunch expense" },
    { icon: DollarSign, text: "What's my biggest expense category?" },
    { icon: FileText, text: "Show me all subscriptions" },
  ]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSuggestionClick = (suggestion: string) => {
    handleInputChange({
      target: { value: suggestion },
    } as React.ChangeEvent<HTMLInputElement>);

    setTimeout(() => {
      handleSubmit({
        preventDefault: () => {},
      } as React.FormEvent<HTMLFormElement>);
    }, 10);
  };

  return (
    <Card className="flex flex-col h-[700px]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BrainCircuit className="size-5 text-primary" />
          Financial Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto mb-4 space-y-4 pr-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex flex-col rounded-lg p-4",
              message.role === "user"
                ? "bg-primary text-primary-foreground ml-auto max-w-[80%]"
                : "bg-muted max-w-[90%]",
            )}
          >
            <span className="text-sm whitespace-pre-line">
              {message.content}
            </span>
          </div>
        ))}
        {isLoading && (
          <div className="flex flex-col max-w-[90%] rounded-lg p-4 bg-muted">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-primary rounded-full animate-bounce" />
              <div className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
              <div className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
        {error && (
          <div className="flex flex-col max-w-[90%] rounded-lg p-4 bg-destructive/10 text-destructive">
            <span className="text-sm">
              Error:{" "}
              {error.message || "Failed to get response. Please try again."}
            </span>
            <Button
              size="sm"
              variant="outline"
              className="mt-2 self-end"
              onClick={() => reload()}
            >
              <RotateCcwIcon className="size-3 mr-1" /> Retry
            </Button>
          </div>
        )}
        <div ref={messagesEndRef} />

        {messages.length === 1 && (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-muted-foreground font-medium">
              Quick actions:
            </p>
            <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
              {promptSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion.text)}
                  className="flex items-center gap-3 text-left p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <suggestion.icon className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-sm">{suggestion.text}</span>
                </button>
              ))}
            </div>

            <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <h4 className="text-sm font-medium mb-2">💡 Pro Tips</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>
                  • Ask about specific time periods: &ldquo;last 3
                  months&rdquo;, &ldquo;this year&rdquo;
                </li>
                <li>
                  • Add transactions quickly: &ldquo;spent $45 on gas&rdquo;
                </li>
                <li>
                  • Get insights: &ldquo;compare my spending to last
                  month&rdquo;
                </li>
                <li>
                  • Find transactions: &ldquo;show all Amazon purchases&rdquo;
                </li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t pt-4">
        <form onSubmit={handleSubmit} className="flex w-full gap-2">
          <Input
            placeholder="Ask about finances or add transactions..."
            value={input}
            onChange={handleInputChange}
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            <SendIcon className="size-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
