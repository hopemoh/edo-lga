import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { staff, documentHistory } from "@/lib/db/schema";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { getPresignedUrl, extractS3Key } from "@/lib/s3";

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

    const { searchParams } = new URL(request.url);
    const fileParam = searchParams.get("file");

    let documentUrl: string | null = null;

    if (fileParam) {
      const historyEntry = await db.query.documentHistory.findFirst({
        where: and(
          eq(documentHistory.staffId, id),
          eq(documentHistory.id, fileParam)
        ),
      });

      if (!historyEntry) {
        return NextResponse.json(
          { error: "The item you're looking for couldn't be found." },
          { status: 404 }
        );
      }

      documentUrl = historyEntry.documentUrl;
    } else {
      const staffRecord = await db.query.staff.findFirst({
        where: eq(staff.id, id),
      });

      if (!staffRecord) {
        return NextResponse.json({ error: "The item you're looking for couldn't be found." }, { status: 404 });
      }

      documentUrl = staffRecord.documentUrl;
    }

    if (!documentUrl) {
      return NextResponse.json(
        { error: "No document available" },
        { status: 404 }
      );
    }

    const s3Key = extractS3Key(documentUrl);
    if (!s3Key) {
      return NextResponse.json(
        { error: "Invalid document URL" },
        { status: 400 }
      );
    }

    const presignedUrl = await getPresignedUrl(s3Key);

    return NextResponse.json({ url: presignedUrl });
  } catch (error) {
    return NextResponse.json(
      { error: "Couldn't load the document. Please try again." },
      { status: 500 }
    );
  }
}
