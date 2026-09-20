import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL not found in .env.local");
  process.exit(1);
}

const sql = neon(databaseUrl);

async function migrate() {
  console.log("=== Office Migration ===\n");

  // Step 1: Check current role distribution
  console.log("Step 1: Checking current role distribution...");
  const roles = await sql`SELECT role, COUNT(*) as count FROM staff GROUP BY role`;
  console.log("Current roles:", roles);

  // Step 2: Update SECRETARY roles to ADMIN
  console.log("\nStep 2: Updating SECRETARY roles to ADMIN...");
  await sql`UPDATE staff SET role = 'ADMIN' WHERE role = 'SECRETARY'`;
  console.log("Done.");

  // Step 3: Update CHAIRMAN roles to ADMIN
  console.log("\nStep 3: Updating CHAIRMAN roles to ADMIN...");
  await sql`UPDATE staff SET role = 'ADMIN' WHERE role = 'CHAIRMAN'`;
  console.log("Done.");

  // Step 4: Verify
  console.log("\nStep 4: Verifying...");
  const updatedRoles = await sql`SELECT role, COUNT(*) as count FROM staff GROUP BY role`;
  console.log("Updated roles:", updatedRoles);

  console.log("\n=== Migration Complete ===");
  console.log("Now run: npx drizzle-kit push");
}

migrate().catch(console.error);
