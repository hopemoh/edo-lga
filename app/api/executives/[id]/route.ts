import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { executives } from "@/lib/db/schema";
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

    const executive = await db.query.executives.findFirst({
      where: eq(executives.id, id),
    });

    if (!executive) {
      return NextResponse.json(
        { error: "The item you're looking for couldn't be found." },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const name = formData.get("name") as string;
    const role = formData.get("role") as string;
    const order = formData.get("order") as string;
    const imageFile = formData.get("image") as File | null;

    if (!name || !role) {
      return NextResponse.json({ error: "Name and role are required" }, { status: 400 });
    }

    if (imageFile && imageFile.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Image size must be less than 5MB" }, { status: 400 });
    }

    let imageUrl = executive.image;

    if (imageFile && imageFile.size > 0) {
      if (executive.image) {
        const oldKey = extractS3Key(executive.image);
        if (oldKey) await deleteFromS3(oldKey).catch(() => {});
      }
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      const key = generateS3Key(S3_FOLDERS.EXECUTIVE_IMAGES, imageFile.name, id);
      imageUrl = await uploadToS3(buffer, key, imageFile.type);
    }

    const updates: Record<string, unknown> = {};
    if (name) updates.name = name;
    if (role) updates.role = role;
    if (order !== undefined && order !== null) {
      const newOrder = parseInt(order);
      updates.order = newOrder;

      const conflict = await db.query.executives.findFirst({
        where: eq(executives.order, newOrder),
      });

      if (conflict && conflict.id !== id) {
        await db
          .update(executives)
          .set({ order: conflict.order + 1 })
          .where(eq(executives.id, conflict.id));
      }
    }
    updates.image = imageUrl;

    const [updated] = await db
      .update(executives)
      .set(updates)
      .where(eq(executives.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    const token = getTokenFromRequest(request);
    const user = token ? verifyToken(token) : null;
    await logError({
      source: "api/executives/[id]",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      request,
      userId: user?.id,
      userRole: user?.role,
    });
    return NextResponse.json(
      { error: "Couldn't save the executive. Please try again." },
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

    const executive = await db.query.executives.findFirst({
      where: eq(executives.id, id),
    });

    if (!executive) {
      return NextResponse.json(
        { error: "The item you're looking for couldn't be found." },
        { status: 404 }
      );
    }

    if (executive.image) {
      const key = extractS3Key(executive.image);
      if (key) await deleteFromS3(key).catch(() => {});
    }

    await db.delete(executives).where(eq(executives.id, id));

    return NextResponse.json({ message: "Executive deleted" });
  } catch (error) {
    const token = getTokenFromRequest(request);
    const user = token ? verifyToken(token) : null;
    await logError({
      source: "api/executives/[id]",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      request,
      userId: user?.id,
      userRole: user?.role,
    });
    return NextResponse.json(
      { error: "Couldn't delete the executive. Please try again." },
      { status: 500 }
    );
  }
}
