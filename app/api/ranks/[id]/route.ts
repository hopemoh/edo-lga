import { NextRequest, NextResponse } from "next/server";
import { eq, count } from "drizzle-orm";
import { db } from "@/lib/db";
import { ranks, staffRanks } from "@/lib/db/schema";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: "You need to log in to access this." }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!["ADMIN", "SECRETARY", "CHAIRMAN"].includes(user.role)) {
      return NextResponse.json({ error: "You don't have permission to do this." }, { status: 403 });
    }

    const { id } = await params;

    const rank = await db.query.ranks.findFirst({
      where: eq(ranks.id, id),
    });

    if (!rank) {
      return NextResponse.json({ error: "The item you're looking for couldn't be found." }, { status: 404 });
    }

    const [{ count: usageCount }] = await db
      .select({ count: count() })
      .from(staffRanks)
      .where(eq(staffRanks.rankId, id));

    if (usageCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete rank: ${usageCount} staff member(s) are using it`,
        },
        { status: 409 }
      );
    }

    await db.delete(ranks).where(eq(ranks.id, id));

    return NextResponse.json({ message: "Rank deleted" });
  } catch (error) {
    return NextResponse.json(
      { error: "Couldn't delete the rank. Please try again." },
      { status: 500 }
    );
  }
}
