import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { ranks } from "@/lib/db/schema";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

export async function GET() {
  try {
    const allRanks = await db.select().from(ranks);
    return NextResponse.json(allRanks);
  } catch (error) {
    return NextResponse.json(
      { error: "Couldn't load ranks. Please try again." },
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

    const existing = await db.query.ranks.findFirst({
      where: eq(ranks.name, name),
    });

    if (existing) {
      return NextResponse.json(
        { error: "Rank already exists" },
        { status: 409 }
      );
    }

    const id = crypto.randomUUID();
    const [newRank] = await db.insert(ranks).values({ id, name }).returning();

    return NextResponse.json(newRank, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Couldn't save the rank. Please try again." },
      { status: 500 }
    );
  }
}
