import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { systemSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: "You need to log in to access this." }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!["ADMIN", "SECRETARY", "CHAIRMAN"].includes(user.role)) {
      return NextResponse.json({ error: "You don't have permission to do this." }, { status: 403 });
    }

    const settings = await db.query.systemSettings.findMany();
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json(
      { error: "Couldn't load settings. Please try again." },
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
    if (user.role !== "CHAIRMAN") {
      return NextResponse.json({ error: "You don't have permission to do this." }, { status: 403 });
    }

    const body = await request.json();
    const { key, value, label } = body;

    if (!key || !value) {
      return NextResponse.json(
        { error: "key and value are required" },
        { status: 400 }
      );
    }

    const existing = await db.query.systemSettings.findFirst({
      where: eq(systemSettings.key, key),
    });

    if (existing) {
      await db
        .update(systemSettings)
        .set({ value, label: label || existing.label, updatedAt: new Date() })
        .where(eq(systemSettings.key, key));
    } else {
      await db.insert(systemSettings).values({
        id: crypto.randomUUID(),
        key,
        value,
        label: label || null,
      });
    }

    const updated = await db.query.systemSettings.findFirst({
      where: eq(systemSettings.key, key),
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: "Couldn't save settings. Please try again." },
      { status: 500 }
    );
  }
}
