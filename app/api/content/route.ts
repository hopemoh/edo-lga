import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contentSections } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { contentSectionSchema } from "@/lib/validations";
import { logError } from "@/lib/error-logger";

export async function GET() {
  try {
    const sections = await db.query.contentSections.findMany();
    return NextResponse.json(sections);
  } catch (error) {
    await logError({
      source: "api/content",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
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
    if (!["ADMIN", "SECRETARY", "CHAIRMAN"].includes(user?.role ?? "ADMIN")) {
      return NextResponse.json({ error: "You don't have permission to do this." }, { status: 403 });
    }

    const body = await request.json();
    const parsed = contentSectionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }
    const { section, title, subtitle, content } = parsed.data;

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
        content: content ?? "",
        updatedAt: new Date(),
      });
    }

    const updated = await db.query.contentSections.findFirst({
      where: eq(contentSections.section, section),
    });

    return NextResponse.json(updated);
  } catch (error) {
    const token = getTokenFromRequest(request);
    const user = token ? verifyToken(token) : null;
    await logError({
      source: "api/content",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      request,
      userId: user?.id,
      userRole: user?.role,
    });
    return NextResponse.json(
      { error: "Couldn't save content. Please try again." },
      { status: 500 }
    );
  }
}
