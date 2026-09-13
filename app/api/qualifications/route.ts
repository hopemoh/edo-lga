import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { qualifications } from "@/lib/db/schema";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

export async function GET() {
  try {
    const allQualifications = await db.select().from(qualifications);
    return NextResponse.json(allQualifications);
  } catch (error) {
    return NextResponse.json(
      { error: "Couldn't load qualifications. Please try again." },
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
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const existing = await db.query.qualifications.findFirst({
      where: eq(qualifications.name, name),
    });

    if (existing) {
      return NextResponse.json(
        { error: "Qualification already exists" },
        { status: 409 }
      );
    }

    const id = crypto.randomUUID();
    const [newQualification] = await db
      .insert(qualifications)
      .values({ id, name })
      .returning();

    return NextResponse.json(newQualification, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Couldn't save the qualification. Please try again." },
      { status: 500 }
    );
  }
}
