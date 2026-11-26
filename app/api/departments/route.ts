import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { departments } from "@/lib/db/schema";
import { getTokenFromRequest, verifyToken, isAdminOrOfficeHolder } from "@/lib/auth";
import { departmentSchema } from "@/lib/validations";
import { logError } from "@/lib/error-logger";

export async function GET() {
  try {
    const allDepartments = await db.select().from(departments);
    return NextResponse.json(allDepartments);
  } catch (error) {
    await logError({
      source: "api/departments",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: "Couldn't load departments. Please try again." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: "You need to log in to access this." }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!isAdminOrOfficeHolder(user!)) {
      return NextResponse.json({ error: "You don't have permission to do this." }, { status: 403 });
    }

    const body = await request.json();
    const parsed = departmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }
    const { name } = parsed.data;

    const existing = await db.query.departments.findFirst({
      where: eq(departments.name, name),
    });

    if (existing) {
      return NextResponse.json(
        { error: "Department already exists" },
        { status: 409 }
      );
    }

    const id = crypto.randomUUID();
    const [newDepartment] = await db
      .insert(departments)
      .values({ id, name })
      .returning();

    return NextResponse.json(newDepartment, { status: 201 });
  } catch (error) {
    const token = getTokenFromRequest(request);
    const user = token ? verifyToken(token) : null;
    await logError({
      source: "api/departments",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      request,
      userId: user?.id,
      userRole: user?.role,
    });
    return NextResponse.json(
      { error: "Couldn't save the department. Please try again." },
      { status: 500 }
    );
  }
}
