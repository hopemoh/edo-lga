import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { changeRequests, staff } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import {
  canApproveAtLevel,
  createAuditLog,
  getNextStatus,
  isWithinCorrectionWindow,
  getCorrectionWindowExpiry,
} from "@/lib/approval-utils";
import { approveSchema, rejectSchema, correctSchema } from "@/lib/validations";
import { logError } from "@/lib/error-logger";

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

    const currentUser = await db.query.staff.findFirst({
      where: eq(staff.id, user.id),
    });
    const approverName = currentUser?.name || user.name;

    const body = await request.json().catch(() => ({}));
    const parsed = approveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
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
      updateData.adminApprovedByName = approverName;
      updateData.adminApprovedAt = new Date();
      updateData.adminApprovedComments = parsed.data.comments || null;
    } else if (user.role === "SECRETARY") {
      updateData.secretaryApprovedBy = user.id;
      updateData.secretaryApprovedByName = approverName;
      updateData.secretaryApprovedAt = new Date();
      updateData.secretaryApprovedComments = parsed.data.comments || null;
    } else if (user.role === "CHAIRMAN") {
      updateData.chairmanApprovedBy = user.id;
      updateData.chairmanApprovedByName = approverName;
      updateData.chairmanApprovedAt = new Date();
      updateData.chairmanApprovedComments = parsed.data.comments || null;
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

    await createAuditLog(
      isFinalApproval ? "CHANGE_REQUEST_COMPLETED" : action,
      { userId: user.id, userFullName: approverName, userRole: user.role as any, rank: user.role },
      {
        changeRequestId: id,
        status: updateData.status,
        comments: parsed.data.comments || null,
        selectedFields: changeRequest.selectedFields,
        changes: changeRequest.changes,
      },
      id,
      changeRequest.staffId
    );

    return NextResponse.json({ success: true, status: updateData.status });
  } catch (error) {
    await logError({
      source: "api/change-requests/[id]/approve",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      request,
      userId: user?.id,
      userRole: user?.role,
    });
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

    const currentUser = await db.query.staff.findFirst({
      where: eq(staff.id, user.id),
    });
    const approverName = currentUser?.name || user.name;

    const body = await request.json();
    const parsed = rejectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }
    const { reason } = parsed.data;

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

    await createAuditLog(
      "CHANGE_REQUEST_REJECTED",
      { userId: user.id, userFullName: approverName, userRole: user.role as any, rank: user.role },
      { changeRequestId: id, reason: reason.trim() },
      id,
      changeRequest.staffId
    );

    return NextResponse.json({ success: true, status: "REJECTED" });
  } catch (error) {
    await logError({
      source: "api/change-requests/[id]/approve",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      request,
      userId: user?.id,
      userRole: user?.role,
    });
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

    const currentUser = await db.query.staff.findFirst({
      where: eq(staff.id, user.id),
    });
    const approverName = currentUser?.name || user.name;

    const body = await request.json();
    const parsed = correctSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }
    const { changes, reason } = parsed.data;

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

    await createAuditLog(
      "ADMIN_CORRECTION",
      { userId: user.id, userFullName: approverName, userRole: "ADMIN" as any, rank: "ADMIN" },
      { changeRequestId: id, correctedFields: Object.keys(changes), changes: mergedChanges, reason: reason || "Admin correction within 24-hour window" },
      id,
      changeRequest.staffId
    );

    return NextResponse.json({ success: true, status: "ADMIN_CORRECTED" });
  } catch (error) {
    await logError({
      source: "api/change-requests/[id]/approve",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      request,
      userId: user?.id,
      userRole: user?.role,
    });
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
