import { NextRequest, NextResponse } from "next/server";
import { getPresignedUrl, extractS3Key, isS3Url } from "@/lib/s3";

export async function GET(request: NextRequest) {
  try {
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
    return NextResponse.json({ error: "Couldn't generate download link. Please try again." }, { status: 500 });
  }
}
