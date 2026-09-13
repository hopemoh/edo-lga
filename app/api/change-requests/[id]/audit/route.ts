import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { approvalLogs, auditLogs, changeRequests } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: "You need to log in to access this." }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: "You need to log in to access this." }, { status: 401 });
    }

    const changeRequest = await db.query.changeRequests.findFirst({
      where: eq(changeRequests.id, id),
    });

    if (!changeRequest) {
      return NextResponse.json(
        { error: "The item you're looking for couldn't be found." },
        { status: 404 }
      );
    }

    const [approvalLogsResult, auditLogsResult] = await Promise.all([
      db.query.approvalLogs.findMany({
        where: eq(approvalLogs.changeRequestId, id),
        orderBy: [desc(approvalLogs.timestamp)],
      }),
      db.query.auditLogs.findMany({
        where: eq(auditLogs.changeRequestId, id),
        orderBy: [desc(auditLogs.timestamp)],
      }),
    ]);

    return NextResponse.json({
      approvalLogs: approvalLogsResult,
      auditLogs: auditLogsResult,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Couldn't load audit trail. Please try again." },
      { status: 500 }
    );
  }
}
