import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { statuses } from "@/lib/db/schema";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { statusSchema } from "@/lib/validations";
import { logError } from "@/lib/error-logger";

export async function GET() {
  try {
    const allStatuses = await db.select().from(statuses);
    return NextResponse.json(allStatuses);
  } catch (error) {
    await logError({
      source: "api/status",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: "Couldn't load statuses. Please try again." },
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
    if (!["ADMIN", "SECRETARY", "CHAIRMAN"].includes(user.role)) {
      return NextResponse.json({ error: "You don't have permission to do this." }, { status: 403 });
    }

    const body = await request.json();
    const parsed = statusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }
    const { name } = parsed.data;

    const existing = await db.query.statuses.findFirst({
      where: eq(statuses.name, name),
    });

    if (existing) {
      return NextResponse.json(
        { error: "Status already exists" },
        { status: 409 }
      );
    }

    const id = crypto.randomUUID();
    const [newStatus] = await db
      .insert(statuses)
      .values({ id, name })
      .returning();

    return NextResponse.json(newStatus, { status: 201 });
  } catch (error) {
    await logError({
      source: "api/status",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      request,
      userId: user?.id,
      userRole: user?.role,
    });
    return NextResponse.json(
      { error: "Couldn't save the status. Please try again." },
      { status: 500 }
    );
  }
}
