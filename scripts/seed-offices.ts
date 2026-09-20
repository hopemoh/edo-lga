import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL not found in .env.local");
  process.exit(1);
}

const sql = neon(databaseUrl);

function generateId(): string {
  return crypto.randomUUID();
}

async function seed() {
  console.log("=== Seeding Offices ===\n");

  // Step 1: Find the admin user
  console.log("Step 1: Finding admin user (phone 08123456789)...");
  const adminUsers = await sql`SELECT id, "serialNumber", name, "lgaId" FROM staff WHERE "phoneNumber" = '08123456789' LIMIT 1`;
  if (adminUsers.length === 0) {
    console.error("Admin user not found!");
    process.exit(1);
  }
  const admin = adminUsers[0];
  console.log(`  Found admin: ${admin.name} (${admin.id})`);

  // Step 2: Find existing statuses and LGAs
  console.log("\nStep 2: Finding existing statuses and LGAs...");
  const statuses = await sql`SELECT id FROM statuses LIMIT 1`;
  if (statuses.length === 0) {
    console.error("No statuses found! Run seed.ts first.");
    process.exit(1);
  }
  const statusId = statuses[0].id;

  const lgas = await sql`SELECT id FROM lgas LIMIT 1`;
  if (lgas.length === 0) {
    console.error("No LGAs found! Run seed.ts first.");
    process.exit(1);
  }
  const lgaId = lgas[0].id;

  // Step 3: Create CHAIRMAN office with minimal external staff record
  console.log("\nStep 3: Creating CHAIRMAN office...");
  const existingChairmanOffice = await sql`SELECT id FROM offices WHERE name = 'CHAIRMAN' AND is_active = true LIMIT 1`;

  if (existingChairmanOffice.length === 0) {
    const chairmanStaffId = generateId();
    const maxSerialResult = await sql`SELECT COALESCE(MAX("serialNumber"), 0) as max FROM staff`;
    const nextSerial = (maxSerialResult[0]?.max || 0) + 1;

    // Create a minimal external staff record for the chairman
    await sql`
      INSERT INTO staff (id, "lgaId", "serialNumber", name, sex, "statusId", role, sgl, "dateOfBirth", "dateOfFirstAppt", "phoneNumber", is_external)
      VALUES (${chairmanStaffId}, ${lgaId}, ${nextSerial}, 'Chairman', 'Other', ${statusId}, 'STAFF', 0, '1970-01-01', '2000-01-01', '+CHAIRMAN-' || ${chairmanStaffId}, true)
    `;
    console.log(`  Created external staff record for Chairman: ${chairmanStaffId}`);

    // Create the CHAIRMAN office
    const chairmanOfficeId = generateId();
    await sql`
      INSERT INTO offices (id, name, staff_id, is_active)
      VALUES (${chairmanOfficeId}, 'CHAIRMAN', ${chairmanStaffId}, true)
    `;
    console.log(`  Created CHAIRMAN office: ${chairmanOfficeId}`);
  } else {
    console.log("  CHAIRMAN office already exists, skipping.");
  }

  // Step 4: Create SECRETARY office linked to an existing staff member
  console.log("\nStep 4: Creating SECRETARY office...");
  const existingSecretaryOffice = await sql`SELECT id FROM offices WHERE name = 'SECRETARY' AND is_active = true LIMIT 1`;

  if (existingSecretaryOffice.length === 0) {
    // Find a non-external staff member to link (prefer admin, then any)
    const candidateStaff = await sql`
      SELECT id, name, "serialNumber" FROM staff
      WHERE is_external = false AND id != ${admin.id}
      ORDER BY "createdAt" ASC
      LIMIT 1
    `;

    if (candidateStaff.length > 0) {
      const secretaryStaffId = candidateStaff[0].id;
      const secretaryOfficeId = generateId();
      await sql`
        INSERT INTO offices (id, name, staff_id, is_active)
        VALUES (${secretaryOfficeId}, 'SECRETARY', ${secretaryStaffId}, true)
      `;
      console.log(`  Created SECRETARY office linked to: ${candidateStaff[0].name} (${secretaryStaffId})`);
    } else {
      // Create a minimal external staff record for secretary as fallback
      const secretaryStaffId = generateId();
      const maxSerialResult = await sql`SELECT COALESCE(MAX("serialNumber"), 0) as max FROM staff`;
      const nextSerial = (maxSerialResult[0]?.max || 0) + 1;

      await sql`
        INSERT INTO staff (id, "lgaId", "serialNumber", name, sex, "statusId", role, sgl, "dateOfBirth", "dateOfFirstAppt", "phoneNumber", is_external)
        VALUES (${secretaryStaffId}, ${lgaId}, ${nextSerial}, 'Secretary', 'Other', ${statusId}, 'STAFF', 0, '1970-01-01', '2000-01-01', '+SECRETARY-' || ${secretaryStaffId}, true)
      `;
      console.log(`  Created external staff record for Secretary: ${secretaryStaffId}`);

      const secretaryOfficeId = generateId();
      await sql`
        INSERT INTO offices (id, name, staff_id, is_active)
        VALUES (${secretaryOfficeId}, 'SECRETARY', ${secretaryStaffId}, true)
      `;
      console.log(`  Created SECRETARY office: ${secretaryOfficeId}`);
    }
  } else {
    console.log("  SECRETARY office already exists, skipping.");
  }

  // Step 5: Verify
  console.log("\nStep 5: Verifying...");
  const offices = await sql`SELECT id, name, staff_id, is_active FROM offices WHERE is_active = true`;
  console.log("Active offices:");
  for (const o of offices) {
    console.log(`  ${o.name}: staff_id=${o.staff_id}, active=${o.is_active}`);
  }

  console.log("\n=== Seed Complete ===");
}

seed().catch(console.error);
