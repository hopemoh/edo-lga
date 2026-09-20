import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { offices, staff, logEntries } from "@/lib/db/schema";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { createAuditLog } from "@/lib/approval-utils";
import { logError } from "@/lib/error-logger";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { error: "You need to log in to access this." },
        { status: 401 }
      );
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json(
        { error: "You need to log in to access this." },
        { status: 401 }
      );
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "You don't have permission to do this." },
        { status: 403 }
      );
    }

    const { id } = await params;

    const office = await db.query.offices.findFirst({
      where: eq(offices.id, id),
    });

    if (!office) {
      return NextResponse.json(
        { error: "The office could not be found." },
        { status: 404 }
      );
    }

    if (!office.isActive) {
      return NextResponse.json(
        { error: "This office assignment has already been revoked." },
        { status: 400 }
      );
    }

    await db
      .update(offices)
      .set({ isActive: false, revokedAt: new Date() })
      .where(eq(offices.id, id));

    // Revert staff role to ADMIN when office is revoked
    if (office.staffId) {
      await db
        .update(staff)
        .set({ role: "ADMIN" })
        .where(eq(staff.id, office.staffId));
    }

    await createAuditLog(
      "DELETE",
      {
        userId: user.id,
        userFullName: user.name,
        userRole: "ADMIN",
        rank: "ADMIN",
      },
      {
        officeId: id,
        officeName: office.name,
        staffId: office.staffId,
      },
      undefined,
      office.staffId || undefined
    );

    await db.insert(logEntries).values({
      id: crypto.randomUUID(),
      action: "DELETE",
      details: `Revoked ${office.name} office assignment`,
      userId: user.id,
      userFullName: user.name,
      userRank: "ADMIN",
      userRole: "ADMIN",
    });

    return NextResponse.json({
      success: true,
      message: "Office assignment has been revoked.",
    });
  } catch (error) {
    const token = getTokenFromRequest(request);
    const user = token ? verifyToken(token) : null;
    await logError({
      source: "api/offices/[id]",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      request,
      userId: user?.id,
      userRole: user?.role,
    });
    return NextResponse.json(
      { error: "Couldn't revoke the office. Please try again." },
      { status: 500 }
    );
  }
}
