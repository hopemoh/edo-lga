import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL!);

async function deepCheck() {
  // Check all tables and their columns for any references to old enum values
  const defaults = await sql`
    SELECT table_name, column_name, column_default
    FROM information_schema.columns
    WHERE column_default LIKE '%SECRETARY%' OR column_default LIKE '%CHAIRMAN%'
  `;
  console.log("Columns with SECRETARY/CHAIRMAN defaults:", defaults);

  // Check for any constraints
  const constraints = await sql`
    SELECT conname, contype, pg_get_constraintdef(oid) as def
    FROM pg_constraint
    WHERE pg_get_constraintdef(oid) LIKE '%SECRETARY%'
       OR pg_get_constraintdef(oid) LIKE '%CHAIRMAN%'
  `;
  console.log("Constraints with SECRETARY/CHAIRMAN:", constraints);

  // Check for check constraints on the role column
  const checkConstraints = await sql`
    SELECT conname, pg_get_constraintdef(oid) as def
    FROM pg_constraint
    WHERE conrelid = 'staff'::regclass AND contype = 'c'
  `;
  console.log("Check constraints on staff:", checkConstraints);

  // Check for any views or materialized views
  const views = await sql`
    SELECT table_name, view_definition
    FROM information_schema.views
    WHERE table_schema = 'public'
  `;
  console.log("Views:", views);

  // Check for any functions that reference SECRETARY
  const functions = await sql`
    SELECT routine_name, routine_definition
    FROM information_schema.routines
    WHERE routine_definition LIKE '%SECRETARY%'
      AND routine_schema = 'public'
  `;
  console.log("Functions with SECRETARY:", functions);
}

deepCheck().catch(console.error);
