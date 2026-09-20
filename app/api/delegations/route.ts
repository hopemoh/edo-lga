import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { delegations, staff, logEntries, offices } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { logError } from "@/lib/error-logger";
import { createAuditLog, isOfficeHolder, getActiveOffice } from "@/lib/approval-utils";

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

    const active = await db.query.delegations.findFirst({
      where: and(
        eq(delegations.delegatorId, user.id),
        eq(delegations.isActive, true)
      ),
    });

    if (!active) {
      return NextResponse.json({ delegation: null });
    }

    const delegate = await db.query.staff.findFirst({
      where: eq(staff.id, active.delegateId),
    });

    return NextResponse.json({
      delegation: {
        ...active,
        delegateName: delegate?.name || "Unknown",
      },
    });
  } catch (error) {
    await logError({
      source: "api/delegations",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: "Couldn't load delegation. Please try again." },
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
    if (!user || !(await isOfficeHolder("CHAIRMAN", user.id))) {
      return NextResponse.json({ error: "Only the Chairman can delegate." }, { status: 403 });
    }

    const body = await request.json();
    const { delegateId } = body;

    if (!delegateId) {
      return NextResponse.json({ error: "Delegate ID is required." }, { status: 400 });
    }

    const delegate = await db.query.staff.findFirst({
      where: eq(staff.id, delegateId),
    });

    if (!delegate) {
      return NextResponse.json({ error: "Staff member not found." }, { status: 404 });
    }

    if (await isOfficeHolder("CHAIRMAN", delegateId)) {
      return NextResponse.json({ error: "Cannot delegate to another CHAIRMAN." }, { status: 400 });
    }

    // Revoke any existing active delegation
    const existing = await db.query.delegations.findFirst({
      where: and(
        eq(delegations.delegatorId, user.id),
        eq(delegations.isActive, true)
      ),
    });

    if (existing) {
      await db
        .update(delegations)
        .set({ isActive: false, revokedAt: new Date() })
        .where(eq(delegations.id, existing.id));
    }

    // Create new delegation
    const delegationId = crypto.randomUUID();
    const [newDelegation] = await db
      .insert(delegations)
      .values({
        id: delegationId,
        delegatorId: user.id,
        delegateId,
        isActive: true,
      })
      .returning();

    // Log to audit trail
    await createAuditLog(
      "DELEGATION_CREATED",
      { userId: user.id, userFullName: user.name, userRole: user.role as "STAFF" | "ADMIN", rank: "CHAIRMAN" },
      {
        delegationId,
        delegateId,
        delegateName: delegate.name,
        ...(existing && {
          previousDelegateId: existing.delegateId,
          replacedExisting: true,
        }),
      },
      undefined,
      delegateId
    );

    // Log to activity log
    await db.insert(logEntries).values({
      id: crypto.randomUUID(),
      action: "DELEGATION_CREATED",
      details: existing
        ? `Replaced delegate ${existing.delegateId} with ${delegate.name}`
        : `Delegated ${delegate.name} to approve on your behalf`,
      userId: user.id,
      userFullName: user.name,
      userRank: "CHAIRMAN",
      userRole: "CHAIRMAN",
    });

    return NextResponse.json({
      delegation: {
        ...newDelegation,
        delegateName: delegate.name,
      },
      message: `${delegate.name} has been delegated to approve on your behalf.`,
    });
  } catch (error) {
    await logError({
      source: "api/delegations",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      request,
    });
    return NextResponse.json(
      { error: "Couldn't create delegation. Please try again." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: "You need to log in to access this." }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user || !(await isOfficeHolder("CHAIRMAN", user.id))) {
      return NextResponse.json({ error: "Only the Chairman can revoke delegation." }, { status: 403 });
    }

    const existing = await db.query.delegations.findFirst({
      where: and(
        eq(delegations.delegatorId, user.id),
        eq(delegations.isActive, true)
      ),
    });

    if (!existing) {
      return NextResponse.json({ error: "No active delegation found." }, { status: 404 });
    }

    await db
      .update(delegations)
      .set({ isActive: false, revokedAt: new Date() })
      .where(eq(delegations.id, existing.id));

    // Look up delegate name for audit
    const revokedDelegate = await db.query.staff.findFirst({
      where: eq(staff.id, existing.delegateId),
    });

    await createAuditLog(
      "DELEGATION_REVOKED",
      { userId: user.id, userFullName: user.name, userRole: user.role as "STAFF" | "ADMIN", rank: "CHAIRMAN" },
      {
        delegationId: existing.id,
        delegateId: existing.delegateId,
        delegateName: revokedDelegate?.name || "Unknown",
      },
      undefined,
      existing.delegateId
    );

    // Log to activity log
    await db.insert(logEntries).values({
      id: crypto.randomUUID(),
      action: "DELEGATION_REVOKED",
      details: `Revoked ${revokedDelegate?.name || "Unknown"}'s delegation`,
      userId: user.id,
      userFullName: user.name,
      userRank: "CHAIRMAN",
      userRole: "CHAIRMAN",
    });

    return NextResponse.json({ success: true, message: "Delegation revoked." });
  } catch (error) {
    await logError({
      source: "api/delegations",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      request,
    });
    return NextResponse.json(
      { error: "Couldn't revoke delegation. Please try again." },
      { status: 500 }
    );
  }
}
