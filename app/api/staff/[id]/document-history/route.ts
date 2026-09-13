import { NextRequest, NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { staff, documentHistory } from "@/lib/db/schema";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

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
    });

    if (!staffRecord) {
      return NextResponse.json({ error: "The item you're looking for couldn't be found." }, { status: 404 });
    }

    const history = await db.query.documentHistory.findMany({
      where: eq(documentHistory.staffId, id),
      orderBy: [desc(documentHistory.uploadedAt)],
    });

    return NextResponse.json(history);
  } catch (error) {
    return NextResponse.json(
      { error: "Couldn't load document history. Please try again." },
      { status: 500 }
    );
  }
}
