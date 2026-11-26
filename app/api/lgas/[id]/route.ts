import { NextRequest, NextResponse } from "next/server";
import { eq, count, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { lgas, lgaDetails, staff } from "@/lib/db/schema";
import { getTokenFromRequest, verifyToken, isAdminOrOfficeHolder } from "@/lib/auth";
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

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const lga = await db.query.lgas.findFirst({
      where: eq(lgas.id, id),
      with: { details: true },
    });

    if (!lga) {
      return NextResponse.json({ error: "The item you're looking for couldn't be found." }, { status: 404 });
    }

    const [{ count: staffCount }] = await db
      .select({ count: count() })
      .from(staff)
      .where(
        lga.kind === "COMMISSION" ? eq(staff.commissionId, id) : eq(staff.lgaId, id)
      );

    return NextResponse.json({ ...lga, staffCount });
  } catch (error) {
    await logError({
      source: "api/lgas/[id]",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      request,
    });
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
    if (!isAdminOrOfficeHolder(user!)) {
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
    const submittedKind = formData.get("kind") as string | null;
    if (submittedKind && submittedKind !== lga.kind) {
      return NextResponse.json(
        { error: "An LGA cannot be changed into a commission, or the other way around." },
        { status: 422 }
      );
    }

    const name = formData.get("name") as string;
    const zone = formData.get("zone") as string;
    const description = formData.get("description") as string;
    const landmarks = formData.get("landmarks") as string;
    const activities = formData.get("activities") as string;
    const mapX = formData.get("mapX") as string;
    const mapY = formData.get("mapY") as string;
    const imageFile = formData.get("image") as File | null;

    const parsed = lgaSchema.safeParse({
      name: name || lga.name,
      zone: zone || lga.zone,
      kind: lga.kind,
    });
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    if (lga.kind === "COMMISSION" && name && name.trim().toLowerCase() !== lga.name.trim().toLowerCase()) {
      const duplicate = await db
        .select({ id: lgas.id })
        .from(lgas)
        .where(sql`${lgas.kind} = 'COMMISSION' and lower(${lgas.name}) = lower(${name}) and ${lgas.id} <> ${id}`)
        .limit(1);
      if (duplicate.length > 0) {
        return NextResponse.json(
          { error: "A commission with that name already exists." },
          { status: 409 }
        );
      }
    }

    if (imageFile && imageFile.size > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { error: "The image must be 5MB or smaller." },
        { status: 422 }
      );
    }

    if (name) {
      await db.update(lgas).set({ name, zone: zone || lga.zone }).where(eq(lgas.id, id));
    }

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
          description: description !== undefined && description !== null ? description : lga.details.description,
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
    const token = getTokenFromRequest(request);
    const user = token ? verifyToken(token) : null;
    await logError({
      source: "api/lgas/[id]",
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

    const lga = await db.query.lgas.findFirst({ where: eq(lgas.id, id) });
    if (!lga) {
      return NextResponse.json({ error: "The item you're looking for couldn't be found." }, { status: 404 });
    }

    const [{ count: assignedStaff }] = await db
      .select({ count: count() })
      .from(staff)
      .where(
        lga.kind === "COMMISSION"
          ? eq(staff.commissionId, id)
          : eq(staff.lgaId, id)
      );

    if (assignedStaff > 0) {
      return NextResponse.json(
        {
          error: `This commission still has ${assignedStaff} staff member${assignedStaff === 1 ? "" : "s"} assigned. Reassign them before deleting it.`,
        },
        { status: 409 }
      );
    }

    // Details rows are removed by the database cascade, but the image is not.
    const details = await db.query.lgaDetails.findFirst({ where: eq(lgaDetails.lgaId, id) });
    if (details?.image) {
      const oldKey = extractS3Key(details.image);
      if (oldKey) await deleteFromS3(oldKey).catch(() => {});
    }

    await db.delete(lgas).where(eq(lgas.id, id));

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const token = getTokenFromRequest(request);
    const user = token ? verifyToken(token) : null;
    await logError({
      source: "api/lgas/[id] DELETE",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      request,
      userId: user?.id,
      userRole: user?.role,
    });
    return NextResponse.json(
      { error: "Couldn't delete this item. Please try again." },
      { status: 500 }
    );
  }
}
