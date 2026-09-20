import { NextRequest, NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { executives } from "@/lib/db/schema";
import {
  getTokenFromRequest,
  verifyToken,
  isAdminOrOfficeHolder,
} from "@/lib/auth";
import {
  uploadToS3,
  S3_FOLDERS,
  generateS3Key,
} from "@/lib/s3";
import { executiveSchema } from "@/lib/validations";
import { logError } from "@/lib/error-logger";

export async function GET() {
  try {
    const allExecutives = await db
      .select()
      .from(executives)
      .orderBy(asc(executives.order));
    return NextResponse.json(allExecutives);
  } catch (error) {
    await logError({
      source: "api/executives",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: "Couldn't load executives. Please try again." },
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
    if (!isAdminOrOfficeHolder(user!)) {
      return NextResponse.json({ error: "You don't have permission to do this." }, { status: 403 });
    }

    const formData = await request.formData();
    const name = formData.get("name") as string;
    const role = formData.get("role") as string;
    const order = formData.get("order") as string;

    const parsed = executiveSchema.safeParse({ name, role, order: order ? parseInt(order) : undefined });
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const imageFile = formData.get("image") as File | null;

    if (imageFile && imageFile.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Image size must be less than 5MB" }, { status: 400 });
    }

    let imageUrl: string | null = null;
    if (imageFile && imageFile.size > 0) {
      const id = crypto.randomUUID();
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      const key = generateS3Key(S3_FOLDERS.EXECUTIVE_IMAGES, imageFile.name, id);
      imageUrl = await uploadToS3(buffer, key, imageFile.type);
    }

    const id = crypto.randomUUID();
    const [newExecutive] = await db
      .insert(executives)
      .values({
        id,
        name,
        role,
        image: imageUrl,
        order: order ? parseInt(order) : 0,
      })
      .returning();

    return NextResponse.json(newExecutive, { status: 201 });
  } catch (error) {
    const token = getTokenFromRequest(request);
    const user = token ? verifyToken(token) : null;
    await logError({
      source: "api/executives",
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
