import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { approvalLogs, changeRequests, staff } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

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

    const logs = await db.query.approvalLogs.findMany({
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

    return NextResponse.json({ data: logs, total: logs.length });
  } catch (error) {
    return NextResponse.json(
      { error: "Couldn't load approval logs. Please try again." },
      { status: 500 }
    );
  }
}
