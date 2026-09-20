import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { changeReasons } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getTokenFromRequest, verifyToken, isAdminOrOfficeHolder } from "@/lib/auth";
import { changeReasonSchema } from "@/lib/validations";
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
    if (!isAdminOrOfficeHolder(user!)) {
      return NextResponse.json({ error: "You don't have permission to do this." }, { status: 403 });
    }

    const body = await request.json();

    const parsed = changeReasonSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { isActive } = parsed.data as { isActive: boolean };

    await db
      .update(changeReasons)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(changeReasons.id, id));

    const updated = await db.query.changeReasons.findFirst({
      where: eq(changeReasons.id, id),
    });

    return NextResponse.json(updated);
  } catch (error) {
    const token = getTokenFromRequest(request);
    const user = token ? verifyToken(token) : null;
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
