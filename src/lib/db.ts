import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

// Declare a global variable to hold the Prisma Client instance
declare global {
  // Allow global `var` declarations
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const connectionString = `${process.env.DATABASE_URL}`;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Function to create the Prisma Client instance
const createPrismaClient = () => {
  // Check if we're in an environment that requires the Neon adapter
  // Middleware always runs on the edge. Vercel Edge Functions also need it.
  // Node.js environments (like standard API routes, getServerSideProps) can also use it,
  // especially in serverless functions where connection pooling is beneficial.
  // We'll use Neon for all environments for consistency here,
  // leveraging its serverless connection pooling.

  const adapter = new PrismaNeon({ connectionString });

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
};

// Instantiate PrismaClient, reusing the instance in development or across serverless invocations
export const db = globalThis.prisma ?? createPrismaClient();

// Prevent multiple instances in development HMR
if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = db;
}

export default db;
