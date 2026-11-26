import { NextRequest, NextResponse } from "next/server";
import { eq, count } from "drizzle-orm";
import { db } from "@/lib/db";
import { departments, staff } from "@/lib/db/schema";
import { getTokenFromRequest, verifyToken, isAdminOrOfficeHolder } from "@/lib/auth";
import { departmentSchema } from "@/lib/validations";
import { logError } from "@/lib/error-logger";

export async function PUT(
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
    const existing = await db.query.departments.findFirst({
      where: eq(departments.id, id),
    });
    if (!existing) {
      return NextResponse.json(
        { error: "The item you're looking for couldn't be found." },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = departmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }
    const { name } = parsed.data;

    const duplicate = await db.query.departments.findFirst({
      where: eq(departments.name, name),
    });
    if (duplicate && duplicate.id !== id) {
      return NextResponse.json({ error: "Department already exists" }, { status: 409 });
    }

    const [updated] = await db
      .update(departments)
      .set({ name })
      .where(eq(departments.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    const token = getTokenFromRequest(request);
    const user = token ? verifyToken(token) : null;
    await logError({
      source: "api/departments/[id] PUT",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      request,
      userId: user?.id,
      userRole: user?.role,
    });
    return NextResponse.json(
      { error: "Couldn't save your changes. Please try again." },
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
    if (!token) {
      return NextResponse.json({ error: "You need to log in to access this." }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!isAdminOrOfficeHolder(user!)) {
      return NextResponse.json({ error: "You don't have permission to do this." }, { status: 403 });
    }

    const { id } = await params;

    const department = await db.query.departments.findFirst({
      where: eq(departments.id, id),
    });

    if (!department) {
      return NextResponse.json(
        { error: "The item you're looking for couldn't be found." },
        { status: 404 }
      );
    }

    const [{ count: usageCount }] = await db
      .select({ count: count() })
      .from(staff)
      .where(eq(staff.departmentId, id));

    if (usageCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete department: ${usageCount} staff member(s) are using it`,
        },
        { status: 409 }
      );
    }

    await db.delete(departments).where(eq(departments.id, id));

    return NextResponse.json({ message: "Department deleted" });
  } catch (error) {
    const token = getTokenFromRequest(request);
    const user = token ? verifyToken(token) : null;
    await logError({
      source: "api/departments/[id] DELETE",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      request,
      userId: user?.id,
      userRole: user?.role,
    });
    return NextResponse.json(
      { error: "Couldn't delete the department. Please try again." },
      { status: 500 }
    );
  }
}
