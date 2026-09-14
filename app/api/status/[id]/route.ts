import { NextRequest, NextResponse } from "next/server";
import { eq, count } from "drizzle-orm";
import { db } from "@/lib/db";
import { statuses, staff } from "@/lib/db/schema";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { logError } from "@/lib/error-logger";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: "You need to log in to access this." }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!["ADMIN", "SECRETARY", "CHAIRMAN"].includes(user.role)) {
      return NextResponse.json({ error: "You don't have permission to do this." }, { status: 403 });
    }

    const { id } = await params;

    const status = await db.query.statuses.findFirst({
      where: eq(statuses.id, id),
    });

    if (!status) {
      return NextResponse.json(
        { error: "The item you're looking for couldn't be found." },
        { status: 404 }
      );
    }

    const [{ count: usageCount }] = await db
      .select({ count: count() })
      .from(staff)
      .where(eq(staff.statusId, id));

    if (usageCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete status: ${usageCount} staff member(s) are using it`,
        },
        { status: 409 }
      );
    }

    await db.delete(statuses).where(eq(statuses.id, id));

    return NextResponse.json({ message: "Status deleted" });
  } catch (error) {
    await logError({
      source: "api/status/[id]",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      request,
      userId: user?.id,
      userRole: user?.role,
    });
    return NextResponse.json(
      { error: "Couldn't delete the status. Please try again." },
      { status: 500 }
    );
  }
}
