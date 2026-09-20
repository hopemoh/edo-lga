import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { staff, logEntries } from "@/lib/db/schema";
import { getTokenFromRequest, verifyToken, isAdminOrOfficeHolder } from "@/lib/auth";
import { logError } from "@/lib/error-logger";

export async function POST(
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
    if (!isAdminOrOfficeHolder(user)) {
      return NextResponse.json({ error: "Only admins can reset passwords." }, { status: 403 });
    }

    const targetStaff = await db.query.staff.findFirst({
      where: eq(staff.id, id),
    });

    if (!targetStaff) {
      return NextResponse.json({ error: "Staff member not found." }, { status: 404 });
    }

    await db
      .update(staff)
      .set({
        passwordHash: null,
        hasChangedPassword: false,
        updatedAt: new Date(),
      })
      .where(eq(staff.id, id));

    await db.insert(logEntries).values({
      id: crypto.randomUUID(),
      action: "UPDATE",
      details: `Reset password for ${targetStaff.name} (${targetStaff.serialNumber})`,
      userId: user!.id,
      userFullName: user!.name,
      userRank: user!.role,
      userRole: user!.role,
    });

    return NextResponse.json({
      success: true,
      message: `${targetStaff.name}'s password has been reset. They will use phone + DOB to login and must set a new password.`,
    });
  } catch (error) {
    const token = getTokenFromRequest(request);
    const user = token ? verifyToken(token) : null;
    await logError({
      source: "api/staff/reset-password",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      request,
      userId: user?.id,
      userRole: user?.role,
    });
    return NextResponse.json(
      { error: "Couldn't reset password. Please try again." },
      { status: 500 }
    );
  }
}
