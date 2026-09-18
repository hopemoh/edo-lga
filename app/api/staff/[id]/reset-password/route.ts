import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { staff } from "@/lib/db/schema";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

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
    if (!user || user.role !== "ADMIN") {
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

    return NextResponse.json({
      success: true,
      message: `${targetStaff.name}'s password has been reset. They will use phone + DOB to login and must set a new password.`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Couldn't reset password. Please try again." },
      { status: 500 }
    );
  }
}
