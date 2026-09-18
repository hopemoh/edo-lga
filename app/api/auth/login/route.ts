import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { staff, lgas } from "@/lib/db/schema";
import { generateToken, generateRefreshToken } from "@/lib/auth";
import { loginSchema } from "@/lib/validations";
import { logError } from "@/lib/error-logger";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    if (!rateLimit(`login:${ip}`, 10, 60_000)) {
      return NextResponse.json({ error: "Too many login attempts. Please try again later." }, { status: 429 });
    }

    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }
    const { phoneNumber, dateOfBirth } = parsed.data;
    const normalizedPhone = phoneNumber.replace(/^0+/, "");

    const staffRecord = await db.query.staff.findFirst({
      where: eq(staff.phoneNumber, normalizedPhone),
      with: {
        lga: true,
      },
    });

    if (!staffRecord) {
      return NextResponse.json(
        { error: "Invalid phone number" },
        { status: 401 }
      );
    }

    // Parse DB dateOfBirth safely
    const dobRaw = staffRecord.dateOfBirth;
    const dobDate = dobRaw instanceof Date ? dobRaw : new Date(String(dobRaw));
    if (isNaN(dobDate.getTime())) {
      return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
    }
    const dobY = dobDate.getUTCFullYear();
    const dobM = String(dobDate.getUTCMonth() + 1).padStart(2, "0");
    const dobD = String(dobDate.getUTCDate()).padStart(2, "0");
    const dobStr = `${dobY}-${dobM}-${dobD}`;

    // Parse provided DOB — supports YYYY-MM-DD or MM/DD/YYYY or MM/DD/YY
    let providedStr: string | null = null;
    const isoMatch = dateOfBirth.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const slashMatch = dateOfBirth.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);

    if (isoMatch) {
      const [, y, m, d] = isoMatch;
      providedStr = `${y}-${m}-${d}`;
    } else if (slashMatch) {
      let [, month, day, year] = slashMatch;
      if (year.length === 2) {
        year = (parseInt(year) > 50 ? "19" : "20") + year;
      }
      providedStr = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    } else {
      return NextResponse.json({ error: "Use YYYY-MM-DD or MM/DD/YYYY format" }, { status: 400 });
    }

    if (dobStr !== providedStr) {
      return NextResponse.json(
        { error: "Invalid date of birth" },
        { status: 401 }
      );
    }

    const token = generateToken({
      id: staffRecord.id,
      role: staffRecord.role,
      lgaId: staffRecord.lgaId,
      name: staffRecord.name,
    });

    const refreshToken = generateRefreshToken({
      id: staffRecord.id,
      role: staffRecord.role,
      lgaId: staffRecord.lgaId,
      name: staffRecord.name,
    });

    const response = NextResponse.json({
      token,
      user: {
        id: staffRecord.id,
        name: staffRecord.name,
        role: staffRecord.role,
        lgaId: staffRecord.lgaId,
        lgaName: staffRecord.lga?.name,
        phoneNumber: staffRecord.phoneNumber,
        statusId: staffRecord.statusId,
      },
      mustChangePassword: !staffRecord.hasChangedPassword,
    });

    response.cookies.set("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (error) {
    await logError({
      source: "api/auth/login",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      request,
    });
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
