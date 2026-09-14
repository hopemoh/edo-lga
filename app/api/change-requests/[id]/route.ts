import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { changeRequests } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { logError } from "@/lib/error-logger";

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
      with: {
        staff: true,
        changeReason: true,
        approvalLogs: true,
      },
    });

    if (!changeRequest) {
      return NextResponse.json(
        { error: "The item you're looking for couldn't be found." },
        { status: 404 }
      );
    }

    return NextResponse.json(changeRequest);
  } catch (error) {
    await logError({
      source: "api/change-requests/[id]",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      request,
      userId: user?.id,
      userRole: user?.role,
    });
    return NextResponse.json(
      { error: "Couldn't load the change request. Please try again." },
      { status: 500 }
    );
  }
}
