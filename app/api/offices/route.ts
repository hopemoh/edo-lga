import { NextRequest, NextResponse } from "next/server";
import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { offices, staff, logEntries, lgas, statuses } from "@/lib/db/schema";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { createAuditLog } from "@/lib/approval-utils";
import { logError } from "@/lib/error-logger";

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { error: "You need to log in to access this." },
        { status: 401 }
      );
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json(
        { error: "You need to log in to access this." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get("staffId");
    const name = searchParams.get("name");

    const conditions = [eq(offices.isActive, true)];

    if (staffId) {
      conditions.push(eq(offices.staffId, staffId));
    }

    if (name) {
      conditions.push(eq(offices.name, name as "CHAIRMAN" | "SECRETARY"));
    }

    const result = await db.query.offices.findMany({
      where: and(...conditions),
      with: {
        staff: true,
      },
      orderBy: [desc(offices.createdAt)],
    });

    return NextResponse.json(result);
  } catch (error) {
    await logError({
      source: "api/offices",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: "Couldn't load offices. Please try again." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { error: "You need to log in to access this." },
        { status: 401 }
      );
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json(
        { error: "You need to log in to access this." },
        { status: 401 }
      );
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "You don't have permission to do this." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { officeName, staffId, name, phoneNumber, dateOfBirth, dateOfFirstAppt, sex } = body;

    if (!officeName || !["CHAIRMAN", "SECRETARY"].includes(officeName)) {
      return NextResponse.json(
        { error: "Office name must be either CHAIRMAN or SECRETARY." },
        { status: 400 }
      );
    }

    let finalStaffId = staffId;

    if (officeName === "CHAIRMAN" && !staffId) {
      // Create minimal staff record for CHAIRMAN — no LGA
      if (!name || !phoneNumber || !dateOfBirth) {
        return NextResponse.json(
          { error: "Name, phone number, and date of birth are required for CHAIRMAN." },
          { status: 400 }
        );
      }

      const existingStatus = await db.query.statuses.findFirst();
      if (!existingStatus) {
        return NextResponse.json(
          { error: "System setup incomplete. Please contact support." },
          { status: 500 }
        );
      }

      const maxSerial = await db
        .select({ max: sql<number>`coalesce(max(${staff.serialNumber}), 0)` })
        .from(staff);
      const nextSerial = (maxSerial[0]?.max ?? 0) + 1;

      const normalizedPhone = phoneNumber.replace(/^0+/, "");

      const newStaffId = crypto.randomUUID();
      await db
        .insert(staff)
        .values({
          id: newStaffId,
          lgaId: null,
          serialNumber: nextSerial,
          name,
          sex: sex || "Male",
          statusId: existingStatus.id,
          role: "CHAIRMAN",
          dateOfBirth: new Date(dateOfBirth),
          dateOfFirstAppt: dateOfFirstAppt ? new Date(dateOfFirstAppt) : new Date(),
          phoneNumber: normalizedPhone,
          isExternal: true,
        })
        .returning();

      finalStaffId = newStaffId;
    }

    if (officeName === "SECRETARY" && !staffId) {
      return NextResponse.json(
        { error: "Staff member is required for the Secretary office." },
        { status: 400 }
      );
    }

    if (finalStaffId) {
      const staffMember = await db.query.staff.findFirst({
        where: eq(staff.id, finalStaffId),
      });
      if (!staffMember) {
        return NextResponse.json(
          { error: "The staff member could not be found." },
          { status: 404 }
        );
      }
    }

    const existingActive = await db.query.offices.findFirst({
      where: and(
        eq(offices.name, officeName),
        eq(offices.isActive, true)
      ),
    });

    if (existingActive) {
      await db
        .update(offices)
        .set({ isActive: false, revokedAt: new Date() })
        .where(eq(offices.id, existingActive.id));

      // Revert previous office holder's role to ADMIN
      if (existingActive.staffId) {
        await db
          .update(staff)
          .set({ role: "ADMIN" })
          .where(eq(staff.id, existingActive.staffId));
      }
    }

    const newOfficeId = crypto.randomUUID();
    const [newOffice] = await db
      .insert(offices)
      .values({
        id: newOfficeId,
        name: officeName,
        staffId: finalStaffId || null,
        isActive: true,
      })
      .returning();

    // Update new office holder's role
    if (finalStaffId) {
      await db
        .update(staff)
        .set({ role: officeName })
        .where(eq(staff.id, finalStaffId));
    }

    // Get names for audit log
    let newStaffName = "";
    let oldStaffName = "";
    if (finalStaffId) {
      const newStaff = await db.query.staff.findFirst({ where: eq(staff.id, finalStaffId) });
      newStaffName = newStaff?.name || "";
    }
    if (existingActive?.staffId) {
      const oldStaff = await db.query.staff.findFirst({ where: eq(staff.id, existingActive.staffId) });
      oldStaffName = oldStaff?.name || "";
    }

    const logDetails = existingActive
      ? `${officeName}: From ${oldStaffName || "Unknown"} → To ${newStaffName || "Unknown"}`
      : `${officeName} office created for ${newStaffName || "Unknown"}`;

    await createAuditLog(
      "CREATE",
      {
        userId: user.id,
        userFullName: user.name,
        userRole: "ADMIN",
        rank: "ADMIN",
      },
      {
        officeId: newOfficeId,
        officeName,
        staffId: finalStaffId,
        replacedOfficeId: existingActive?.id,
        from: oldStaffName || undefined,
        to: newStaffName,
      },
      undefined,
      finalStaffId || undefined
    );

    await db.insert(logEntries).values({
      id: crypto.randomUUID(),
      action: "CREATE",
      details: logDetails,
      userId: user.id,
      userFullName: user.name,
      userRank: "ADMIN",
      userRole: "ADMIN",
    });

    return NextResponse.json(newOffice, { status: 201 });
  } catch (error) {
    const token = getTokenFromRequest(request);
    const user = token ? verifyToken(token) : null;
    await logError({
      source: "api/offices",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      request,
      userId: user?.id,
      userRole: user?.role,
    });
    return NextResponse.json(
      { error: "Couldn't create the office. Please try again." },
      { status: 500 }
    );
  }
}
