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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const lga = await db.query.lgas.findFirst({
      where: eq(lgas.id, id),
      with: {
        details: true,
      },
    });

    if (!lga) {
      return NextResponse.json({ error: "The item you're looking for couldn't be found." }, { status: 404 });
    }

    const [{ count: staffCount }] = await db
      .select({ count: count() })
      .from(staff)
      .where(eq(staff.lgaId, id));

    return NextResponse.json({ ...lga, staffCount });
  } catch (error) {
    return NextResponse.json(
      { error: "Couldn't load the LGA. Please try again." },
      { status: 500 }
    );
  }
}

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
    if (!["ADMIN", "SECRETARY", "CHAIRMAN"].includes(user.role)) {
      return NextResponse.json({ error: "You don't have permission to do this." }, { status: 403 });
    }

    const { id } = await params;

    const lga = await db.query.lgas.findFirst({
      where: eq(lgas.id, id),
      with: { details: true },
    });

    if (!lga) {
      return NextResponse.json({ error: "The item you're looking for couldn't be found." }, { status: 404 });
    }

    const formData = await request.formData();
    const name = formData.get("name") as string;
    const zone = formData.get("zone") as string;
    const description = formData.get("description") as string;
    const landmarks = formData.get("landmarks") as string;
    const activities = formData.get("activities") as string;
    const mapX = formData.get("mapX") as string;
    const mapY = formData.get("mapY") as string;
    const imageFile = formData.get("image") as File | null;

    if (name) await db.update(lgas).set({ name, zone: zone || lga.zone }).where(eq(lgas.id, id));

    let imageUrl = lga.details?.image || null;

    if (imageFile && imageFile.size > 0) {
      if (lga.details?.image) {
        const oldKey = extractS3Key(lga.details.image);
        if (oldKey) await deleteFromS3(oldKey).catch(() => {});
      }
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      const key = generateS3Key(S3_FOLDERS.LGA_IMAGES, imageFile.name, id);
      imageUrl = await uploadToS3(buffer, key, imageFile.type);
    }

    if (lga.details) {
      await db
        .update(lgaDetails)
        .set({
          description: description || lga.details.description,
          landmarks: safeParseJson(landmarks, lga.details.landmarks),
          activities: safeParseJson(activities, lga.details.activities),
          image: imageUrl,
          mapX: mapX ? parseFloat(mapX) : lga.details.mapX,
          mapY: mapY ? parseFloat(mapY) : lga.details.mapY,
        })
        .where(eq(lgaDetails.lgaId, id));
    } else {
      await db.insert(lgaDetails).values({
        id: crypto.randomUUID(),
        lgaId: id,
        description: description || "",
        landmarks: safeParseJson(landmarks, []),
        activities: safeParseJson(activities, []),
        image: imageUrl,
        mapX: mapX ? parseFloat(mapX) : 0,
        mapY: mapY ? parseFloat(mapY) : 0,
      });
    }

    const updatedLga = await db.query.lgas.findFirst({
      where: eq(lgas.id, id),
      with: { details: true },
    });

    return NextResponse.json(updatedLga);
  } catch (error) {
    return NextResponse.json(
      { error: "Couldn't save the LGA. Please try again." },
      { status: 500 }
    );
  }
}
