import { NextRequest, NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { staff, documentHistory } from "@/lib/db/schema";
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

    const staffRecord = await db.query.staff.findFirst({
      where: eq(staff.id, id),
    });

    if (!staffRecord) {
      return NextResponse.json({ error: "The item you're looking for couldn't be found." }, { status: 404 });
    }

    const canUpdate = staffRecord.canUpdateDocument;

    if (!canUpdate) {
      return NextResponse.json({
        canReplace: false,
        message: "Document replacement is not enabled for this staff member",
      });
    }

    const latestEntry = await db.query.documentHistory.findFirst({
      where: eq(documentHistory.staffId, id),
      orderBy: [desc(documentHistory.uploadedAt)],
    });

    if (!latestEntry) {
      return NextResponse.json({
        canReplace: true,
        message: "No previous documents uploaded",
      });
    }

    const now = new Date();
    const uploadedAt = new Date(latestEntry.uploadedAt);
    const diffMs = now.getTime() - uploadedAt.getTime();
    const diffMinutes = diffMs / (1000 * 60);

    if (diffMinutes < 30) {
      const remainingMinutes = Math.ceil(30 - diffMinutes);
      return NextResponse.json({
        canReplace: false,
        message: `Please wait ${remainingMinutes} minute(s) before replacing the document`,
        nextAvailableAt: new Date(uploadedAt.getTime() + 30 * 60 * 1000),
      });
    }

    return NextResponse.json({
      canReplace: true,
      message: "Document can be replaced",
    });
  } catch (error) {
    await logError({
      source: "api/staff/[id]/document/check-replacement",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      request,
      userId: user?.id,
      userRole: user?.role,
    });
    return NextResponse.json(
      { error: "Couldn't check document status. Please try again." },
      { status: 500 }
    );
  }
}
