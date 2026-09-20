import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { errorLogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getTokenFromRequest, verifyToken, isAdminOrOfficeHolder } from "@/lib/auth";

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
    if (!user || !isAdminOrOfficeHolder(user)) {
      return NextResponse.json({ error: "You don't have permission to do this." }, { status: 403 });
    }

    const log = await db.query.errorLogs.findFirst({
      where: eq(errorLogs.id, id),
    });

    if (!log) {
      return NextResponse.json({ error: "The item you're looking for couldn't be found." }, { status: 404 });
    }

    await db
      .update(errorLogs)
      .set({
        resolved: true,
        resolvedBy: user.id,
        resolvedAt: new Date(),
      })
      .where(eq(errorLogs.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Couldn't update the error log. Please try again." },
      { status: 500 }
    );
  }
}
