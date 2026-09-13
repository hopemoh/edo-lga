import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { staff, lgas } from "@/lib/db/schema";
import { generateToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, dateOfBirth } = body;

    if (!phoneNumber || !dateOfBirth) {
      return NextResponse.json(
        { error: "Phone number and date of birth are required" },
        { status: 400 }
      );
    }

    const staffRecord = await db.query.staff.findFirst({
      where: eq(staff.phoneNumber, phoneNumber),
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

    const dob = new Date(staffRecord.dateOfBirth);
    const providedDob = new Date(dateOfBirth);

    if (isNaN(dob.getTime()) || isNaN(providedDob.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 }
      );
    }

    const dobStr = dob.toISOString().split("T")[0];
    const providedStr = providedDob.toISOString().split("T")[0];

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

    return NextResponse.json({
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
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
