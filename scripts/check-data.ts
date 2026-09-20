import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL!);

async function check() {
  const approvalRoles = await sql`SELECT DISTINCT "performedByRole" FROM "approval_logs"`;
  console.log("Approval logs roles:", approvalRoles);

  const auditRoles = await sql`SELECT DISTINCT "performedByRole" FROM "audit_logs"`;
  console.log("Audit logs roles:", auditRoles);

  const logRoles = await sql`SELECT DISTINCT "userRole" FROM "log_entries"`;
  console.log("Log entries roles:", logRoles);
}

check().catch(console.error);
