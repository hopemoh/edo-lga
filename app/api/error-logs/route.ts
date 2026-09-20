import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { errorLogs } from "@/lib/db/schema";
import { eq, desc, and, sql, count, inArray } from "drizzle-orm";
import { getTokenFromRequest, verifyToken, isAdminOrOfficeHolder } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: "You need to log in to access this." }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user || !isAdminOrOfficeHolder(user)) {
      return NextResponse.json({ error: "You don't have permission to do this." }, { status: 403 });
    }

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

export async function PATCH(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: "You need to log in to access this." }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user || !isAdminOrOfficeHolder(user)) {
      return NextResponse.json({ error: "You don't have permission to do this." }, { status: 403 });
    }

    const body = await request.json();
    const { ids } = body as { ids: string[] };

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "No error log IDs provided." }, { status: 400 });
    }

    if (ids.length > 200) {
      return NextResponse.json({ error: "Cannot resolve more than 200 items at once." }, { status: 400 });
    }

    await db
      .update(errorLogs)
      .set({
        resolved: true,
        resolvedBy: user.id,
        resolvedAt: new Date(),
      })
      .where(inArray(errorLogs.id, ids));

    return NextResponse.json({ success: true, resolved: ids.length });
  } catch (error) {
    return NextResponse.json(
      { error: "Couldn't update the error logs. Please try again." },
      { status: 500 }
    );
  }
}
