import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { changeRequests, staff, changeReasons } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: "You need to log in to access this." }, { status: 401 });
    }

    const user = verifyToken(token);
    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get("staffId");
    const status = searchParams.get("status");
    const type = searchParams.get("type");

    let whereConditions: any[] = [];
    if (staffId) whereConditions.push(eq(changeRequests.staffId, staffId));
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
    if (!["ADMIN", "SECRETARY", "CHAIRMAN"].includes(user.role)) {
      return NextResponse.json({ error: "You don't have permission to do this." }, { status: 403 });
    }

    const body = await request.json();
    const {
      staffId,
      type,
      changes,
      oldValues,
      reason,
      reasonId,
      selectedFields,
      supportingDocumentUrl,
      adminNote,
    } = body;

    if (!staffId || !changes || !reason) {
      return NextResponse.json(
        { error: "staffId, changes, and reason are required" },
        { status: 400 }
      );
    }

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
      oldValues: oldValues || null,
      reason,
      status: "ADMIN_APPROVED",
      selectedFields: selectedFields || null,
      reasonId: reasonId || null,
      supportingDocumentUrl: supportingDocumentUrl || null,
      adminNote: adminNote || null,
      adminApprovedBy: user.id,
      adminApprovedAt: createdAt,
      isAdminCorrectable: true,
      correctionWindowExpiresAt: new Date(createdAt.getTime() + 24 * 60 * 60 * 1000),
    });

    const newRequest = await db.query.changeRequests.findFirst({
      where: eq(changeRequests.id, id),
      with: { staff: true, changeReason: true },
    });

    return NextResponse.json(newRequest, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Couldn't submit your change request. Please try again." },
      { status: 500 }
    );
  }
}
