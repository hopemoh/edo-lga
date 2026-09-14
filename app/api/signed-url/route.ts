import { NextRequest, NextResponse } from "next/server";
import { getPresignedUrl, extractS3Key, isS3Url } from "@/lib/s3";
import { logError } from "@/lib/error-logger";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    if (!rateLimit(`signed-url:${ip}`, 30, 60_000)) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }

    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: "You need to log in to access this." }, { status: 401 });
    }
    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: "You need to log in to access this." }, { status: 401 });
    }

    const url = request.nextUrl.searchParams.get("url");
    const directKey = request.nextUrl.searchParams.get("key");
    const download = request.nextUrl.searchParams.get("download");

    let key: string | null = null;

    if (directKey) {
      key = directKey;
    } else if (url) {
      if (!isS3Url(url)) {
        return NextResponse.json({ signedUrl: url });
      }
      key = extractS3Key(url);
    } else {
      return NextResponse.json({ error: "Missing url or key param" }, { status: 400 });
    }

    if (!key) {
      return NextResponse.json({ error: "Invalid S3 URL" }, { status: 400 });
    }

    const signedUrl = await getPresignedUrl(key, download || undefined);

    if (download) {
      return NextResponse.redirect(signedUrl);
    }

    return NextResponse.json({ signedUrl });
  } catch (error) {
    await logError({
      source: "api/signed-url",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      request,
    });
    return NextResponse.json({ error: "Couldn't generate download link. Please try again." }, { status: 500 });
  }
}
