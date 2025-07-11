import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

// Create a Redis instance using environment variables
const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

// Create rate limiter for AI endpoints
// 10 requests per minute per user
export const aiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 m"),
  analytics: true,
  prefix: "@upstash/ratelimit/ai",
});

// Rate limit checker function
export async function checkAIRateLimit(userId: string) {
  const { success, limit, reset, remaining } = await aiRateLimit.limit(
    `user:${userId}`,
  );

  if (!success) {
    const resetDate = new Date(reset);
    return NextResponse.json(
      {
        error: "Too many requests",
        message: `Rate limit exceeded. You can make ${limit} requests per minute.`,
        reset: resetDate.toISOString(),
        remaining: 0,
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": reset.toString(),
        },
      },
    );
  }

  // Return null if rate limit check passes
  return null;
}
