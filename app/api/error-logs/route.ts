import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { errorLogs } from "@/lib/db/schema";
import { eq, desc, and, sql, lte, count } from "drizzle-orm";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { cleanupOldErrorLogs } from "@/lib/error-logger";

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: "You need to log in to access this." }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user || !["ADMIN", "SECRETARY", "CHAIRMAN"].includes(user.role)) {
      return NextResponse.json({ error: "You don't have permission to do this." }, { status: 403 });
    }

    await cleanupOldErrorLogs();

    const { searchParams } = new URL(request.url);
    const level = searchParams.get("level");
    const source = searchParams.get("source");
    const resolved = searchParams.get("resolved");
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const conditions: any[] = [];
    if (level) conditions.push(eq(errorLogs.level, level as any));
    if (source) conditions.push(sql`${errorLogs.source} ILIKE ${"%" + source + "%"}`);
    if (resolved !== null && resolved !== undefined && resolved !== "") {
      conditions.push(eq(errorLogs.resolved, resolved === "true"));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, totalResult, unresolvedResult] = await Promise.all([
      db.query.errorLogs.findMany({
        where: whereClause,
        orderBy: [desc(errorLogs.timestamp)],
        limit,
        offset,
      }),
      db.select({ total: count() }).from(errorLogs).where(whereClause),
      db.select({ total: count() }).from(errorLogs).where(eq(errorLogs.resolved, false)),
    ]);

    return NextResponse.json({
      data,
      total: totalResult[0]?.total || 0,
      unresolved: unresolvedResult[0]?.total || 0,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Couldn't load error logs. Please try again." },
      { status: 500 }
    );
  }
}
