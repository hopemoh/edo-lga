import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL!);

async function check() {
  // Check Role enum values
  const enums = await sql`
    SELECT e.enumlabel, e.enumsortorder
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'Role'
    ORDER BY e.enumsortorder
  `;
  console.log("Role enum values:", enums);

  // Check staff roles
  const roles = await sql`SELECT DISTINCT role FROM staff`;
  console.log("Staff role values:", roles);

  // Check for any columns referencing Role type
  const cols = await sql`
    SELECT table_name, column_name, udt_name
    FROM information_schema.columns
    WHERE udt_name = 'Role'
  `;
  console.log("Columns using Role type:", cols);
}

check().catch(console.error);
