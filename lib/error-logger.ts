import { db } from "./db";
import { errorLogs } from "./db/schema";
import { NextRequest } from "next/server";
import { lte, sql } from "drizzle-orm";

interface LogErrorParams {
  source: string;
  message: string;
  stack?: string;
  request?: NextRequest;
  userId?: string;
  userRole?: string;
  level?: "ERROR" | "WARNING" | "INFO";
}

export async function logError({
  source,
  message,
  stack,
  request,
  userId,
  userRole,
  level = "ERROR",
}: LogErrorParams) {
  try {
    let requestMethod: string | null = null;
    let requestPath: string | null = null;

    if (request) {
      requestMethod = request.method;
      requestPath = request.url;
    }

    await db.insert(errorLogs).values({
      id: crypto.randomUUID(),
      level,
      source,
      message,
      stack: stack || null,
      userId: userId || null,
      userRole: userRole || null,
      requestMethod,
      requestPath,
    });
  } catch {
    // Silent — never break the original request
  }
}

export async function cleanupOldErrorLogs() {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    await db
      .delete(errorLogs)
      .where(lte(errorLogs.timestamp, sevenDaysAgo));
  } catch {
    // Silent
  }
}
