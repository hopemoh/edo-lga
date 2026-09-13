import * as XLSX from "xlsx";

const parsePDF = async (buffer: Buffer) => {
  const pdf = await import("pdf-parse");
  const pdfParse = (pdf as any).default || pdf;
  return pdfParse(buffer);
};

export interface ParsedStaffData {
  name: string;
  sex: string;
  status: string;
  rank: string;
  sgl: number;
  dateOfBirth: string | null;
  dateOfFirstAppt: string | null;
  dateOfConf: string | null;
  dateOfPresentAppt: string | null;
  qualification: string;
  lgaOfOrigin: string;
  phoneNumber: string;
  recommendedRetirementDate: string | null;
  remark?: string;
}

export async function parseExcelFile(
  file: File,
  lgaId: string
): Promise<ParsedStaffData[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(worksheet);

  return data
    .filter((row: any) => !(row.__EMPTY === "S/N."))
    .map((row: any) => ({
      name: row.__EMPTY_1 || row.Name || row.name || "",
      sex: row.__EMPTY_2 || row.Sex || row.sex || "M",
      status: row.__EMPTY_3 || row.Status || row.status || "",
      rank: row.__EMPTY_4 || row.Rank || row.rank || row.role || "",
      sgl: parseInt(row.__EMPTY_5 || row.SGL || row.sgl || "0"),
      dateOfBirth:
        formatDate(
          row.__EMPTY_6 || row["Date of Birth"] || row.dateOfBirth
        ) || "",
      dateOfFirstAppt:
        formatDate(
          row.__EMPTY_7 ||
            row["Date of First Appointment"] ||
            row.dateOfFirstAppt
        ) || "",
      dateOfConf:
        formatDate(
          row.__EMPTY_8 || row["Date of Confirmation"] || row.dateOfConf
        ) || "",
      dateOfPresentAppt:
        formatDate(
          row.__EMPTY_9 ||
            row["Date of Present Appointment"] ||
            row.dateOfPresentAppt
        ) || "",
      qualification:
        row.__EMPTY_10 ||
        row.Qualification ||
        row.qualification ||
        row.qualifications ||
        "",
      lgaOfOrigin:
        row.__EMPTY_11 || row["LGA of Origin"] || row.lgaOfOrigin || lgaId,
      phoneNumber: (
        row.__EMPTY_12 ||
        row["Phone Number"] ||
        row.phoneNumber ||
        ""
      ).toString(),
      recommendedRetirementDate:
        formatDate(
          row.__EMPTY_13 ||
            row["Recommended Retirement Date"] ||
            row.recommendedRetirementDate
        ) || "",
      remark: row.__EMPTY_14 || row.Remark || row.remark || "",
    }));
}

export async function parsePDFFile(
  file: File,
  lgaId: string
): Promise<ParsedStaffData[]> {
  const buffer = await file.arrayBuffer();
  const data = await parsePDF(Buffer.from(buffer));

  const lines = data.text.split("\n").filter((line: string) => line.trim());
  const staffData: ParsedStaffData[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes("Name:") || line.includes("NAME:")) {
      staffData.push({
        name: extractValue(line, "Name:"),
        sex: "M",
        status: "",
        rank: "",
        sgl: 0,
        dateOfBirth: "",
        dateOfFirstAppt: "",
        dateOfConf: "",
        dateOfPresentAppt: "",
        qualification: "",
        lgaOfOrigin: lgaId,
        phoneNumber: "",
        recommendedRetirementDate: "",
      });
    }
  }

  return staffData;
}

function formatDate(dateValue: any): string | null {
  if (!dateValue || dateValue === "") return null;

  if (typeof dateValue === "number") {
    const wholeDays = Math.floor(dateValue);
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const date = new Date(excelEpoch.getTime() + wholeDays * 86400 * 1000);
    if (!isNaN(date.getTime())) return date.toISOString();
  }

  if (typeof dateValue === "string") {
    const trimmedValue = dateValue.trim();

    if (trimmedValue.includes("/")) {
      const parts = trimmedValue.split("/");
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        let year = parseInt(parts[2], 10);
        if (year < 100) year = year < 50 ? 2000 + year : 1900 + year;
        if (
          !isNaN(day) &&
          !isNaN(month) &&
          !isNaN(year) &&
          day >= 1 &&
          day <= 31 &&
          month >= 1 &&
          month <= 12 &&
          year >= 1900 &&
          year <= 2100
        ) {
          const date = new Date(Date.UTC(year, month - 1, day));
          if (!isNaN(date.getTime())) return date.toISOString();
        }
      }
    }

    const date = new Date(trimmedValue);
    if (!isNaN(date.getTime())) return date.toISOString();
  }

  return null;
}

function extractValue(line: string, key: string): string {
  const index = line.indexOf(key);
  if (index === -1) return "";
  return line.substring(index + key.length).trim();
}
