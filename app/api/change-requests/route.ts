import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { changeRequests, staff, changeReasons } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getTokenFromRequest, verifyToken, isAdminOrOfficeHolder } from "@/lib/auth";
import { changeRequestSchema } from "@/lib/validations";
import { createAuditLog } from "@/lib/approval-utils";
import { logError } from "@/lib/error-logger";

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
    const staffId = searchParams.get("staffId");
    const status = searchParams.get("status");
    const type = searchParams.get("type");

    let whereConditions: any[] = [];
    // STAFF can only see their own change requests
    if (user.role === "STAFF") {
      whereConditions.push(eq(changeRequests.staffId, user.id));
    } else if (staffId) {
      whereConditions.push(eq(changeRequests.staffId, staffId));
    }
    if (status) whereConditions.push(eq(changeRequests.status, status as any));
    if (type) whereConditions.push(eq(changeRequests.type, type as any));

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const requests = await db.query.changeRequests.findMany({
      where: whereClause,
      with: {
        staff: true,
        changeReason: true,
      },
      orderBy: [desc(changeRequests.createdAt)],
    });

    return NextResponse.json(requests);
  } catch (error) {
    const token = getTokenFromRequest(request);
    const user = token ? verifyToken(token) : null;
    await logError({
      source: "api/change-requests",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      request,
      userId: user?.id,
      userRole: user?.role,
    });
    return NextResponse.json(
      { error: "Couldn't load change requests. Please try again." },
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
    if (!user || !isAdminOrOfficeHolder(user)) {
      return NextResponse.json({ error: "Only employees with ADMIN user role can create change requests." }, { status: 403 });
    }

    const body = await request.json();
    const parsed = changeRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }
    const {
      staffId,
      type,
      changes,
      reason,
      reasonId,
      selectedFields,
      supportingDocumentUrl,
    } = parsed.data;

    // Validate reason if reasonId provided
    if (reasonId) {
      const changeReason = await db.query.changeReasons.findFirst({
        where: eq(changeReasons.id, reasonId),
      });
      if (!changeReason) {
        return NextResponse.json({ error: "Invalid reason" }, { status: 400 });
      }
      if (changeReason.requiresDocument && !supportingDocumentUrl) {
        return NextResponse.json(
          { error: "Supporting document required for this reason" },
          { status: 400 }
        );
      }
    }

    const staffMember = await db.query.staff.findFirst({
      where: eq(staff.id, staffId),
    });
    if (!staffMember) {
      return NextResponse.json({ error: "The item you're looking for couldn't be found." }, { status: 404 });
    }

    const id = crypto.randomUUID();
    const createdAt = new Date();

    await db.insert(changeRequests).values({
      id,
      staffId,
      type: type || "DATA",
      requestedBy: user.id,
      changes,
      oldValues: null,
      reason,
      status: "ADMIN_APPROVED",
      selectedFields: selectedFields || null,
      reasonId: reasonId || null,
      supportingDocumentUrl: supportingDocumentUrl || null,
      adminNote: null,
      adminApprovedBy: user.id,
      adminApprovedByName: user.name,
      adminApprovedAt: createdAt,
      isAdminCorrectable: true,
      correctionWindowExpiresAt: new Date(createdAt.getTime() + 24 * 60 * 60 * 1000),
    });

    const currentUser = await db.query.staff.findFirst({
      where: eq(staff.id, user.id),
    });
    const creatorName = currentUser?.name || user.name;

    await createAuditLog(
      "CHANGE_REQUEST_CREATED",
      { userId: user.id, userFullName: creatorName, userRole: user.role as any, rank: user.role },
      { changeRequestId: id, status: "ADMIN_APPROVED", reason, selectedFields },
      id,
      staffId
    );

    const newRequest = await db.query.changeRequests.findFirst({
      where: eq(changeRequests.id, id),
      with: { staff: true, changeReason: true },
    });

    return NextResponse.json(newRequest, { status: 201 });
  } catch (error) {
    const token = getTokenFromRequest(request);
    const user = token ? verifyToken(token) : null;
    await logError({
      source: "api/change-requests",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      request,
      userId: user?.id,
      userRole: user?.role,
    });
    return NextResponse.json(
      { error: "Couldn't submit your change request. Please try again." },
      { status: 500 }
    );
  }
}
