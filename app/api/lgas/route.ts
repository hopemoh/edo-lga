import { NextRequest, NextResponse } from "next/server";
import { eq, count, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { lgas, lgaDetails, staff } from "@/lib/db/schema";
import { getTokenFromRequest, verifyToken, isAdminOrOfficeHolder } from "@/lib/auth";
import {
  uploadToS3,
  S3_FOLDERS,
  generateS3Key,
} from "@/lib/s3";
import { safeParseJson } from "@/lib/utils";
import { lgaSchema } from "@/lib/validations";
import { logError } from "@/lib/error-logger";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export async function GET(request: NextRequest) {
  try {
    const requestedKind = request.nextUrl.searchParams.get("kind") || "LGA";
    if (requestedKind !== "LGA" && requestedKind !== "COMMISSION") {
      return NextResponse.json({ error: "Invalid kind." }, { status: 400 });
    }

    const allLgas = await db.query.lgas.findMany({
      where: eq(lgas.kind, requestedKind),
      with: { details: true },
    });

    const lgasWithStaffCount = await Promise.all(
      allLgas.map(async (lga) => {
        const [{ count: staffCount }] = await db
          .select({ count: count() })
          .from(staff)
          .where(
            requestedKind === "COMMISSION"
              ? eq(staff.commissionId, lga.id)
              : eq(staff.lgaId, lga.id)
          );

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
    if (!isAdminOrOfficeHolder(user!)) {
      return NextResponse.json({ error: "You don't have permission to do this." }, { status: 403 });
    }

    const formData = await request.formData();
    const name = formData.get("name") as string;
    const kind = (formData.get("kind") as string) || "LGA";
    const zone = (formData.get("zone") as string) || (kind === "COMMISSION" ? "Commission" : "");
    const description = formData.get("description") as string;

    const parsed = lgaSchema.safeParse({ name, zone, kind, description });
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    if (kind === "COMMISSION") {
      const duplicate = await db
        .select({ id: lgas.id })
        .from(lgas)
        .where(sql`${lgas.kind} = 'COMMISSION' and lower(${lgas.name}) = lower(${name})`)
        .limit(1);
      if (duplicate.length > 0) {
        return NextResponse.json(
          { error: "A commission with that name already exists." },
          { status: 409 }
        );
      }
    }

    const landmarks = formData.get("landmarks") as string;
    const activities = formData.get("activities") as string;
    const mapX = formData.get("mapX") as string;
    const mapY = formData.get("mapY") as string;
    const imageFile = formData.get("image") as File | null;

    if (imageFile && imageFile.size > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { error: "The image must be 5MB or smaller." },
        { status: 422 }
      );
    }

    const lgaId = crypto.randomUUID();
    const detailId = crypto.randomUUID();

    let imageUrl: string | null = null;
    if (imageFile && imageFile.size > 0) {
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      const key = generateS3Key(S3_FOLDERS.LGA_IMAGES, imageFile.name, lgaId);
      imageUrl = await uploadToS3(buffer, key, imageFile.type);
    }

    await db.insert(lgas).values({
      id: lgaId,
      name,
      zone,
      kind: parsed.data.kind,
    });

    await db.insert(lgaDetails).values({
      id: detailId,
      lgaId,
      description: description || "",
      landmarks: safeParseJson(landmarks, []),
      activities: safeParseJson(activities, []),
      image: imageUrl,
      mapX: mapX ? parseFloat(mapX) : 0,
      mapY: mapY ? parseFloat(mapY) : 0,
    });

    const newLga = await db.query.lgas.findFirst({
      where: eq(lgas.id, lgaId),
      with: { details: true },
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
