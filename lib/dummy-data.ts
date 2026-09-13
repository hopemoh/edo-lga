import type { LGA, Staff } from "./types";

export const LGAs: LGA[] = [
  { id: "akoko-edo", name: "Akoko-Edo", zone: "Northern Zone" },
  { id: "etsako-east", name: "Etsako East", zone: "Northern Zone" },
  { id: "etsako-central", name: "Etsako Central", zone: "Northern Zone" },
  { id: "etsako-west", name: "Etsako West", zone: "Northern Zone" },
  { id: "owan-east", name: "Owan East", zone: "Northern Zone" },
  { id: "owan-west", name: "Owan West", zone: "Northern Zone" },
  { id: "esan-central", name: "Esan Central", zone: "Central Zone" },
  { id: "esan-north-east", name: "Esan North-East", zone: "Central Zone" },
  { id: "esan-south-east", name: "Esan South-East", zone: "Central Zone" },
  { id: "esan-west", name: "Esan West", zone: "Central Zone" },
  { id: "igueben", name: "Igueben", zone: "Central Zone" },
  { id: "uhunmwonde", name: "Uhunmwonde", zone: "Southern Zone" },
  { id: "egor", name: "Egor", zone: "Southern Zone" },
  { id: "ikpoba-okha", name: "Ikpoba-Okha", zone: "Southern Zone" },
  { id: "oredo", name: "Oredo", zone: "Southern Zone" },
  { id: "orhionmwon", name: "Orhionmwon", zone: "Southern Zone" },
  { id: "ovia-north-east", name: "Ovia North-East", zone: "Southern Zone" },
  { id: "ovia-south-west", name: "Ovia South-West", zone: "Southern Zone" },
];

export function generateDummyStaff(lgaId: string): Staff[] {
  return []
}
