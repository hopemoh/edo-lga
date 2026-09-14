import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { landingPageHighlights } from "@/lib/db/schema";
import {
  getTokenFromRequest,
  verifyToken,
} from "@/lib/auth";
import {
  uploadToS3,
  S3_FOLDERS,
  generateS3Key,
} from "@/lib/s3";
import { logError } from "@/lib/error-logger";

export async function GET(request: NextRequest) {
  try {
    const type = request.nextUrl.searchParams.get("type");

    const conditions = [];
    if (type) {
      conditions.push(eq(landingPageHighlights.type, type as any));
    }

    const where =
      conditions.length > 0
        ? conditions.reduce((a, b) => a && b)
        : undefined;

    const allHighlights = await db
      .select()
      .from(landingPageHighlights)
      .where(where)
      .orderBy(asc(landingPageHighlights.order));

    return NextResponse.json(allHighlights);
  } catch (error) {
    await logError({
      source: "api/highlights",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      request,
    });
    return NextResponse.json(
      { error: "Couldn't load highlights. Please try again." },
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
    if (!["ADMIN", "SECRETARY", "CHAIRMAN"].includes(user!.role)) {
      return NextResponse.json({ error: "You don't have permission to do this." }, { status: 403 });
    }

    const formData = await request.formData();
    const type = formData.get("type") as string;
    const title = formData.get("title") as string;
    const subtitle = formData.get("subtitle") as string;
    const description = formData.get("description") as string;
    const order = formData.get("order") as string;
    const imageFile = formData.get("image") as File | null;

    if (!type || !title || !subtitle) {
      return NextResponse.json(
        { error: "Type, title, and subtitle are required" },
        { status: 400 }
      );
    }

    if (imageFile && imageFile.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Image size must be less than 5MB" }, { status: 400 });
    }

    let imageUrl: string | null = null;
    if (imageFile && imageFile.size > 0) {
      const id = crypto.randomUUID();
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      const key = generateS3Key(S3_FOLDERS.HIGHLIGHT_IMAGES, imageFile.name, id);
      imageUrl = await uploadToS3(buffer, key, imageFile.type);
    }

    const id = crypto.randomUUID();
    const [newHighlight] = await db
      .insert(landingPageHighlights)
      .values({
        id,
        type: type as any,
        title,
        subtitle,
        description,
        image: imageUrl,
        order: order ? parseInt(order) : 0,
      })
      .returning();

    return NextResponse.json(newHighlight, { status: 201 });
  } catch (error) {
    const token = getTokenFromRequest(request);
    const user = token ? verifyToken(token) : null;
    await logError({
      source: "api/highlights",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      request,
      userId: user?.id,
      userRole: user?.role,
    });
    return NextResponse.json(
      { error: "Couldn't save the highlight. Please try again." },
      { status: 500 }
    );
  }
}
