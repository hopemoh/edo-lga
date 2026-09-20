import { NextRequest, NextResponse } from "next/server";
import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  staff,
  staffRanks,
  staffQualifications,
  logEntries,
} from "@/lib/db/schema";
import { getTokenFromRequest, verifyToken, isAdminOrOfficeHolder } from "@/lib/auth";
import { parseExcelFile, parsePDFFile } from "@/lib/file-parser";
import { logError } from "@/lib/error-logger";

function generateId(): string {
  return crypto.randomUUID();
}

async function findOrCreateRank(rankName: string): Promise<string | null> {
  if (!rankName || rankName.trim() === "") return null;

  const { ranks } = await import("@/lib/db/schema");

  const existing = await db.query.ranks.findFirst({
    where: eq(ranks.name, rankName.trim()),
  });

  if (existing) return existing.id;

  const newRank = await db
    .insert(ranks)
    .values({ id: generateId(), name: rankName.trim() })
    .returning();
  return newRank[0].id;
}

async function findOrCreateQualification(qualName: string): Promise<string | null> {
  if (!qualName || qualName.trim() === "") return null;

  const { qualifications } = await import("@/lib/db/schema");

  const existing = await db.query.qualifications.findFirst({
    where: eq(qualifications.name, qualName.trim()),
  });

  if (existing) return existing.id;

  const newQual = await db
    .insert(qualifications)
    .values({ id: generateId(), name: qualName.trim() })
    .returning();
  return newQual[0].id;
}

async function findOrCreateStatus(statusName: string): Promise<string> {
  const { statuses } = await import("@/lib/db/schema");

  const existing = await db.query.statuses.findFirst({
    where: eq(statuses.name, statusName.trim()),
  });

  if (existing) return existing.id;

  const newStatus = await db
    .insert(statuses)
    .values({ id: generateId(), name: statusName.trim() })
    .returning();
  return newStatus[0].id;
}

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: "You need to log in to access this." }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: "You need to log in to access this." }, { status: 401 });
    }

    if (!isAdminOrOfficeHolder(user)) {
      return NextResponse.json({ error: "You don't have permission to do this." }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const lgaId = formData.get("lgaId") as string;

    if (!file || !lgaId) {
      return NextResponse.json(
        { error: "File and lgaId are required" },
        { status: 400 }
      );
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (data: any) => {
          controller.enqueue(encoder.encode(JSON.stringify(data) + "\n"));
        };

        try {
          let parsedData;
          const fileName = file.name.toLowerCase();

          if (file.size > 10 * 1024 * 1024) {
            sendEvent({ type: "error", message: "File size must be less than 10MB" });
            controller.close();
            return;
          }

          if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
            parsedData = await parseExcelFile(file, lgaId);
          } else if (fileName.endsWith(".pdf")) {
            parsedData = await parsePDFFile(file, lgaId);
          } else {
            sendEvent({ type: "error", message: "Unsupported file format" });
            controller.close();
            return;
          }

          sendEvent({
            type: "total",
            count: parsedData.length,
            message: `Found ${parsedData.length} staff records to import`,
          });

          let imported = 0;
          let failed = 0;
          const maxSerial = await db
            .select({ max: sql<number>`coalesce(max(${staff.serialNumber}), 0)` })
            .from(staff);

          let nextSerial = (maxSerial[0]?.max || 0) + 1;

          for (let i = 0; i < parsedData.length; i++) {
            const data = parsedData[i];

            try {
              if (!data.name || data.name.trim() === "") {
                sendEvent({
                  type: "skip",
                  index: i + 1,
                  name: data.name || "Unknown",
                  reason: "Missing name",
                });
                failed++;
                continue;
              }

              const statusId = data.status
                ? await findOrCreateStatus(data.status)
                : await findOrCreateStatus("ACTIVE");

              const staffId = generateId();

              await db.insert(staff).values({
                id: staffId,
                lgaId,
                serialNumber: nextSerial++,
                name: data.name.trim(),
                sex: data.sex || "M",
                statusId,
                sgl: data.sgl || 0,
                dateOfBirth: data.dateOfBirth
                  ? new Date(data.dateOfBirth)
                  : new Date("1990-01-01"),
                dateOfFirstAppt: data.dateOfFirstAppt
                  ? new Date(data.dateOfFirstAppt)
                  : new Date("2010-01-01"),
                dateOfConf: data.dateOfConf ? new Date(data.dateOfConf) : null,
                dateOfPresentAppt: data.dateOfPresentAppt
                  ? new Date(data.dateOfPresentAppt)
                  : null,
                phoneNumber: data.phoneNumber || "",
                recommendedRetirementDate: data.recommendedRetirementDate
                  ? new Date(data.recommendedRetirementDate)
                  : null,
                remark: data.remark,
              });

              if (data.rank) {
                const rankId = await findOrCreateRank(data.rank);
                if (rankId) {
                  await db.insert(staffRanks).values({
                    id: generateId(),
                    staffId,
                    rankId,
                  });
                }
              }

              if (data.qualification && data.qualification.trim() !== "") {
                const quals = data.qualification.split(",").map((q: string) => q.trim());
                for (const qual of quals) {
                  if (qual) {
                    const qualId = await findOrCreateQualification(qual);
                    if (qualId) {
                      await db.insert(staffQualifications).values({
                        id: generateId(),
                        staffId,
                        qualificationId: qualId,
                      });
                    }
                  }
                }
              }

              imported++;

              sendEvent({
                type: "progress",
                current: i + 1,
                total: parsedData.length,
                name: data.name,
                status: "success",
              });
            } catch (err: any) {
              await logError({
                source: "api/staff/bulk",
                message: err instanceof Error ? err.message : "Unknown error",
                stack: err instanceof Error ? err.stack : undefined,
                request,
                userId: user?.id,
                userRole: user?.role,
              });
              failed++;
              sendEvent({
                type: "progress",
                current: i + 1,
                total: parsedData.length,
                name: data.name,
                status: "error",
                error: err.message,
              });
            }
          }

          await db.insert(logEntries).values({
            id: generateId(),
            action: "CREATE",
            details: `Bulk import: ${imported} staff records imported, ${failed} failed`,
            userId: user.id,
            userFullName: user.name,
            userRank: "",
            userRole: (user.role ?? "STAFF") as "STAFF" | "ADMIN",
          });

          sendEvent({
            type: "complete",
            imported,
            failed,
            total: parsedData.length,
            message: `Import complete: ${imported} successful, ${failed} failed`,
          });

          controller.close();
        } catch (error: any) {
          await logError({
            source: "api/staff/bulk",
            message: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
            request,
            userId: user?.id,
            userRole: user?.role,
          });
          sendEvent({ type: "error", message: error.message || "Import failed" });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    const token = getTokenFromRequest(request);
    const user = token ? verifyToken(token) : null;
    await logError({
      source: "api/staff/bulk",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      request,
      userId: user?.id,
      userRole: user?.role,
    });
    return NextResponse.json(
      { error: "Something went wrong while saving. Please try again." },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: "You need to log in to access this." }, { status: 401 });
    }
    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: "You need to log in to access this." }, { status: 401 });
    }
    if (!isAdminOrOfficeHolder(user)) {
      return NextResponse.json({ error: "You don't have permission to do this." }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const lgaId = formData.get("lgaId") as string;

    if (!file || !lgaId) {
      return NextResponse.json({ error: "File and lgaId are required" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 10MB" }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xls")) {
      return NextResponse.json({ error: "Only Excel files (.xlsx, .xls) are supported for bulk update" }, { status: 400 });
    }

    const { parseBulkUpdateExcel } = await import("@/lib/file-parser");
    const parsedData = await parseBulkUpdateExcel(file);

    if (parsedData.length === 0) {
      return NextResponse.json({ error: "No valid staff records found in the file. Ensure the 'Name' column is present." }, { status: 400 });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (data: any) => {
          controller.enqueue(encoder.encode(JSON.stringify(data) + "\n"));
        };

        try {
          sendEvent({
            type: "total",
            count: parsedData.length,
            message: `Found ${parsedData.length} staff records to update`,
          });

          const existingStaff = await db.query.staff.findMany({
            where: eq(staff.lgaId, lgaId),
            with: {
              ranks: { with: { rank: true } },
              qualifications: { with: { qualification: true } },
            },
          });

          const staffByName = new Map<string, typeof existingStaff[number]>();
          for (const s of existingStaff) {
            staffByName.set(s.name.toLowerCase().trim(), s);
          }

          let updated = 0;
          let notFound = 0;
          let failed = 0;

          for (let i = 0; i < parsedData.length; i++) {
            const row = parsedData[i];
            const normalizedName = row.name.toLowerCase().trim();

            try {
              const existing = staffByName.get(normalizedName);
              if (!existing) {
                notFound++;
                sendEvent({
                  type: "progress",
                  current: i + 1,
                  total: parsedData.length,
                  name: row.name,
                  status: "not_found",
                });
                continue;
              }

              const updateData: Record<string, any> = { updatedAt: new Date() };

              if (row.sex && ["M", "F"].includes(row.sex)) {
                updateData.sex = row.sex;
              }
              if (row.phoneNumber) {
                updateData.phoneNumber = row.phoneNumber;
              }
              if (row.sgl !== undefined && !isNaN(row.sgl)) {
                updateData.sgl = row.sgl;
              }
              if (row.remark !== undefined) {
                updateData.remark = row.remark;
              }

              if (row.status) {
                const statusId = await findOrCreateStatus(row.status);
                updateData.statusId = statusId;
              }

              if (Object.keys(updateData).length > 1) {
                await db
                  .update(staff)
                  .set(updateData)
                  .where(eq(staff.id, existing.id));
              }

              if (row.rank) {
                const rankId = await findOrCreateRank(row.rank);
                if (rankId) {
                  const existingRank = await db.query.staffRanks.findFirst({
                    where: eq(staffRanks.staffId, existing.id),
                  });
                  if (existingRank) {
                    await db
                      .update(staffRanks)
                      .set({ rankId })
                      .where(eq(staffRanks.id, existingRank.id));
                  } else {
                    await db.insert(staffRanks).values({
                      id: generateId(),
                      staffId: existing.id,
                      rankId,
                    });
                  }
                }
              }

              if (row.qualification) {
                const quals = row.qualification.split(",").map((q: string) => q.trim());
                for (const qual of quals) {
                  if (qual) {
                    const qualId = await findOrCreateQualification(qual);
                    if (qualId) {
                      const existingQual = await db.query.staffQualifications.findFirst({
                        where: and(
                          eq(staffQualifications.staffId, existing.id),
                          eq(staffQualifications.qualificationId, qualId)
                        ),
                      });
                      if (!existingQual) {
                        await db.insert(staffQualifications).values({
                          id: generateId(),
                          staffId: existing.id,
                          qualificationId: qualId,
                        });
                      }
                    }
                  }
                }
              }

              updated++;
              sendEvent({
                type: "progress",
                current: i + 1,
                total: parsedData.length,
                name: row.name,
                status: "success",
              });
            } catch (err: any) {
              failed++;
              sendEvent({
                type: "progress",
                current: i + 1,
                total: parsedData.length,
                name: row.name,
                status: "error",
                error: err.message,
              });
            }
          }

          await db.insert(logEntries).values({
            id: generateId(),
            action: "UPDATE",
            details: `Bulk update: ${updated} staff records updated, ${notFound} not found, ${failed} failed`,
            userId: user!.id,
            userFullName: user!.name,
            userRank: "",
            userRole: (user!.role ?? "STAFF") as "STAFF" | "ADMIN",
          });

          sendEvent({
            type: "complete",
            updated,
            notFound,
            failed,
            total: parsedData.length,
            message: `Update complete: ${updated} updated, ${notFound} not found, ${failed} failed`,
          });

          controller.close();
        } catch (error: any) {
          sendEvent({ type: "error", message: error.message || "Update failed" });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    const token = getTokenFromRequest(request);
    const user = token ? verifyToken(token) : null;
    await logError({
      source: "api/staff/bulk",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      request,
      userId: user?.id,
      userRole: user?.role,
    });
    return NextResponse.json(
      { error: "Something went wrong while updating. Please try again." },
      { status: 500 }
    );
  }
}
