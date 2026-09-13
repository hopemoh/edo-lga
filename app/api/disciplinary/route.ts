import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { disciplinaryCases, staff, lgas } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

export async function GET() {
  try {
    const cases = await db.query.disciplinaryCases.findMany({
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
    if (!["ADMIN", "SECRETARY", "CHAIRMAN"].includes(user.role)) {
      return NextResponse.json({ error: "You don't have permission to do this." }, { status: 403 });
    }

    const body = await request.json();
    const { staffId, title, description, status, sanction } = body;

    if (!staffId || !title || !description) {
      return NextResponse.json(
        { error: "staffId, title, and description are required" },
        { status: 400 }
      );
    }

    const id = crypto.randomUUID();
    await db.insert(disciplinaryCases).values({
      id,
      staffId,
      title,
      description,
      status: status || "Pending",
      sanction: sanction || null,
    });

    const newCase = await db.query.disciplinaryCases.findFirst({
      where: eq(disciplinaryCases.id, id),
      with: { staff: { with: { lga: true } } },
    });

    return NextResponse.json(newCase, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Couldn't save the disciplinary record. Please try again." },
      { status: 500 }
    );
  }
}
