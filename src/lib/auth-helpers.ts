import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function getCurrentUser() {
  const session = await auth();
  return session?.user || null;
}

export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user?.id) {
    throw new Error("Unauthorized");
  }

  return user as {
    id: string;
    email?: string | null;
    name?: string | null;
    image?: string | null;
  };
}

export async function requireOwnership(
  resourceType: "expense" | "income" | "subscription",
  resourceId: string,
) {
  const user = await requireAuth();

  let resource;

  switch (resourceType) {
    case "expense":
      resource = await db.expense.findUnique({
        where: { id: resourceId },
        select: { userId: true },
      });
      break;
    case "income":
      resource = await db.income.findUnique({
        where: { id: resourceId },
        select: { userId: true },
      });
      break;
    case "subscription":
      resource = await db.subscription.findUnique({
        where: { id: resourceId },
        select: { userId: true },
      });
      break;
  }

  if (!resource) {
    throw new Error("Resource not found");
  }

  if (resource.userId !== user.id) {
    throw new Error("Forbidden");
  }

  return user as {
    id: string;
    email?: string | null;
    name?: string | null;
    image?: string | null;
  };
}

export function handleAuthError(error: unknown) {
  if (error instanceof Error) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (error.message === "Resource not found") {
      return NextResponse.json(
        { error: "Resource not found" },
        { status: 404 },
      );
    }
  }

  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
