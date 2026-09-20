import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL!);

async function fix() {
  await sql`ALTER TABLE "staff" ALTER COLUMN "lgaId" DROP NOT NULL`;
  console.log("lgaId is now nullable.");
}

fix().catch(console.error);
