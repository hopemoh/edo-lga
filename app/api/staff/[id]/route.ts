import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  staff,
  staffRanks,
  staffQualifications,
  staffCertifications,
  auditLogs,
} from "@/lib/db/schema";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { staffUpdateSchema } from "@/lib/validations";
import { logError } from "@/lib/error-logger";

function generateId(): string {
  return crypto.randomUUID();
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: "You need to log in to access this." }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: "You need to log in to access this." }, { status: 401 });
    }

    const staffRecord = await db.query.staff.findFirst({
      where: eq(staff.id, id),
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
    });

    if (!staffRecord) {
      return NextResponse.json({ error: "The item you're looking for couldn't be found." }, { status: 404 });
    }

    const transformed = {
      ...staffRecord,
      rank: staffRecord.ranks.length > 0 ? staffRecord.ranks[0].rank : null,
      qualifications: staffRecord.qualifications.map((sq) => sq.qualification),
      certifications: staffRecord.certifications.map((sc) => sc.certification),
    };

    return NextResponse.json(transformed);
  } catch (error) {
    await logError({
      source: "api/staff/[id]",
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const body = await request.json();
    const parsed = staffUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }
    const {
      name,
      sex,
      statusId,
      role: staffRole,
      sgl,
      dateOfBirth,
      dateOfFirstAppt,
      dateOfConf,
      dateOfPresentAppt,
      phoneNumber,
      recommendedRetirementDate,
      remark,
      yearsExperience,
      rankId,
      qualificationIds,
      certificationIds,
      changeRequestId,
    } = parsed.data;

    const existingStaff = await db.query.staff.findFirst({
      where: eq(staff.id, id),
    });

    if (!existingStaff) {
      return NextResponse.json({ error: "The item you're looking for couldn't be found." }, { status: 404 });
    }

    const updateData: Record<string, any> = { updatedAt: new Date() };

    if (name !== undefined) updateData.name = name;
    if (sex !== undefined) updateData.sex = sex;
    if (statusId !== undefined) updateData.statusId = statusId;
    if (staffRole !== undefined) updateData.role = staffRole;
    if (sgl !== undefined) updateData.sgl = sgl;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = new Date(dateOfBirth);
    if (dateOfFirstAppt !== undefined) updateData.dateOfFirstAppt = new Date(dateOfFirstAppt);
    if (dateOfConf !== undefined) updateData.dateOfConf = dateOfConf ? new Date(dateOfConf) : null;
    if (dateOfPresentAppt !== undefined) updateData.dateOfPresentAppt = dateOfPresentAppt ? new Date(dateOfPresentAppt) : null;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (recommendedRetirementDate !== undefined) {
      updateData.recommendedRetirementDate = recommendedRetirementDate
        ? new Date(recommendedRetirementDate)
        : null;
    }
    if (remark !== undefined) updateData.remark = remark;
    if (yearsExperience !== undefined) updateData.yearsExperience = yearsExperience;

    const [updatedStaff] = await db
      .update(staff)
      .set(updateData)
      .where(eq(staff.id, id))
      .returning();

    if (rankId !== undefined) {
      await db
        .delete(staffRanks)
        .where(eq(staffRanks.staffId, id));
      if (rankId) {
        await db.insert(staffRanks).values({
          id: generateId(),
          staffId: id,
          rankId,
        });
      }
    }

    if (qualificationIds !== undefined) {
      await db
        .delete(staffQualifications)
        .where(eq(staffQualifications.staffId, id));
      for (const qualId of qualificationIds) {
        await db.insert(staffQualifications).values({
          id: generateId(),
          staffId: id,
          qualificationId: qualId,
        });
      }
    }

    if (certificationIds !== undefined) {
      await db
        .delete(staffCertifications)
        .where(eq(staffCertifications.staffId, id));
      for (const certId of certificationIds) {
        await db.insert(staffCertifications).values({
          id: generateId(),
          staffId: id,
          certificationId: certId,
        });
      }
    }

    if (changeRequestId) {
      const changes: Record<string, any> = {};
      const oldValues: Record<string, any> = {};

      for (const [key, newVal] of Object.entries(updateData)) {
        if (key === "updatedAt") continue;
        const oldVal = (existingStaff as any)[key];
        if (newVal !== undefined && JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
          changes[key] = newVal;
          oldValues[key] = oldVal;
        }
      }

      await db.insert(auditLogs).values({
        id: generateId(),
        changeRequestId,
        action: "UPDATE_STAFF",
        staffId: id,
        details: `Updated fields: ${Object.keys(changes).join(", ")}`,
        performedBy: user.id,
        performedByFullName: user.name,
        performedByRole: user.role,
      });
    }

    return NextResponse.json(updatedStaff);
  } catch (error) {
    await logError({
      source: "api/staff/[id]",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      request,
      userId: user?.id,
      userRole: user?.role,
    });
    return NextResponse.json(
      { error: "Couldn't save your changes. Please try again." },
      { status: 500 }
    );
  }
}
