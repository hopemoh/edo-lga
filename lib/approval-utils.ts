import { db } from "./db";
import { changeRequests, approvalLogs, auditLogs } from "./db/schema";
import { eq } from "drizzle-orm";

const ADMIN_CORRECTION_WINDOW_HOURS = 24;

export interface ApprovalContext {
  userId: string;
  userFullName: string;
  userRole: "STAFF" | "ADMIN" | "SECRETARY" | "CHAIRMAN";
  rank: string;
}

export function isWithinCorrectionWindow(createdAt: Date): boolean {
  const now = new Date();
  const createdTime = new Date(createdAt);
  const diffHours =
    (now.getTime() - createdTime.getTime()) / (1000 * 60 * 60);
  return diffHours < ADMIN_CORRECTION_WINDOW_HOURS;
}

export async function validateAdminCorrection(
  changeRequestId: string,
  context: ApprovalContext
): Promise<{ valid: boolean; reason?: string }> {
  if (context.userRole !== "ADMIN") {
    return { valid: false, reason: "Only ADMIN can make corrections" };
  }

  const changeRequest = await db.query.changeRequests.findFirst({
    where: eq(changeRequests.id, changeRequestId),
  });

  if (!changeRequest) {
    return { valid: false, reason: "Change request not found" };
  }

  if (changeRequest.status !== "PENDING") {
    return { valid: false, reason: "Can only correct pending requests" };
  }

  if (!changeRequest.isAdminCorrectable) {
    return {
      valid: false,
      reason: "This request is not eligible for admin correction",
    };
  }

  if (!isWithinCorrectionWindow(changeRequest.createdAt)) {
    return {
      valid: false,
      reason: `Admin correction window expired. 24 hours from creation have passed.`,
    };
  }

  return { valid: true };
}

export function canApproveAtLevel(
  status: string,
  userRole: string
): { valid: boolean; reason?: string } {
  const validTransitions: Record<string, string[]> = {
    PENDING: ["ADMIN"],
    ADMIN_APPROVED: ["SECRETARY"],
    SECRETARY_APPROVED: ["CHAIRMAN"],
  };

  const allowedRoles = validTransitions[status];

  if (!allowedRoles) {
    return { valid: false, reason: `Invalid status: ${status}` };
  }

  if (!allowedRoles.includes(userRole)) {
    return {
      valid: false,
      reason: `${userRole} cannot approve at this stage. Required: ${allowedRoles.join(", ")}`,
    };
  }

  return { valid: true };
}

export async function createApprovalLog(
  changeRequestId: string,
  action:
    | "ADMIN_APPROVE"
    | "ADMIN_CORRECT"
    | "SECRETARY_APPROVE"
    | "SECRETARY_REJECT"
    | "CHAIRMAN_APPROVE"
    | "CHAIRMAN_REJECT",
  context: ApprovalContext,
  comments?: string
) {
  return db.insert(approvalLogs).values({
    changeRequestId,
    action,
    performedBy: context.userId,
    performedByFullName: context.userFullName,
    performedByRole: context.userRole,
    comments,
  });
}

export async function createAuditLog(
  action: string,
  context: ApprovalContext,
  details: any,
  changeRequestId?: string,
  staffId?: string
) {
  return db.insert(auditLogs).values({
    action,
    performedBy: context.userId,
    performedByFullName: context.userFullName,
    performedByRole: context.userRole,
    details: JSON.stringify(details),
    changeRequestId,
    staffId,
  });
}

export function getNextStatus(
  action:
    | "ADMIN_APPROVE"
    | "ADMIN_CORRECT"
    | "SECRETARY_APPROVE"
    | "CHAIRMAN_APPROVE"
): string {
  const statusMap: Record<string, string> = {
    ADMIN_APPROVE: "ADMIN_APPROVED",
    ADMIN_CORRECT: "ADMIN_CORRECTED",
    SECRETARY_APPROVE: "SECRETARY_APPROVED",
    CHAIRMAN_APPROVE: "CHAIRMAN_APPROVED",
  };
  return statusMap[action];
}

export function getCorrectionWindowExpiry(createdAt: Date): Date {
  const expiry = new Date(createdAt);
  expiry.setHours(expiry.getHours() + ADMIN_CORRECTION_WINDOW_HOURS);
  return expiry;
}

export function getTimeRemainingInWindow(createdAt: Date): number {
  const now = new Date();
  const createdTime = new Date(createdAt);
  const diffHours =
    (ADMIN_CORRECTION_WINDOW_HOURS * 60 * 60 * 1000 -
      (now.getTime() - createdTime.getTime())) /
    (1000 * 60 * 60);
  return Math.max(0, diffHours);
}
