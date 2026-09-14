import { NextRequest, NextResponse } from "next/server";
import { verifyRefreshToken, generateToken, generateRefreshToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get("refresh_token")?.value;
    if (!refreshToken) {
      return NextResponse.json({ error: "No refresh token" }, { status: 401 });
    }

    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      return NextResponse.json({ error: "Invalid refresh token" }, { status: 401 });
    }

    const newToken = generateToken({
      id: payload.id,
      role: payload.role,
      lgaId: payload.lgaId,
      name: payload.name,
    });

    const newRefreshToken = generateRefreshToken({
      id: payload.id,
      role: payload.role,
      lgaId: payload.lgaId,
      name: payload.name,
    });

    const response = NextResponse.json({ token: newToken });

    response.cookies.set("refresh_token", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Refresh failed" }, { status: 500 });
  }
}
