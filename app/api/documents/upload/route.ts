import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { uploadToS3, S3_FOLDERS, generateS3Key } from "@/lib/s3";

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: "You need to log in to access this." }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!["ADMIN", "SECRETARY", "CHAIRMAN"].includes(user.role)) {
      return NextResponse.json(
        { error: "You don't have permission to do this." },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are allowed" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const s3Key = generateS3Key(S3_FOLDERS.SUPPORTING_DOCUMENTS, file.name);
    const url = await uploadToS3(buffer, s3Key, "application/pdf");

    return NextResponse.json({ url }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Document upload failed. Please check your connection and try again." },
      { status: 500 }
    );
  }
}
