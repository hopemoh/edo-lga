import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { statuses } from "@/lib/db/schema";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

export async function GET() {
  try {
    const allStatuses = await db.select().from(statuses);
    return NextResponse.json(allStatuses);
  } catch (error) {
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
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

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
    return NextResponse.json(
      { error: "Couldn't save the status. Please try again." },
      { status: 500 }
    );
  }
}
