import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { approvalLogs, changeRequests, staff } from "@/lib/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { logError } from "@/lib/error-logger";

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: "You need to log in to access this." }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: "You need to log in to access this." }, { status: 401 });
    }

    let logs;
    if (user.role === "STAFF") {
      const staffChangeRequests = await db.query.changeRequests.findMany({
        where: eq(changeRequests.staffId, user.id),
      });
      const requestIds = staffChangeRequests.map((r) => r.id);

      logs = requestIds.length > 0
        ? await db.query.approvalLogs.findMany({
            where: inArray(approvalLogs.changeRequestId, requestIds),
            with: {
              changeRequest: {
                with: {
                  staff: true,
                },
              },
            },
            orderBy: [desc(approvalLogs.timestamp)],
            limit: 100,
          })
        : [];
    } else {
      logs = await db.query.approvalLogs.findMany({
        with: {
          changeRequest: {
            with: {
              staff: true,
            },
          },
        },
        orderBy: [desc(approvalLogs.timestamp)],
        limit: 100,
      });
    }

    return NextResponse.json({ data: logs, total: logs.length });
  } catch (error) {
    const token = getTokenFromRequest(request);
    const user = token ? verifyToken(token) : null;
    await logError({
      source: "api/approval-logs",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      request,
      userId: user?.id,
      userRole: user?.role,
    });
    return NextResponse.json(
      { error: "Couldn't load approval logs. Please try again." },
      { status: 500 }
    );
  }
}
