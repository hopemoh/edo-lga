import { NextRequest, NextResponse } from "next/server";
import { eq, count } from "drizzle-orm";
import { db } from "@/lib/db";
import { lgas, lgaDetails, staff } from "@/lib/db/schema";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import {
  uploadToS3,
  deleteFromS3,
  extractS3Key,
  S3_FOLDERS,
  generateS3Key,
} from "@/lib/s3";
import { safeParseJson } from "@/lib/utils";
import { lgaSchema } from "@/lib/validations";
import { logError } from "@/lib/error-logger";

export async function GET() {
  try {
    const allLgas = await db.query.lgas.findMany({
      with: {
        details: true,
      },
    });

    const lgasWithStaffCount = await Promise.all(
      allLgas.map(async (lga) => {
        const [{ count: staffCount }] = await db
          .select({ count: count() })
          .from(staff)
          .where(eq(staff.lgaId, lga.id));

        return { ...lga, staffCount };
      })
    );

    return NextResponse.json(lgasWithStaffCount);
  } catch (error) {
    await logError({
      source: "api/lgas",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: "Couldn't load LGAs. Please try again." },
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
    const name = formData.get("name") as string;
    const zone = formData.get("zone") as string;
    const description = formData.get("description") as string;

    const parsed = lgaSchema.safeParse({ name, zone, description });
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const landmarks = formData.get("landmarks") as string;
    const activities = formData.get("activities") as string;
    const mapX = formData.get("mapX") as string;
    const mapY = formData.get("mapY") as string;
    const imageFile = formData.get("image") as File | null;

    const lgaId = crypto.randomUUID();
    const detailId = crypto.randomUUID();

    let imageUrl: string | null = null;
    if (imageFile && imageFile.size > 0) {
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      const key = generateS3Key(
        S3_FOLDERS.LGA_IMAGES,
        imageFile.name,
        lgaId
      );
      imageUrl = await uploadToS3(buffer, key, imageFile.type);
    }

    await db.insert(lgas).values({
      id: lgaId,
      name,
      zone,
    });

    await db.insert(lgaDetails).values({
      id: detailId,
      lgaId,
      description,
      landmarks: safeParseJson(landmarks, []),
      activities: safeParseJson(activities, []),
      image: imageUrl,
      mapX: mapX ? parseFloat(mapX) : 0,
      mapY: mapY ? parseFloat(mapY) : 0,
    });

    const newLga = await db.query.lgas.findFirst({
      where: eq(lgas.id, lgaId),
      with: {
        details: true,
      },
    });

    return NextResponse.json(newLga, { status: 201 });
  } catch (error) {
    const token = getTokenFromRequest(request);
    const user = token ? verifyToken(token) : null;
    await logError({
      source: "api/lgas",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      request,
      userId: user?.id,
      userRole: user?.role,
    });
    return NextResponse.json(
      { error: "Couldn't save the LGA. Please try again." },
      { status: 500 }
    );
  }
}
