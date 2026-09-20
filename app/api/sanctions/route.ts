import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { sanctions } from "@/lib/db/schema";
import { sanctionSchema } from "@/lib/validations";
import { logError } from "@/lib/error-logger";
import { getTokenFromRequest, verifyToken, isAdminOrOfficeHolder } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: "You need to log in to access this." }, { status: 401 });
    }
    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: "You need to log in to access this." }, { status: 401 });
    }

    const allSanctions = await db.select().from(sanctions);
    return NextResponse.json(allSanctions);
  } catch (error) {
    await logError({
      source: "api/sanctions",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: "Couldn't load sanctions. Please try again." },
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
    if (!isAdminOrOfficeHolder(user)) {
      return NextResponse.json({ error: "You don't have permission to do this." }, { status: 403 });
    }

    const body = await request.json();
    const parsed = sanctionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }
    const { name } = parsed.data;

    const existing = await db.query.sanctions.findFirst({
      where: eq(sanctions.name, name),
    });

    if (existing) {
      return NextResponse.json(
        { error: "Sanction already exists" },
        { status: 409 }
      );
    }

    const id = crypto.randomUUID();
    const [newSanction] = await db
      .insert(sanctions)
      .values({ id, name })
      .returning();

    return NextResponse.json(newSanction, { status: 201 });
  } catch (error) {
    await logError({
      source: "api/sanctions",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      request,
    });
    return NextResponse.json(
      { error: "Couldn't save the sanction. Please try again." },
      { status: 500 }
    );
  }
}
