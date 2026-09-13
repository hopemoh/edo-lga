import { NextRequest, NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { executives } from "@/lib/db/schema";
import {
  getTokenFromRequest,
  verifyToken,
} from "@/lib/auth";
import {
  uploadToS3,
  S3_FOLDERS,
  generateS3Key,
} from "@/lib/s3";

export async function GET() {
  try {
    const allExecutives = await db
      .select()
      .from(executives)
      .orderBy(asc(executives.order));
    return NextResponse.json(allExecutives);
  } catch (error) {
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
    if (!["ADMIN", "SECRETARY", "CHAIRMAN"].includes(user.role)) {
      return NextResponse.json({ error: "You don't have permission to do this." }, { status: 403 });
    }

    const formData = await request.formData();
    const name = formData.get("name") as string;
    const role = formData.get("role") as string;
    const order = formData.get("order") as string;
    const imageFile = formData.get("image") as File | null;

    if (!name || !role) {
      return NextResponse.json(
        { error: "Name and role are required" },
        { status: 400 }
      );
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
    return NextResponse.json(
      { error: "Couldn't save the executive. Please try again." },
      { status: 500 }
    );
  }
}
