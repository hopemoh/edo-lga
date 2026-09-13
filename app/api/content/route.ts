import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contentSections } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

export async function GET() {
  try {
    const sections = await db.query.contentSections.findMany();
    return NextResponse.json(sections);
  } catch (error) {
    return NextResponse.json(
      { error: "Couldn't load content. Please try again." },
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
    const { section, title, subtitle, content } = body;

    if (!section || !title || !content) {
      return NextResponse.json(
        { error: "section, title, and content are required" },
        { status: 400 }
      );
    }

    // Upsert: check if exists
    const existing = await db.query.contentSections.findFirst({
      where: eq(contentSections.section, section),
    });

    if (existing) {
      await db
        .update(contentSections)
        .set({ title, subtitle: subtitle || null, content, updatedAt: new Date() })
        .where(eq(contentSections.section, section));
    } else {
      await db.insert(contentSections).values({
        id: crypto.randomUUID(),
        section,
        title,
        subtitle: subtitle || null,
        content,
      });
    }

    const updated = await db.query.contentSections.findFirst({
      where: eq(contentSections.section, section),
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: "Couldn't save content. Please try again." },
      { status: 500 }
    );
  }
}
