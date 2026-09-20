import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { landingPageHighlights } from "@/lib/db/schema";
import {
  getTokenFromRequest,
  verifyToken,
  isAdminOrOfficeHolder,
} from "@/lib/auth";
import {
  uploadToS3,
  deleteFromS3,
  extractS3Key,
  S3_FOLDERS,
  generateS3Key,
} from "@/lib/s3";
import { logError } from "@/lib/error-logger";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: "You need to log in to access this." }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!isAdminOrOfficeHolder(user!)) {
      return NextResponse.json({ error: "You don't have permission to do this." }, { status: 403 });
    }

    const { id } = await params;

    const highlight = await db.query.landingPageHighlights.findFirst({
      where: eq(landingPageHighlights.id, id),
    });

    if (!highlight) {
      return NextResponse.json(
        { error: "The item you're looking for couldn't be found." },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const type = formData.get("type") as string;
    const title = formData.get("title") as string;
    const subtitle = formData.get("subtitle") as string;
    const description = formData.get("description") as string;
    const order = formData.get("order") as string;
    const imageFile = formData.get("image") as File | null;

    if (!type || !title) {
      return NextResponse.json({ error: "Type and title are required" }, { status: 400 });
    }

    if (imageFile && imageFile.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Image size must be less than 5MB" }, { status: 400 });
    }

    let imageUrl = highlight.image;

    if (imageFile && imageFile.size > 0) {
      if (highlight.image) {
        const oldKey = extractS3Key(highlight.image);
        if (oldKey) await deleteFromS3(oldKey).catch(() => {});
      }
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      const key = generateS3Key(S3_FOLDERS.HIGHLIGHT_IMAGES, imageFile.name, id);
      imageUrl = await uploadToS3(buffer, key, imageFile.type);
    }

    const updates: Record<string, unknown> = {};
    if (type) updates.type = type;
    if (title) updates.title = title;
    if (subtitle) updates.subtitle = subtitle;
    if (description !== undefined) updates.description = description;
    if (order !== undefined && order !== null) updates.order = parseInt(order);
    updates.image = imageUrl;

    const [updated] = await db
      .update(landingPageHighlights)
      .set(updates)
      .where(eq(landingPageHighlights.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    const token = getTokenFromRequest(request);
    const user = token ? verifyToken(token) : null;
    await logError({
      source: "api/highlights/[id]",
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: "You need to log in to access this." }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!isAdminOrOfficeHolder(user!)) {
      return NextResponse.json({ error: "You don't have permission to do this." }, { status: 403 });
    }

    const { id } = await params;

    const highlight = await db.query.landingPageHighlights.findFirst({
      where: eq(landingPageHighlights.id, id),
    });

    if (!highlight) {
      return NextResponse.json(
        { error: "The item you're looking for couldn't be found." },
        { status: 404 }
      );
    }

    if (highlight.image) {
      const key = extractS3Key(highlight.image);
      if (key) await deleteFromS3(key).catch(() => {});
    }

    await db.delete(landingPageHighlights).where(eq(landingPageHighlights.id, id));

    return NextResponse.json({ message: "Highlight deleted" });
  } catch (error) {
    const token = getTokenFromRequest(request);
    const user = token ? verifyToken(token) : null;
    await logError({
      source: "api/highlights/[id]",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      request,
      userId: user?.id,
      userRole: user?.role,
    });
    return NextResponse.json(
      { error: "Couldn't delete the highlight. Please try again." },
      { status: 500 }
    );
  }
}
