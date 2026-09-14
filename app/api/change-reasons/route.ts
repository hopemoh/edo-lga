import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { changeReasons } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { changeReasonSchema } from "@/lib/validations";
import { logError } from "@/lib/error-logger";

export async function GET() {
  try {
    const reasons = await db.query.changeReasons.findMany({
      where: eq(changeReasons.isActive, true),
      orderBy: [changeReasons.name],
    });
    return NextResponse.json(reasons);
  } catch (error) {
    await logError({
      source: "api/change-reasons",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: "Couldn't load change reasons. Please try again." },
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
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "You don't have permission to do this." }, { status: 403 });
    }

    const body = await request.json();
    const parsed = changeReasonSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }
    const { name, requiresDocument } = parsed.data;

    const id = crypto.randomUUID();
    await db.insert(changeReasons).values({
      id,
      name,
      requiresDocument: requiresDocument || false,
      isActive: true,
    });

    const newReason = await db.query.changeReasons.findFirst({
      where: eq(changeReasons.id, id),
    });

    return NextResponse.json(newReason, { status: 201 });
  } catch (error) {
    await logError({
      source: "api/change-reasons",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      request,
      userId: user?.id,
      userRole: user?.role,
    });
    return NextResponse.json(
      { error: "Couldn't save the change reason. Please try again." },
      { status: 500 }
    );
  }
}
