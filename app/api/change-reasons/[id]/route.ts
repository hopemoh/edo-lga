import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { changeReasons } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { logError } from "@/lib/error-logger";

export async function PATCH(
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
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "You don't have permission to do this." }, { status: 403 });
    }

    const body = await request.json();
    const { isActive } = body;

    await db
      .update(changeReasons)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(changeReasons.id, id));

    const updated = await db.query.changeReasons.findFirst({
      where: eq(changeReasons.id, id),
    });

    return NextResponse.json(updated);
  } catch (error) {
    await logError({
      source: "api/change-reasons/[id]",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      request,
      userId: user?.id,
      userRole: user?.role,
    });
    return NextResponse.json(
      { error: "Couldn't update the change reason. Please try again." },
      { status: 500 }
    );
  }
}
