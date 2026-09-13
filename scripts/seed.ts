import { db } from "../lib/db";
import {
  lgas,
  lgaDetails,
  statuses,
  changeReasons,
  staff,
} from "../lib/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Seeding database...\n");

  // Create LGAs with Details
  const lgaData = [
    { id: "akoko-edo", name: "Akoko-Edo", zone: "Northern", x: 200, y: 120 },
    { id: "owan-west", name: "Owan West", zone: "Northern", x: 320, y: 140 },
    { id: "owan-east", name: "Owan East", zone: "Northern", x: 440, y: 130 },
    { id: "etsako-west", name: "Etsako West", zone: "Northern", x: 280, y: 200 },
    { id: "etsako-central", name: "Etsako Central", zone: "Northern", x: 380, y: 200 },
    { id: "etsako-east", name: "Etsako East", zone: "Northern", x: 500, y: 160 },
    { id: "esan-north-east", name: "Esan North-East", zone: "Central", x: 550, y: 220 },
    { id: "esan-central", name: "Esan Central", zone: "Central", x: 520, y: 280 },
    { id: "esan-west", name: "Esan West", zone: "Central", x: 450, y: 300 },
    { id: "esan-south-east", name: "Esan South-East", zone: "Central", x: 580, y: 340 },
    { id: "uhunmwonde", name: "Uhunmwonde", zone: "Southern", x: 380, y: 380 },
    { id: "igueben", name: "Igueben", zone: "Central", x: 480, y: 360 },
    { id: "oredo", name: "Oredo", zone: "Southern", x: 380, y: 380 },
    { id: "egor", name: "Egor", zone: "Southern", x: 400, y: 360 },
    { id: "ikpoba-okha", name: "Ikpoba-Okha", zone: "Southern", x: 420, y: 400 },
    { id: "orhionmwon", name: "Orhionmwon", zone: "Southern", x: 480, y: 440 },
    { id: "ovia-north-east", name: "Ovia North-East", zone: "Southern", x: 580, y: 420 },
    { id: "ovia-south-west", name: "Ovia South-West", zone: "Southern", x: 480, y: 480 },
  ];

  for (const lga of lgaData) {
    const existing = await db.query.lgas.findFirst({
      where: eq(lgas.id, lga.id),
    });

    if (!existing) {
      await db.insert(lgas).values({
        id: lga.id,
        name: lga.name,
        zone: lga.zone,
      });

      await db.insert(lgaDetails).values({
        id: crypto.randomUUID(),
        lgaId: lga.id,
        description: `${lga.name} is a Local Government Area in Edo State, Nigeria.`,
        landmarks: ["Local Government Secretariat", "Community Market"],
        activities: ["Agriculture", "Trade", "Crafts"],
        mapX: lga.x,
        mapY: lga.y,
      });

      console.log(`  Created LGA: ${lga.name}`);
    }
  }

  // Create Statuses
  const statusNames = [
    "HOD",
    "OFFICER",
    "EXECUTIVE",
    "DAGS",
    "SECRETARY",
    "CLERICAL STAFF",
    "DRIVER",
    "MESSENGER",
    "CLEANER",
    "WATCHMAN",
    "HOLGA",
    "AGRIC",
    "ENVIRONMENT TECHNICIAL",
    "ASSISTANT",
  ];

  for (const name of statusNames) {
    const existing = await db.query.statuses.findFirst({
      where: eq(statuses.name, name),
    });
    if (!existing) {
      await db.insert(statuses).values({ id: crypto.randomUUID(), name });
      console.log(`  Created Status: ${name}`);
    }
  }

  // Create Change Reasons
  const reasons = [
    { name: "Mistake during staff creation", requiresDocument: false },
    { name: "Change of name", requiresDocument: true },
    { name: "Change of date of birth", requiresDocument: true },
    { name: "Correction of phone number", requiresDocument: false },
    { name: "Rank adjustment", requiresDocument: true },
    { name: "Status change", requiresDocument: true },
    { name: "Correction of appointment dates", requiresDocument: false },
    { name: "Update retirement date", requiresDocument: true },
    { name: "Change of marital status", requiresDocument: true },
    { name: "Correction of SGL", requiresDocument: false },
    { name: "Update contact information", requiresDocument: false },
    { name: "Disciplinary action update", requiresDocument: true },
  ];

  for (const reason of reasons) {
    const existing = await db.query.changeReasons.findFirst({
      where: eq(changeReasons.name, reason.name),
    });
    if (!existing) {
      await db.insert(changeReasons).values({
        id: crypto.randomUUID(),
        name: reason.name,
        requiresDocument: reason.requiresDocument,
        isActive: true,
      });
      console.log(`  Created Change Reason: ${reason.name}`);
    }
  }

  // Create Admin User
  const adminStatus = await db.query.statuses.findFirst({
    where: eq(statuses.name, "HOD"),
  });

  if (adminStatus) {
    const existingAdmin = await db.query.staff.findFirst({
      where: eq(staff.phoneNumber, "08123456789"),
    });

    if (!existingAdmin) {
      await db.insert(staff).values({
        id: crypto.randomUUID(),
        lgaId: "akoko-edo",
        serialNumber: 1,
        name: "Real Admin",
        sex: "M",
        statusId: adminStatus.id,
        role: "ADMIN",
        sgl: 17,
        dateOfBirth: new Date("1980-03-03"),
        dateOfFirstAppt: new Date("2020-01-01"),
        dateOfConf: new Date("2022-01-01"),
        dateOfPresentAppt: new Date("2023-01-01"),
        phoneNumber: "08123456789",
        recommendedRetirementDate: new Date("2045-01-01"),
        remark: "Real Admin User",
      });
      console.log("  Created Admin user");
    }
  }

  console.log("\nSeed completed!");
  console.log("\nAdmin Login Credentials:");
  console.log("  Phone: 08123456789");
  console.log("  DOB:   1980-03-03");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  });
