import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { errorLogs } from "@/lib/db/schema";
import { lte, sql } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const secret = request.headers.get("x-cron-secret");
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const result = await db
      .delete(errorLogs)
      .where(lte(errorLogs.timestamp, sevenDaysAgo))
      .returning({ id: errorLogs.id });

    return NextResponse.json({
      success: true,
      deleted: result.length,
      message: `Deleted ${result.length} error logs older than 7 days`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Cleanup failed" },
      { status: 500 }
    );
  }
}
