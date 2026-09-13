import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { changeReasons } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

export async function GET() {
  try {
    const reasons = await db.query.changeReasons.findMany({
      where: eq(changeReasons.isActive, true),
      orderBy: [changeReasons.name],
    });
    return NextResponse.json(reasons);
  } catch (error) {
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
    const { name, requiresDocument } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

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
    return NextResponse.json(
      { error: "Couldn't save the change reason. Please try again." },
      { status: 500 }
    );
  }
}
