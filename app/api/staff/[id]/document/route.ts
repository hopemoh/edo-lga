import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { staff, documentHistory } from "@/lib/db/schema";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import {
  uploadToS3,
  generateS3Key,
  S3_FOLDERS,
} from "@/lib/s3";
import { logError } from "@/lib/error-logger";

function generateId(): string {
  return crypto.randomUUID();
}

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

    if (!["ADMIN", "SECRETARY", "CHAIRMAN"].includes(user.role)) {
      return NextResponse.json({ error: "You don't have permission to do this." }, { status: 403 });
    }

    const staffRecord = await db.query.staff.findFirst({
      where: eq(staff.id, id),
    });

    if (!staffRecord) {
      return NextResponse.json({ error: "The item you're looking for couldn't be found." }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("document") as File | null;
    const reason = (formData.get("reason") as string) || "Document update";

    if (!file) {
      return NextResponse.json(
        { error: "No document provided" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const key = generateS3Key(S3_FOLDERS.STAFF_DOCUMENTS, file.name);
    const documentUrl = await uploadToS3(buffer, key, file.type || "application/pdf");

    await db
      .update(staff)
      .set({ documentUrl, updatedAt: new Date() })
      .where(eq(staff.id, id));

    await db.insert(documentHistory).values({
      id: generateId(),
      staffId: id,
      documentUrl,
      uploadedBy: user.id,
      reason,
    });

    return NextResponse.json({ documentUrl, message: "Document uploaded successfully" });
  } catch (error) {
    await logError({
      source: "api/staff/[id]/document",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      request,
      userId: user?.id,
      userRole: user?.role,
    });
    return NextResponse.json(
      { error: "Document upload failed. Please check your connection and try again." },
      { status: 500 }
    );
  }
}
