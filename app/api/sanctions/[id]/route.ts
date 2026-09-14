import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { sanctions } from "@/lib/db/schema";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { sanctionSchema } from "@/lib/validations";
import { logError } from "@/lib/error-logger";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return NextResponse.json({ error: "You need to log in to access this." }, { status: 401 });
    const user = verifyToken(token);
    if (!user) return NextResponse.json({ error: "You need to log in to access this." }, { status: 401 });
    if (!["ADMIN", "SECRETARY", "CHAIRMAN"].includes(user.role)) {
      return NextResponse.json({ error: "You don't have permission to do this." }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const parsed = sanctionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { name } = parsed.data;

    const sanction = await db.query.sanctions.findFirst({
      where: eq(sanctions.id, id),
    });

    if (!sanction) {
      return NextResponse.json(
        { error: "The item you're looking for couldn't be found." },
        { status: 404 }
      );
    }

    const existing = await db.query.sanctions.findFirst({
      where: eq(sanctions.name, name),
    });

    if (existing && existing.id !== id) {
      return NextResponse.json(
        { error: "Sanction name already exists" },
        { status: 409 }
      );
    }

    const [updated] = await db
      .update(sanctions)
      .set({ name })
      .where(eq(sanctions.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    const token = getTokenFromRequest(request);
    const user = token ? verifyToken(token) : null;
    await logError({
      source: "api/sanctions/[id]",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      request,
      userId: user?.id,
      userRole: user?.role,
    });
    return NextResponse.json(
      { error: "Couldn't save the sanction. Please try again." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return NextResponse.json({ error: "You need to log in to access this." }, { status: 401 });
    const user = verifyToken(token);
    if (!user) return NextResponse.json({ error: "You need to log in to access this." }, { status: 401 });
    if (!["ADMIN", "SECRETARY", "CHAIRMAN"].includes(user.role)) {
      return NextResponse.json({ error: "You don't have permission to do this." }, { status: 403 });
    }

    const { id } = await params;

    const sanction = await db.query.sanctions.findFirst({
      where: eq(sanctions.id, id),
    });

    if (!sanction) {
      return NextResponse.json(
        { error: "The item you're looking for couldn't be found." },
        { status: 404 }
      );
    }

    await db.delete(sanctions).where(eq(sanctions.id, id));

    return NextResponse.json({ message: "Sanction deleted" });
  } catch (error) {
    const token = getTokenFromRequest(request);
    const user = token ? verifyToken(token) : null;
    await logError({
      source: "api/sanctions/[id]",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      request,
      userId: user?.id,
      userRole: user?.role,
    });
    return NextResponse.json(
      { error: "Couldn't delete the sanction. Please try again." },
      { status: 500 }
    );
  }
}
