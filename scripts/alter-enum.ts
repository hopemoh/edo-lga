import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL!);

async function alterEnum() {
  console.log("Altering Role enum...");

  // Check if Role_new already exists from previous attempt
  const exists = await sql`SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Role_new') as exists`;
  if (exists[0].exists) {
    console.log("Role_new already exists, cleaning up...");
    // Reset column to use old enum first if it was partially changed
    await sql`ALTER TABLE "staff" ALTER COLUMN "role" DROP DEFAULT`;
    await sql`ALTER TABLE "staff" ALTER COLUMN "role" TYPE "Role" USING "role"::text::"Role"`.catch(() => {});
    await sql`DROP TYPE IF EXISTS "Role_new" CASCADE`;
  }

  // First drop the default
  await sql`ALTER TABLE "staff" ALTER COLUMN "role" DROP DEFAULT`;

  // Create new enum type
  await sql`CREATE TYPE "Role_new" AS ENUM ('STAFF', 'ADMIN')`;

  // Update column to use new type
  await sql`ALTER TABLE "staff" ALTER COLUMN "role" TYPE "Role_new" USING "role"::text::"Role_new"`;

  // Set new default
  await sql`ALTER TABLE "staff" ALTER COLUMN "role" SET DEFAULT 'STAFF'::"Role_new"`;

  // Drop old enum type
  await sql`DROP TYPE "Role"`;

  // Rename new enum type
  await sql`ALTER TYPE "Role_new" RENAME TO "Role"`;

  console.log("Role enum updated successfully.");
}

alterEnum().catch(console.error);
