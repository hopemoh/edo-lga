import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  json,
  real,
  unique,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ──────────────────────────────────────────────────────────────────

export const roleEnum = pgEnum("Role", ["STAFF", "ADMIN", "SECRETARY", "CHAIRMAN"]);

export const logActionEnum = pgEnum("LogAction", ["CREATE", "UPDATE", "DELETE"]);

export const changeRequestStatusEnum = pgEnum("ChangeRequestStatus", [
  "PENDING",
  "ADMIN_APPROVED",
  "SECRETARY_APPROVED",
  "CHAIRMAN_APPROVED",
  "REJECTED",
  "COMPLETED",
  "ADMIN_CORRECTED",
]);

export const changeRequestTypeEnum = pgEnum("ChangeRequestType", ["DATA", "DOCUMENT"]);

export const approvalActionEnum = pgEnum("ApprovalAction", [
  "ADMIN_APPROVE",
  "ADMIN_CORRECT",
  "SECRETARY_APPROVE",
  "SECRETARY_REJECT",
  "CHAIRMAN_APPROVE",
  "CHAIRMAN_REJECT",
]);

export const highlightTypeEnum = pgEnum("HighlightType", [
  "CONFIRMATION",
  "CONVERSION",
  "PROMOTION",
  "POSTING",
]);

export const errorLogLevelEnum = pgEnum("ErrorLogLevel", [
  "ERROR",
  "WARNING",
  "INFO",
]);

// ─── Tables ─────────────────────────────────────────────────────────────────

export const lgas = pgTable(
  "lgas",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    zone: text("zone").notNull(),
  }
);

export const lgaDetails = pgTable(
  "lga_details",
  {
    id: text("id").primaryKey(),
    lgaId: text("lgaId")
      .notNull()
      .unique()
      .references(() => lgas.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    landmarks: json("landmarks").$type<string[]>().notNull().default([]),
    activities: json("activities").$type<string[]>().notNull().default([]),
    image: text("image"),
    mapX: real("mapX").notNull().default(0),
    mapY: real("mapY").notNull().default(0),
  }
);

export const statuses = pgTable(
  "statuses",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull().unique(),
  }
);

export const ranks = pgTable(
  "ranks",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull().unique(),
  }
);

export const qualifications = pgTable(
  "qualifications",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull().unique(),
  }
);

export const certifications = pgTable(
  "certifications",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull().unique(),
  }
);

export const staff = pgTable(
  "staff",
  {
    id: text("id").primaryKey(),
    lgaId: text("lgaId")
      .notNull()
      .references(() => lgas.id, { onDelete: "cascade" }),
    serialNumber: integer("serialNumber").notNull().unique(),
    name: text("name").notNull(),
    sex: text("sex").notNull(),
    statusId: text("statusId")
      .notNull()
      .references(() => statuses.id),
    role: roleEnum("role").notNull().default("STAFF"),
    sgl: integer("sgl").notNull().default(0),
    dateOfBirth: timestamp("dateOfBirth").notNull(),
    dateOfFirstAppt: timestamp("dateOfFirstAppt").notNull(),
    dateOfConf: timestamp("dateOfConf"),
    dateOfPresentAppt: timestamp("dateOfPresentAppt"),
    phoneNumber: text("phoneNumber").notNull(),
    recommendedRetirementDate: timestamp("recommendedRetirementDate"),
    documentUrl: text("documentUrl"),
    canUpdateDocument: boolean("canUpdateDocument").notNull().default(false),
    remark: text("remark"),
    yearsExperience: integer("yearsExperience"),
    passwordHash: text("passwordHash"),
    hasChangedPassword: boolean("hasChangedPassword").notNull().default(false),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (table) => [
    index("staff_lgaId_idx").on(table.lgaId),
    index("staff_statusId_idx").on(table.statusId),
  ]
);

export const staffRanks = pgTable(
  "staff_ranks",
  {
    id: text("id").primaryKey(),
    staffId: text("staffId")
      .notNull()
      .references(() => staff.id, { onDelete: "cascade" }),
    rankId: text("rankId")
      .notNull()
      .references(() => ranks.id, { onDelete: "cascade" }),
  },
  (table) => [
    unique("staff_ranks_staffId_rankId_unique").on(table.staffId, table.rankId),
  ]
);

export const staffQualifications = pgTable(
  "staff_qualifications",
  {
    id: text("id").primaryKey(),
    staffId: text("staffId")
      .notNull()
      .references(() => staff.id, { onDelete: "cascade" }),
    qualificationId: text("qualificationId")
      .notNull()
      .references(() => qualifications.id, { onDelete: "cascade" }),
  },
  (table) => [
    unique("staff_qualifications_staffId_qualificationId_unique").on(
      table.staffId,
      table.qualificationId
    ),
  ]
);

export const staffCertifications = pgTable(
  "staff_certifications",
  {
    id: text("id").primaryKey(),
    staffId: text("staffId")
      .notNull()
      .references(() => staff.id, { onDelete: "cascade" }),
    certificationId: text("certificationId")
      .notNull()
      .references(() => certifications.id, { onDelete: "cascade" }),
  },
  (table) => [
    unique("staff_certifications_staffId_certificationId_unique").on(
      table.staffId,
      table.certificationId
    ),
  ]
);

export const logEntries = pgTable(
  "log_entries",
  {
    id: text("id").primaryKey(),
    timestamp: timestamp("timestamp").notNull().defaultNow(),
    action: logActionEnum("action").notNull(),
    details: text("details").notNull(),
    userId: text("userId").notNull(),
    userFullName: text("userFullName").notNull(),
    userRank: text("userRank").notNull(),
    userRole: roleEnum("userRole").notNull(),
  }
);

export const contentSections = pgTable(
  "content_sections",
  {
    id: text("id").primaryKey(),
    section: text("section").notNull().unique(),
    title: text("title").notNull(),
    subtitle: text("subtitle"),
    content: text("content").notNull(),
    metadata: json("metadata"),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  }
);

export const documentHistory = pgTable(
  "document_history",
  {
    id: text("id").primaryKey(),
    staffId: text("staffId")
      .notNull()
      .references(() => staff.id, { onDelete: "cascade" }),
    documentUrl: text("documentUrl").notNull(),
    uploadedAt: timestamp("uploadedAt").notNull().defaultNow(),
    uploadedBy: text("uploadedBy").notNull(),
    reason: text("reason"),
  }
);

export const changeRequests = pgTable(
  "change_requests",
  {
    id: text("id").primaryKey(),
    staffId: text("staffId")
      .notNull()
      .references(() => staff.id, { onDelete: "cascade" }),
    type: changeRequestTypeEnum("type").notNull().default("DATA"),
    requestedBy: text("requestedBy").notNull(),
    changes: json("changes").notNull(),
    oldValues: json("oldValues"),
    reason: text("reason").notNull(),
    status: changeRequestStatusEnum("status").notNull().default("ADMIN_APPROVED"),

    selectedFields: json("selectedFields").$type<string[]>(),
    reasonId: text("reasonId").references(() => changeReasons.id),
    supportingDocumentUrl: text("supportingDocumentUrl"),
    adminNote: text("adminNote"),

    adminApprovedBy: text("adminApprovedBy"),
    adminApprovedByName: text("adminApprovedByName"),
    adminApprovedAt: timestamp("adminApprovedAt"),
    adminApprovedComments: text("adminApprovedComments"),

    secretaryApprovedBy: text("secretaryApprovedBy"),
    secretaryApprovedByName: text("secretaryApprovedByName"),
    secretaryApprovedAt: timestamp("secretaryApprovedAt"),
    secretaryApprovedComments: text("secretaryApprovedComments"),

    chairmanApprovedBy: text("chairmanApprovedBy"),
    chairmanApprovedByName: text("chairmanApprovedByName"),
    chairmanApprovedAt: timestamp("chairmanApprovedAt"),
    chairmanApprovedComments: text("chairmanApprovedComments"),

    rejectedBy: text("rejectedBy"),
    rejectedAt: timestamp("rejectedAt"),
    rejectedReason: text("rejectedReason"),
    rejectedByRole: text("rejectedByRole"),

    isAdminCorrectable: boolean("isAdminCorrectable").default(true),
    correctionWindowExpiresAt: timestamp("correctionWindowExpiresAt"),

    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (table) => [
    index("change_requests_staffId_idx").on(table.staffId),
  ]
);

export const changeReasons = pgTable(
  "change_reasons",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull().unique(),
    requiresDocument: boolean("requiresDocument").notNull().default(false),
    isActive: boolean("isActive").notNull().default(true),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  }
);

export const approvalLogs = pgTable(
  "approval_logs",
  {
    id: text("id").primaryKey(),
    changeRequestId: text("changeRequestId")
      .notNull()
      .references(() => changeRequests.id, { onDelete: "cascade" }),
    action: approvalActionEnum("action").notNull(),
    performedBy: text("performedBy").notNull(),
    performedByFullName: text("performedByFullName").notNull(),
    performedByRole: roleEnum("performedByRole").notNull(),
    comments: text("comments"),
    timestamp: timestamp("timestamp").notNull().defaultNow(),
  },
  (table) => [
    index("approval_logs_changeRequestId_idx").on(table.changeRequestId),
  ]
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: text("id").primaryKey(),
    changeRequestId: text("changeRequestId"),
    action: text("action").notNull(),
    staffId: text("staffId"),
    details: text("details").notNull(),
    performedBy: text("performedBy").notNull(),
    performedByFullName: text("performedByFullName").notNull(),
    performedByRole: roleEnum("performedByRole").notNull(),
    timestamp: timestamp("timestamp").notNull().defaultNow(),
  },
  (table) => [
    index("audit_logs_changeRequestId_idx").on(table.changeRequestId),
    index("audit_logs_staffId_idx").on(table.staffId),
    index("audit_logs_timestamp_idx").on(table.timestamp),
  ]
);

export const errorLogs = pgTable(
  "error_logs",
  {
    id: text("id").primaryKey(),
    timestamp: timestamp("timestamp").notNull().defaultNow(),
    level: errorLogLevelEnum("level").notNull().default("ERROR"),
    source: text("source").notNull(),
    message: text("message").notNull(),
    stack: text("stack"),
    userId: text("userId"),
    userRole: text("userRole"),
    requestMethod: text("requestMethod"),
    requestPath: text("requestPath"),
    resolved: boolean("resolved").notNull().default(false),
    resolvedBy: text("resolvedBy"),
    resolvedAt: timestamp("resolvedAt"),
  },
  (table) => [
    index("error_logs_timestamp_idx").on(table.timestamp),
    index("error_logs_level_idx").on(table.level),
    index("error_logs_resolved_idx").on(table.resolved),
  ]
);

export const executives = pgTable(
  "executives",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    role: text("role").notNull(),
    image: text("image"),
    order: integer("order").notNull().default(0),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  }
);

export const landingPageHighlights = pgTable(
  "landing_page_highlights",
  {
    id: text("id").primaryKey(),
    type: highlightTypeEnum("type").notNull(),
    title: text("title").notNull(),
    subtitle: text("subtitle").notNull(),
    description: text("description"),
    image: text("image"),
    order: integer("order").notNull().default(0),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  }
);

export const disciplinaryCases = pgTable(
  "disciplinary_cases",
  {
    id: text("id").primaryKey(),
    staffId: text("staffId")
      .notNull()
      .references(() => staff.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull(),
    status: text("status").notNull(),
    sanction: text("sanction"),
    dateReported: timestamp("dateReported").notNull().defaultNow(),
    dateResolved: timestamp("dateResolved"),
  }
);

export const sanctions = pgTable(
  "sanctions",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull().unique(),
  }
);

export const systemSettings = pgTable(
  "system_settings",
  {
    id: text("id").primaryKey(),
    key: text("key").notNull().unique(),
    value: text("value").notNull(),
    label: text("label"),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  }
);

// ─── Relations ──────────────────────────────────────────────────────────────

export const lgasRelations = relations(lgas, ({ one, many }) => ({
  details: one(lgaDetails, {
    fields: [lgas.id],
    references: [lgaDetails.lgaId],
  }),
  staffMembers: many(staff),
}));

export const lgaDetailsRelations = relations(lgaDetails, ({ one }) => ({
  lga: one(lgas, {
    fields: [lgaDetails.lgaId],
    references: [lgas.id],
  }),
}));

export const statusesRelations = relations(statuses, ({ many }) => ({
  staffMembers: many(staff),
}));

export const ranksRelations = relations(ranks, ({ many }) => ({
  staffRanks: many(staffRanks),
}));

export const qualificationsRelations = relations(qualifications, ({ many }) => ({
  staffQualifications: many(staffQualifications),
}));

export const certificationsRelations = relations(certifications, ({ many }) => ({
  staffCertifications: many(staffCertifications),
}));

export const staffRelations = relations(staff, ({ one, many }) => ({
  lga: one(lgas, {
    fields: [staff.lgaId],
    references: [lgas.id],
  }),
  status: one(statuses, {
    fields: [staff.statusId],
    references: [statuses.id],
  }),
  ranks: many(staffRanks),
  qualifications: many(staffQualifications),
  certifications: many(staffCertifications),
  documentHistoryEntries: many(documentHistory),
  changeRequests: many(changeRequests),
  disciplinaryCases: many(disciplinaryCases),
}));

export const staffRanksRelations = relations(staffRanks, ({ one }) => ({
  staff: one(staff, {
    fields: [staffRanks.staffId],
    references: [staff.id],
  }),
  rank: one(ranks, {
    fields: [staffRanks.rankId],
    references: [ranks.id],
  }),
}));

export const staffQualificationsRelations = relations(
  staffQualifications,
  ({ one }) => ({
    staff: one(staff, {
      fields: [staffQualifications.staffId],
      references: [staff.id],
    }),
    qualification: one(qualifications, {
      fields: [staffQualifications.qualificationId],
      references: [qualifications.id],
    }),
  })
);

export const staffCertificationsRelations = relations(
  staffCertifications,
  ({ one }) => ({
    staff: one(staff, {
      fields: [staffCertifications.staffId],
      references: [staff.id],
    }),
    certification: one(certifications, {
      fields: [staffCertifications.certificationId],
      references: [certifications.id],
    }),
  })
);

export const documentHistoryRelations = relations(documentHistory, ({ one }) => ({
  staff: one(staff, {
    fields: [documentHistory.staffId],
    references: [staff.id],
  }),
}));

export const changeRequestsRelations = relations(changeRequests, ({ one, many }) => ({
  staff: one(staff, {
    fields: [changeRequests.staffId],
    references: [staff.id],
  }),
  changeReason: one(changeReasons, {
    fields: [changeRequests.reasonId],
    references: [changeReasons.id],
  }),
  approvalLogs: many(approvalLogs),
}));

export const changeReasonsRelations = relations(changeReasons, ({ many }) => ({
  changeRequests: many(changeRequests),
}));

export const approvalLogsRelations = relations(approvalLogs, ({ one }) => ({
  changeRequest: one(changeRequests, {
    fields: [approvalLogs.changeRequestId],
    references: [changeRequests.id],
  }),
}));

export const disciplinaryCasesRelations = relations(
  disciplinaryCases,
  ({ one }) => ({
    staff: one(staff, {
      fields: [disciplinaryCases.staffId],
      references: [staff.id],
    }),
  })
);
