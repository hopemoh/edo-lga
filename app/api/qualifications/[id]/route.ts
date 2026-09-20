import { NextRequest, NextResponse } from "next/server";
import { eq, count } from "drizzle-orm";
import { db } from "@/lib/db";
import { qualifications, staffQualifications } from "@/lib/db/schema";
import { getTokenFromRequest, verifyToken, isAdminOrOfficeHolder } from "@/lib/auth";
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
    if (!isAdminOrOfficeHolder(user!)) {
      return NextResponse.json({ error: "You don't have permission to do this." }, { status: 403 });
    }

    const { id } = await params;

    const qualification = await db.query.qualifications.findFirst({
      where: eq(qualifications.id, id),
    });

    if (!qualification) {
      return NextResponse.json(
        { error: "The item you're looking for couldn't be found." },
        { status: 404 }
      );
    }

    const [{ count: usageCount }] = await db
      .select({ count: count() })
      .from(staffQualifications)
      .where(eq(staffQualifications.qualificationId, id));

    if (usageCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete qualification: ${usageCount} staff member(s) are using it`,
        },
        { status: 409 }
      );
    }

    await db.delete(qualifications).where(eq(qualifications.id, id));

    return NextResponse.json({ message: "Qualification deleted" });
  } catch (error) {
    const token = getTokenFromRequest(request);
    const user = token ? verifyToken(token) : null;
    await logError({
      source: "api/qualifications/[id]",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      request,
      userId: user?.id,
      userRole: user?.role,
    });
    return NextResponse.json(
      { error: "Couldn't delete the qualification. Please try again." },
      { status: 500 }
    );
  }
}
