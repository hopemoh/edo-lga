import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { disciplinaryCases } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { logError } from "@/lib/error-logger";

export async function PUT(
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
    if (!["ADMIN", "SECRETARY", "CHAIRMAN"].includes(user.role)) {
      return NextResponse.json({ error: "You don't have permission to do this." }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, status, sanction, dateResolved } = body;

    await db
      .update(disciplinaryCases)
      .set({
        ...(title && { title }),
        ...(description && { description }),
        ...(status && { status }),
        ...(sanction !== undefined && { sanction }),
        ...(dateResolved && { dateResolved: new Date(dateResolved) }),
      })
      .where(eq(disciplinaryCases.id, id));

    const updated = await db.query.disciplinaryCases.findFirst({
      where: eq(disciplinaryCases.id, id),
      with: { staff: { with: { lga: true } } },
    });

    return NextResponse.json(updated);
  } catch (error) {
    await logError({
      source: "api/disciplinary/[id]",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      request,
      userId: user?.id,
      userRole: user?.role,
    });
    return NextResponse.json(
      { error: "Couldn't update the record. Please try again." },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    if (!["ADMIN", "CHAIRMAN"].includes(user.role)) {
      return NextResponse.json({ error: "You don't have permission to do this." }, { status: 403 });
    }

    await db.delete(disciplinaryCases).where(eq(disciplinaryCases.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    await logError({
      source: "api/disciplinary/[id]",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      request,
      userId: user?.id,
      userRole: user?.role,
    });
    return NextResponse.json(
      { error: "Couldn't remove the record. Please try again." },
      { status: 500 }
    );
  }
}
