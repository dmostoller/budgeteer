"use client";

import { useChat } from "@ai-sdk/react";
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SendIcon, SparkleIcon, RotateCcwIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function SpendingAdvisor() {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    reload,
  } = useChat({
    api: "/api/ai/spending-advisor",
    initialMessages: [
      {
        id: "welcome",
        role: "assistant",
        content:
          "👋 Hello! I'm your AI spending advisor. Ask me for help analyzing your expenses and finding ways to save money.",
      },
    ],
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [promptSuggestions] = useState([
    "How can I reduce my monthly expenses?",
    "Which subscriptions should I consider canceling?",
    "What spending categories should I focus on to save more?",
    "How do my expenses compare to my income?",
    "What are some small changes that could add up to big savings?",
  ]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSuggestionClick = (suggestion: string) => {
    // Set the input value first
    handleInputChange({
      target: { value: suggestion },
    } as React.ChangeEvent<HTMLInputElement>);

    // Submit after a short delay to ensure the input value is updated
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
          <SparkleIcon className="size-5 text-primary" />
          AI Spending Advisor
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto mb-4 space-y-4 pr-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex flex-col max-w-[90%] rounded-lg p-4",
              message.role === "user"
                ? "bg-primary text-primary-foreground ml-auto"
                : "bg-muted",
            )}
          >
            <div className="text-sm markdown-content">
              <ReactMarkdown
                components={{
                  p: ({ children }) => (
                    <p className="mb-3 last:mb-0">{children}</p>
                  ),
                  ul: ({ children }) => (
                    <ul className="mb-3 ml-4 list-disc space-y-1">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="mb-3 ml-4 list-decimal space-y-1">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => <li className="ml-2">{children}</li>,
                  h1: ({ children }) => (
                    <h1 className="text-lg font-bold mb-3 mt-4 first:mt-0">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-base font-semibold mb-2 mt-3 first:mt-0">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-sm font-semibold mb-2 mt-3 first:mt-0">
                      {children}
                    </h3>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold">{children}</strong>
                  ),
                  em: ({ children }) => <em className="italic">{children}</em>,
                  code: ({ children }) => {
                    const bgClass =
                      message.role === "user"
                        ? "bg-primary-foreground/20"
                        : "bg-muted/50";
                    return (
                      <code
                        className={cn(
                          "px-1.5 py-0.5 rounded font-mono text-xs",
                          bgClass,
                        )}
                      >
                        {children}
                      </code>
                    );
                  },
                  pre: ({ children }) => {
                    const bgClass =
                      message.role === "user"
                        ? "bg-primary-foreground/20"
                        : "bg-muted/50";
                    return (
                      <pre
                        className={cn(
                          "p-3 rounded-md overflow-x-auto mb-3 text-xs",
                          bgClass,
                        )}
                      >
                        {children}
                      </pre>
                    );
                  },
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-2 border-muted-foreground/20 pl-4 italic mb-3">
                      {children}
                    </blockquote>
                  ),
                  a: ({ children, href }) => (
                    <a
                      href={href}
                      className="text-primary hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {children}
                    </a>
                  ),
                  hr: () => <hr className="my-4 border-muted" />,
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          </div>
        ))}
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
          <div className="mt-4 space-y-2">
            <p className="text-sm text-muted-foreground">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {promptSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="text-sm bg-muted/80 hover:bg-muted text-muted-foreground py-1 px-3 rounded-full"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t pt-4">
        <form onSubmit={handleSubmit} className="flex w-full gap-2">
          <Input
            placeholder="Ask about your spending habits..."
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
