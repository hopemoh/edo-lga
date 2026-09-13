import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { changeRequests, staff } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import {
  canApproveAtLevel,
  createApprovalLog,
  createAuditLog,
  getNextStatus,
  isWithinCorrectionWindow,
  getCorrectionWindowExpiry,
} from "@/lib/approval-utils";

// POST = Approve
export async function POST(
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

    const body = await request.json().catch(() => ({}));

    const changeRequest = await db.query.changeRequests.findFirst({
      where: eq(changeRequests.id, id),
    });

    if (!changeRequest) {
      return NextResponse.json({ error: "The item you're looking for couldn't be found." }, { status: 404 });
    }

    const validation = canApproveAtLevel(changeRequest.status, user.role);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.reason }, { status: 400 });
    }

    const actionMap: Record<string, "ADMIN_APPROVE" | "SECRETARY_APPROVE" | "CHAIRMAN_APPROVE"> = {
      PENDING: "ADMIN_APPROVE",
      ADMIN_APPROVED: "SECRETARY_APPROVE",
      SECRETARY_APPROVED: "CHAIRMAN_APPROVE",
    };
    const action = actionMap[changeRequest.status];
    const nextStatus = getNextStatus(action);

    const isFinalApproval = nextStatus === "CHAIRMAN_APPROVED";

    const updateData: any = {
      status: nextStatus,
      updatedAt: new Date(),
    };

    if (user.role === "ADMIN") {
      updateData.adminApprovedBy = user.id;
      updateData.adminApprovedAt = new Date();
      updateData.adminApprovedComments = body.comments || null;
    } else if (user.role === "SECRETARY") {
      updateData.secretaryApprovedBy = user.id;
      updateData.secretaryApprovedAt = new Date();
      updateData.secretaryApprovedComments = body.comments || null;
    } else if (user.role === "CHAIRMAN") {
      updateData.chairmanApprovedBy = user.id;
      updateData.chairmanApprovedAt = new Date();
      updateData.chairmanApprovedComments = body.comments || null;
    }

    if (isFinalApproval) {
      updateData.status = "COMPLETED";
    }

    await db.update(changeRequests).set(updateData).where(eq(changeRequests.id, id));

    if (isFinalApproval) {
      const changes = changeRequest.changes as Record<string, any>;
      const staffUpdate: Record<string, any> = { updatedAt: new Date() };

      for (const [field, value] of Object.entries(changes)) {
        if (field === "qualifications") continue;
        staffUpdate[field] = value;
      }

      if (Object.keys(staffUpdate).length > 1) {
        await db.update(staff).set(staffUpdate).where(eq(staff.id, changeRequest.staffId));
      }
    }

    await createApprovalLog(id, action, {
      userId: user.id,
      userFullName: user.fullName,
      userRole: user.role,
      rank: user.role,
    }, body.comments || undefined);

    await createAuditLog(
      isFinalApproval ? "CHANGE_REQUEST_COMPLETED" : action,
      { userId: user.id, userFullName: user.fullName, userRole: user.role, rank: user.role },
      { changeRequestId: id, status: updateData.status },
      id,
      changeRequest.staffId
    );

    return NextResponse.json({ success: true, status: updateData.status });
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

// PUT = Reject
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

    const body = await request.json();
    const { reason } = body;

    if (!reason?.trim()) {
      return NextResponse.json({ error: "Please provide a rejection reason." }, { status: 400 });
    }

    const changeRequest = await db.query.changeRequests.findFirst({
      where: eq(changeRequests.id, id),
    });

    if (!changeRequest) {
      return NextResponse.json({ error: "The item you're looking for couldn't be found." }, { status: 404 });
    }

    const validation = canApproveAtLevel(changeRequest.status, user.role);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.reason }, { status: 400 });
    }

    const actionMap: Record<string, "SECRETARY_REJECT" | "CHAIRMAN_REJECT"> = {
      PENDING: "SECRETARY_REJECT",
      ADMIN_APPROVED: "SECRETARY_REJECT",
      SECRETARY_APPROVED: "CHAIRMAN_REJECT",
    };
    const action = actionMap[changeRequest.status] || "CHAIRMAN_REJECT";

    await db.update(changeRequests).set({
      status: "REJECTED",
      rejectedBy: user.id,
      rejectedAt: new Date(),
      rejectedReason: reason.trim(),
      rejectedByRole: user.role,
      updatedAt: new Date(),
    }).where(eq(changeRequests.id, id));

    await createApprovalLog(id, action, {
      userId: user.id,
      userFullName: user.fullName,
      userRole: user.role,
      rank: user.role,
    }, reason.trim());

    await createAuditLog(
      "CHANGE_REQUEST_REJECTED",
      { userId: user.id, userFullName: user.fullName, userRole: user.role, rank: user.role },
      { changeRequestId: id, reason: reason.trim() },
      id,
      changeRequest.staffId
    );

    return NextResponse.json({ success: true, status: "REJECTED" });
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

// PATCH = Correct (Admin only, within 24h)
export async function PATCH(
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

    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "You don't have permission to do this." }, { status: 403 });
    }

    const body = await request.json();
    const { changes, reason } = body;

    if (!changes || Object.keys(changes).length === 0) {
      return NextResponse.json({ error: "Please provide the corrected values." }, { status: 400 });
    }

    const changeRequest = await db.query.changeRequests.findFirst({
      where: eq(changeRequests.id, id),
    });

    if (!changeRequest) {
      return NextResponse.json({ error: "The item you're looking for couldn't be found." }, { status: 404 });
    }

    if (changeRequest.status !== "PENDING") {
      return NextResponse.json({ error: "Can only correct pending requests." }, { status: 400 });
    }

    if (!changeRequest.isAdminCorrectable) {
      return NextResponse.json({ error: "This request is not eligible for admin correction." }, { status: 400 });
    }

    if (!isWithinCorrectionWindow(changeRequest.createdAt)) {
      return NextResponse.json({ error: "The 24-hour correction window has expired. The request must go through the full approval chain." }, { status: 400 });
    }

    const oldChanges = changeRequest.changes as Record<string, any>;
    const mergedChanges = { ...oldChanges, ...changes };

    await db.update(changeRequests).set({
      changes: mergedChanges,
      status: "ADMIN_CORRECTED",
      adminApprovedBy: user.id,
      adminApprovedAt: new Date(),
      adminApprovedComments: reason || "Admin correction within 24-hour window",
      isAdminCorrectable: false,
      updatedAt: new Date(),
    }).where(eq(changeRequests.id, id));

    const staffUpdate: Record<string, any> = { updatedAt: new Date() };
    for (const [field, value] of Object.entries(mergedChanges)) {
      if (field === "qualifications") continue;
      staffUpdate[field] = value;
    }

    if (Object.keys(staffUpdate).length > 1) {
      await db.update(staff).set(staffUpdate).where(eq(staff.id, changeRequest.staffId));
    }

    await createApprovalLog(id, "ADMIN_CORRECT", {
      userId: user.id,
      userFullName: user.fullName,
      userRole: "ADMIN",
      rank: "ADMIN",
    }, reason || "Admin correction within 24-hour window");

    await createAuditLog(
      "ADMIN_CORRECTION",
      { userId: user.id, userFullName: user.fullName, userRole: "ADMIN", rank: "ADMIN" },
      { changeRequestId: id, correctedFields: Object.keys(changes), changes: mergedChanges },
      id,
      changeRequest.staffId
    );

    return NextResponse.json({ success: true, status: "ADMIN_CORRECTED" });
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
