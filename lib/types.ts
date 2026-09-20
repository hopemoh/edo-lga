export interface LGA {
  id: string;
  name: string;
  zone: string;
  description?: string;
  population?: number;
}

export interface StaffQualification {
  id: string;
  name: string;
}

export interface Staff {
  id: string;
  lgaId: string;
  serialNumber: number;
  name: string;
  sex: "M" | "F";
  status: { id: string; name: string } | string;
  rank?: { id: string; name: string } | null;
  sgl: number;
  dateOfBirth: Date;
  dateOfFirstAppt: Date;
  dateOfConf: Date;
  dateOfPresentAppt: Date;
  lgaOfOrigin: string;
  phoneNumber: string;
  recommendedRetirementDate: Date;
  qualifications: StaffQualification[];
  documentUrl?: string;
  remark?: string;
  certifications?: string[];
  yearsExperience?: number;
  lga?: { id: string; name: string };
  canUpdateDetails?: boolean;
  role?: "STAFF" | "ADMIN" | "CHAIRMAN" | "SECRETARY";
  isExternal?: boolean;
  officeName?: "CHAIRMAN" | "SECRETARY" | null;
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  action: "CREATE" | "UPDATE" | "DELETE" | "DELEGATION_CREATED" | "DELEGATION_REVOKED";
  details: string;
  userId: string;
  userFullName: string;
  userRank: string;
  userRole: string;
}

export interface PreviousPosition {
  position: string;
  startDate: Date;
  endDate: Date;
  department: string;
}

export interface DisciplinaryCase {
  id: string;
  staffId: string;
  title: string;
  description: string;
  status: string;
  sanction?: string | null;
  dateReported: Date;
  dateResolved?: Date | null;
  staff: {
    name: string;
    lga: {
      name: string;
    };
  };
}
