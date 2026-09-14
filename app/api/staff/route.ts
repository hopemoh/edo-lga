import { NextRequest, NextResponse } from "next/server";
import { eq, desc, and, sql, count } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  staff,
  staffRanks,
  staffQualifications,
  staffCertifications,
  logEntries,
  documentHistory,
} from "@/lib/db/schema";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import {
  uploadToS3,
  generateS3Key,
  S3_FOLDERS,
} from "@/lib/s3";
import { staffCreateSchema } from "@/lib/validations";
import { logError } from "@/lib/error-logger";

function generateId(): string {
  return crypto.randomUUID();
}

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: "You need to log in to access this." }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: "You need to log in to access this." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const lgaIdParam = searchParams.get("lgaId");

    let whereCondition;
    if (user.role === "STAFF" && user.lgaId) {
      whereCondition = eq(staff.lgaId, user.lgaId);
    } else if (lgaIdParam) {
      whereCondition = eq(staff.lgaId, lgaIdParam);
    }

    const staffList = await db.query.staff.findMany({
      where: whereCondition,
      with: {
        lga: true,
        status: true,
        ranks: {
          with: {
            rank: true,
          },
        },
        qualifications: {
          with: {
            qualification: true,
          },
        },
        certifications: {
          with: {
            certification: true,
          },
        },
      },
      orderBy: [desc(staff.createdAt)],
    });

    const transformed = staffList.map((s) => ({
      ...s,
      rank: s.ranks.length > 0 ? s.ranks[0].rank : null,
      qualifications: s.qualifications.map((sq) => sq.qualification),
      certifications: s.certifications.map((sc) => sc.certification),
    }));

    return NextResponse.json(transformed);
  } catch (error) {
    const token = getTokenFromRequest(request);
    const user = token ? verifyToken(token) : null;
    await logError({
      source: "api/staff",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      request,
      userId: user?.id,
      userRole: user?.role,
    });
    return NextResponse.json(
      { error: "Couldn't load staff records right now. Please try again." },
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
    if (!user) {
      return NextResponse.json({ error: "You need to log in to access this." }, { status: 401 });
    }

    if (!["ADMIN", "SECRETARY", "CHAIRMAN"].includes(user.role)) {
      return NextResponse.json({ error: "You don't have permission to do this." }, { status: 403 });
    }

    const contentType = request.headers.get("content-type") || "";
    let body: any;
    let documentFile: File | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const dataStr = formData.get("data") as string | null;
      if (!dataStr) {
        return NextResponse.json({ error: "Missing form data" }, { status: 400 });
      }
      try {
        body = JSON.parse(dataStr);
      } catch {
        return NextResponse.json({ error: "Invalid JSON in form data" }, { status: 400 });
      }
      const doc = formData.get("document");
      if (doc instanceof File) {
        documentFile = doc;
      }
    } else {
      body = await request.json();
    }

    if (documentFile && documentFile.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 10MB" }, { status: 400 });
    }

    const parsed = staffCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const {
      lgaId,
      name,
      sex,
      statusId,
      sgl = 0,
      dateOfBirth,
      dateOfFirstAppt,
      dateOfConf,
      dateOfPresentAppt,
      phoneNumber,
      recommendedRetirementDate,
      remark,
    } = parsed.data;

    const serialNumber = body.serialNumber;
    const staffRole = body.role ?? "STAFF";
    const yearsExperience = body.yearsExperience;
    const rankId = body.rankId;
    const qualificationIds = body.qualificationIds ?? [];

    let documentUrl: string | null = null;
    if (documentFile) {
      const buffer = Buffer.from(await documentFile.arrayBuffer());
      const key = generateS3Key(S3_FOLDERS.STAFF_DOCUMENTS, documentFile.name);
      documentUrl = await uploadToS3(buffer, key, documentFile.type || "application/pdf");
    }

    const staffId = generateId();

    const [newStaff] = await db
      .insert(staff)
      .values({
        id: staffId,
        lgaId,
        serialNumber,
        name,
        sex,
        statusId,
        role: staffRole as "STAFF" | "ADMIN" | "SECRETARY" | "CHAIRMAN",
        sgl,
        dateOfBirth: new Date(dateOfBirth),
        dateOfFirstAppt: new Date(dateOfFirstAppt),
        dateOfConf: dateOfConf ? new Date(dateOfConf) : null,
        dateOfPresentAppt: dateOfPresentAppt ? new Date(dateOfPresentAppt) : null,
        phoneNumber,
        recommendedRetirementDate: recommendedRetirementDate
          ? new Date(recommendedRetirementDate)
          : null,
        documentUrl,
        remark,
        yearsExperience: yearsExperience || null,
      })
      .returning();

    if (documentUrl) {
      await db.insert(documentHistory).values({
        id: generateId(),
        staffId,
        documentUrl,
        uploadedBy: user.id,
        reason: "Initial upload",
      });
    }

    if (rankId) {
      await db.insert(staffRanks).values({
        id: generateId(),
        staffId,
        rankId,
      });
    }

    for (const qualId of qualificationIds) {
      await db.insert(staffQualifications).values({
        id: generateId(),
        staffId,
        qualificationId: qualId,
      });
    }

    await db.insert(logEntries).values({
      id: generateId(),
      action: "CREATE",
      details: `Created staff record for ${name}`,
      userId: user.id,
      userFullName: user.name,
      userRank: "",
      userRole: (user.role ?? "STAFF") as "STAFF" | "ADMIN" | "SECRETARY" | "CHAIRMAN",
    });

    return NextResponse.json(newStaff, { status: 201 });
  } catch (error) {
    const token = getTokenFromRequest(request);
    const user = token ? verifyToken(token) : null;
    await logError({
      source: "api/staff",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      request,
      userId: user?.id,
      userRole: user?.role,
    });
    return NextResponse.json(
      { error: "Something went wrong while saving. Please try again." },
      { status: 500 }
    );
  }
}
