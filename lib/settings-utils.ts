import { db } from "./db";
import { systemSettings } from "./db/schema";
import { eq } from "drizzle-orm";

export async function getSystemSetting(
  key: string,
  defaultValue: string
): Promise<string> {
  try {
    const setting = await db.query.systemSettings.findFirst({
      where: eq(systemSettings.key, key),
    });
    return setting ? setting.value : defaultValue;
  } catch (error) {
    return defaultValue;
  }
}

export async function getDocumentReplacementWindow(): Promise<number> {
  const value = await getSystemSetting("DOCUMENT_REPLACEMENT_WINDOW", "30");
  const minutes = parseInt(value, 10);
  return isNaN(minutes) ? 30 : minutes;
}
