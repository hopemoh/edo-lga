import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET!;
const REFRESH_SECRET = JWT_SECRET + "_refresh";

export function generateToken(payload: any): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "15m" });
}

export function generateRefreshToken(payload: any): string {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: "30d" });
}

export function verifyToken(token: string): { id: string; role: string; lgaId?: string; name: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as any;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): { id: string; role: string; lgaId?: string; name: string } | null {
  try {
    return jwt.verify(token, REFRESH_SECRET) as any;
  } catch {
    return null;
  }
}

export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  return null;
}

export function getRefreshTokenFromRequest(request: NextRequest): string | null {
  const cookie = request.headers.get("cookie") || "";
  const match = cookie.match(/refresh_token=([^;]+)/);
  return match ? match[1] : null;
}
