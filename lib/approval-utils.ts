import { db } from "./db";
import { changeRequests, approvalLogs, auditLogs, delegations, staff, offices } from "./db/schema";
import { eq, and } from "drizzle-orm";

const ADMIN_CORRECTION_WINDOW_HOURS = 24;

export interface ApprovalContext {
  userId: string;
  userFullName: string;
  userRole: "STAFF" | "ADMIN" | "CHAIRMAN" | "SECRETARY";
  rank: string;
}

export interface DelegationInfo {
  isDelegate: boolean;
  delegatorId?: string;
  delegatorName?: string;
}

export async function getActiveOffice(officeName: "CHAIRMAN" | "SECRETARY") {
  return db.query.offices.findFirst({
    where: and(
      eq(offices.name, officeName),
      eq(offices.isActive, true)
    ),
    with: {
      staff: true,
    },
  });
}

export async function getActiveOfficeForStaff(staffId: string): Promise<"CHAIRMAN" | "SECRETARY" | null> {
  const office = await db.query.offices.findFirst({
    where: and(
      eq(offices.staffId, staffId),
      eq(offices.isActive, true)
    ),
  });
  return office?.name ?? null;
}

export async function isOfficeHolder(officeName: "CHAIRMAN" | "SECRETARY", staffId: string): Promise<boolean> {
  const office = await db.query.offices.findFirst({
    where: and(
      eq(offices.name, officeName),
      eq(offices.staffId, staffId),
      eq(offices.isActive, true)
    ),
  });
  return !!office;
}

export async function hasElevatedAccess(userId: string): Promise<boolean> {
  const user = await db.query.staff.findFirst({
    where: eq(staff.id, userId),
  });
  if (!user) return false;
  return ["ADMIN", "CHAIRMAN", "SECRETARY"].includes(user.role);
}

export async function getChairmanApprovalInfo(userId: string): Promise<{ officeId: string; name: string } | null> {
  const office = await getActiveOffice("CHAIRMAN");
  if (!office) return null;
  return { officeId: office.id, name: office.staff?.name || "Chairman" };
}

export async function getDelegationInfo(userId: string): Promise<DelegationInfo> {
  const active = await db.query.delegations.findFirst({
    where: and(
      eq(delegations.delegateId, userId),
      eq(delegations.isActive, true)
    ),
  });

  if (!active) {
    return { isDelegate: false };
  }

  // Look up delegator — could be a staff member or CHAIRMAN (external)
  const delegator = await db.query.staff.findFirst({
    where: eq(staff.id, active.delegatorId),
  });

  // If delegator not found in staff, check if they're the CHAIRMAN office holder
  let delegatorName = delegator?.name;
  if (!delegatorName) {
    const chairmanOffice = await getActiveOffice("CHAIRMAN");
    if (chairmanOffice && chairmanOffice.staffId === active.delegatorId) {
      delegatorName = chairmanOffice.staff?.name || "Chairman";
    }
  }

  return {
    isDelegate: true,
    delegatorId: active.delegatorId,
    delegatorName,
  };
}

export function isChairmanDelegate(delegationInfo: DelegationInfo): boolean {
  return delegationInfo.isDelegate;
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
  userRole: string,
  officeName?: string | null,
  delegationInfo?: DelegationInfo
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

  // Determine effective role: office holders get their office-level permissions
  let effectiveRole = userRole;
  if (officeName) {
    effectiveRole = officeName;
  }

  // Check if user is a CHAIRMAN delegate (inherits CHAIRMAN permissions)
  if (delegationInfo?.isDelegate && effectiveRole !== "CHAIRMAN" && allowedRoles.includes("CHAIRMAN")) {
    effectiveRole = "CHAIRMAN";
  }

  if (!allowedRoles.includes(effectiveRole)) {
    return {
      valid: false,
      reason: `${userRole}${officeName ? ` (${officeName} office)` : ""} cannot approve at this stage. Required: ${allowedRoles.join(", ")}`,
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
    id: crypto.randomUUID(),
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
    id: crypto.randomUUID(),
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
