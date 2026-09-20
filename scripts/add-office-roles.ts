import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL!);

async function updateOfficeRoles() {
  console.log("Updating staff roles for active office holders...");

  // Update CHAIRMAN office holders
  await sql`
    UPDATE "staff" SET "role" = 'CHAIRMAN'
    WHERE "id" IN (
      SELECT "staff_id" FROM "offices"
      WHERE "name" = 'CHAIRMAN' AND "is_active" = true AND "staff_id" IS NOT NULL
    )
  `;
  console.log("Updated CHAIRMAN office holders.");

  // Update SECRETARY office holders
  await sql`
    UPDATE "staff" SET "role" = 'SECRETARY'
    WHERE "id" IN (
      SELECT "staff_id" FROM "offices"
      WHERE "name" = 'SECRETARY' AND "is_active" = true AND "staff_id" IS NOT NULL
    )
  `;
  console.log("Updated SECRETARY office holders.");

  // Verify
  const roles = await sql`SELECT "role", COUNT(*) as count FROM "staff" GROUP BY "role"`;
  console.log("Final role distribution:", roles);

  console.log("Done!");
}

updateOfficeRoles().catch(console.error);
