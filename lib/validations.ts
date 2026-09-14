import { z } from "zod"

export const loginSchema = z.object({
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
})

export const staffCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sex: z.enum(["M", "F"], { required_error: "Sex is required" }),
  lgaId: z.string().min(1, "LGA is required"),
  statusId: z.string().min(1, "Status is required"),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
  sgl: z.coerce.number().min(1, "SGL is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  dateOfFirstAppt: z.string().min(1, "First appointment date is required"),
  dateOfConf: z.string().min(1, "Confirmation date is required"),
  dateOfPresentAppt: z.string().min(1, "Present appointment date is required"),
  recommendedRetirementDate: z.string().optional(),
  remark: z.string().optional(),
})

export const staffUpdateSchema = staffCreateSchema.partial()

const ALLOWED_CHANGE_FIELDS = [
  "name", "phoneNumber", "sex", "dateOfBirth", "dateOfFirstAppt",
  "dateOfConf", "dateOfPresentAppt", "sgl", "recommendedRetirementDate",
  "rank", "status", "qualifications", "remark", "documentUrl",
]

export const changeRequestSchema = z.object({
  staffId: z.string().min(1, "Staff is required"),
  type: z.enum(["DATA", "DOCUMENT"]).default("DATA"),
  changes: z.record(z.any()).refine(
    (obj) => Object.keys(obj).length > 0 && Object.keys(obj).every((k) => ALLOWED_CHANGE_FIELDS.includes(k)),
    "At least one valid field must be changed"
  ),
  reason: z.string().min(1, "Reason is required"),
  reasonId: z.string().optional().nullable(),
  selectedFields: z.array(z.string()).optional().nullable(),
  supportingDocumentUrl: z.string().optional().nullable(),
})

export const approveSchema = z.object({
  comments: z.string().optional(),
})

export const rejectSchema = z.object({
  reason: z.string().min(1, "Rejection reason is required"),
})

export const correctSchema = z.object({
  changes: z.record(z.any()).refine((obj) => Object.keys(obj).length > 0, "At least one field must be corrected"),
  reason: z.string().min(1, "Reason is required"),
})

export const lgaSchema = z.object({
  name: z.string().min(1, "Name is required"),
  zone: z.string().min(1, "Zone is required"),
  description: z.string().optional(),
})

export const lgaDetailSchema = z.object({
  lgaId: z.string().min(1, "LGA is required"),
  description: z.string().optional(),
  landmarks: z.array(z.string()).optional(),
  activities: z.array(z.string()).optional(),
  imageUrl: z.string().optional(),
})

export const statusSchema = z.object({
  name: z.string().min(1, "Name is required"),
})

export const rankSchema = z.object({
  name: z.string().min(1, "Name is required"),
})

export const qualificationSchema = z.object({
  name: z.string().min(1, "Name is required"),
})

export const changeReasonSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  requiresDocument: z.boolean().default(false),
  isActive: z.boolean().default(true),
})

export const contentSectionSchema = z.object({
  section: z.string().min(1, "Section is required"),
  title: z.string().min(1, "Title is required"),
  subtitle: z.string().optional(),
  content: z.string().optional(),
})

export const executiveSchema = z.object({
  name: z.string().min(1, "Name is required"),
  role: z.string().min(1, "Role is required"),
  image: z.string().optional(),
  order: z.number().optional(),
})

export const highlightSchema = z.object({
  type: z.enum(["CONFIRMATION", "CONVERSION", "PROMOTION", "POSTING"]),
  title: z.string().min(1, "Title is required"),
  subtitle: z.string().optional(),
  imageUrl: z.string().optional(),
  order: z.number().optional(),
})

export const sanctionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
})

export const disciplinaryCaseSchema = z.object({
  staffId: z.string().min(1, "Staff is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  status: z.string().min(1, "Status is required"),
  sanction: z.string().optional(),
  dateReported: z.string().min(1, "Date reported is required"),
  dateResolved: z.string().optional(),
})

export const settingSchema = z.object({
  key: z.string().min(1, "Key is required"),
  value: z.string().min(1, "Value is required"),
})

export const roleAssignmentSchema = z.object({
  role: z.enum(["STAFF", "ADMIN", "SECRETARY", "CHAIRMAN"], {
    required_error: "Role is required",
  }),
})
