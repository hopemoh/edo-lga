import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { disciplinaryCases, staff, lgas } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { getTokenFromRequest, verifyToken, isAdminOrOfficeHolder } from "@/lib/auth";
import { disciplinaryCaseSchema } from "@/lib/validations";
import { logError } from "@/lib/error-logger";

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

    let whereCondition;
    if (user.role === "STAFF") {
      whereCondition = eq(disciplinaryCases.staffId, user.id);
    }

    const cases = await db.query.disciplinaryCases.findMany({
      where: whereCondition,
      with: {
        staff: {
          with: {
            lga: true,
          },
        },
      },
      orderBy: [desc(disciplinaryCases.dateReported)],
    });
    return NextResponse.json(cases);
  } catch (error) {
    await logError({
      source: "api/disciplinary",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: "Couldn't load disciplinary records. Please try again." },
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
    const parsed = disciplinaryCaseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }
    const { staffId, title, description, status, sanction, dateReported, dateResolved } = parsed.data;

    const id = crypto.randomUUID();
    await db.insert(disciplinaryCases).values({
      id,
      staffId,
      title,
      description,
      status: status || "Pending",
      sanction: sanction || null,
      dateReported: new Date(dateReported),
      dateResolved: dateResolved ? new Date(dateResolved) : null,
    });

    const newCase = await db.query.disciplinaryCases.findFirst({
      where: eq(disciplinaryCases.id, id),
      with: { staff: { with: { lga: true } } },
    });

    return NextResponse.json(newCase, { status: 201 });
  } catch (error) {
    const token = getTokenFromRequest(request);
    const user = token ? verifyToken(token) : null;
    await logError({
      source: "api/disciplinary",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      request,
      userId: user?.id,
      userRole: user?.role,
    });
    return NextResponse.json(
      { error: "Couldn't save the disciplinary record. Please try again." },
      { status: 500 }
    );
  }
}
