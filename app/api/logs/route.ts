import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logEntries } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { getTokenFromRequest, verifyToken, isAdminOrOfficeHolder } from "@/lib/auth";
import { logError } from "@/lib/error-logger";

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: "You need to log in to access this." }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!isAdminOrOfficeHolder(user!)) {
      return NextResponse.json({ error: "You don't have permission to do this." }, { status: 403 });
    }

    const logs = await db.query.logEntries.findMany({
      orderBy: [desc(logEntries.timestamp)],
      limit: 100,
    });

    return NextResponse.json(logs);
  } catch (error) {
    const token = getTokenFromRequest(request);
    const user = token ? verifyToken(token) : null;
    await logError({
      source: "api/logs",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      request,
      userId: user?.id,
      userRole: user?.role,
    });
    return NextResponse.json(
      { error: "Couldn't load activity logs. Please try again." },
      { status: 500 }
    );
  }
}
