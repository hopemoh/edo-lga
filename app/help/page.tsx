"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { SignedImage } from "@/components/ui/signed-image"
import {
  ArrowLeft,
  Search,
  ChevronRight,
  ChevronDown,
  Shield,
  Users,
  FileText,
  Settings,
  HelpCircle,
  CheckCircle,
  AlertCircle,
  Image,
} from "lucide-react"

const S3_BASE = "https://akoko-edo-lga.s3.eu-north-1.amazonaws.com/help"

interface Section {
  id: string
  title: string
  icon: React.ReactNode
  content: React.ReactNode
}

const sections: Section[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: <HelpCircle className="w-5 h-5" />,
    content: (
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold mb-3">What is this system?</h3>
          <p className="text-muted-foreground leading-relaxed">
            The <strong>Edo State Local Government Service Commission Management Information System</strong> is a
            comprehensive platform for managing staff records across all 18 Local Government Areas in Edo State.
            It serves as both a public-facing informational website and an internal staff management dashboard.
          </p>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3">How to Access</h3>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>Open your web browser and navigate to the application URL</li>
            <li>Click <strong>&quot;Login&quot;</strong> in the top navigation bar</li>
            <li>Enter your <strong>phone number</strong> (this is your username)</li>
            <li>Enter your <strong>password</strong> (your date of birth for first login, or your changed password)</li>
            <li>Click <strong>Login</strong></li>
          </ol>
        </div>

        <div className="bg-muted/50 border border-border rounded-xl p-4">
          <p className="text-sm font-medium mb-1">Login Format</p>
          <p className="text-sm text-muted-foreground">Phone: <code className="bg-muted px-1.5 py-0.5 rounded">08123456789</code> (leading 0 is optional — it gets stripped automatically)</p>
          <p className="text-sm text-muted-foreground">Password: <code className="bg-muted px-1.5 py-0.5 rounded">1980-03-03</code> (DOB for first login, or your changed password)</p>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3">First-Time Setup</h3>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>Log in with the default admin credentials</li>
            <li>Navigate to <strong>System Settings</strong> (gear icon) to configure document replacement window</li>
            <li>Go to <strong>Manage Status, Ranks &amp; Qualifications</strong> to set up employment statuses and ranks</li>
            <li>Use <strong>Bulk Import</strong> to upload your staff records via Excel</li>
            <li>Update LGA details for each of the 18 LGAs</li>
          </ol>
        </div>
      </div>
    ),
  },
  {
    id: "roles",
    title: "Roles & Permissions",
    icon: <Shield className="w-5 h-5" />,
    content: (
      <div className="space-y-6">
        <p className="text-muted-foreground">
          The system has four user roles: <strong>STAFF</strong>, <strong>ADMIN</strong>, <strong>CHAIRMAN</strong>, and <strong>SECRETARY</strong>. Your role determines what you can see and do.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-border rounded-xl overflow-hidden">
            <thead>
              <tr className="bg-muted">
                <th className="text-left p-3 font-semibold">Capability</th>
                <th className="text-center p-3 font-semibold">STAFF</th>
                <th className="text-center p-3 font-semibold">ADMIN</th>
                <th className="text-center p-3 font-semibold">SECRETARY</th>
                <th className="text-center p-3 font-semibold">CHAIRMAN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                ["View own profile", true, true, true, true],
                ["View all staff records", false, true, true, true],
                ["Submit change requests", false, true, true, true],
                ["Add/Edit staff members", false, true, true, true],
                ["Bulk import staff (Excel/PDF)", false, true, true, true],
                ["Upload staff documents", false, true, true, true],
                ["View Activity Logs", false, true, true, true],
                ["Manage LGA details", false, true, true, true],
                ["Manage landing page content", false, true, true, true],
                ["Manage executives & highlights", false, true, true, true],
                ["Reset staff passwords", false, true, true, true],
                ["1st-level approval (Admin)", false, true, false, false],
                ["2nd-level approval (Secretary)", false, false, true, false],
                ["Final approval (Chairman)", false, false, false, true],
                ["Delegate approval authority", false, false, false, true],
                ["Manage system settings", false, false, false, true],
                ["Assign offices (Create Office)", false, true, false, false],
                ["Assign Secretary role", false, false, false, true],
              ].map(([label, staff, admin, secretary, chairman], i) => (
                <tr key={i} className="hover:bg-muted/50">
                  <td className="p-3">{String(label)}</td>
                  <td className="text-center p-3">{staff ? <CheckCircle className="w-4 h-4 text-green-600 mx-auto" /> : <span className="text-muted-foreground">-</span>}</td>
                  <td className="text-center p-3">{admin ? <CheckCircle className="w-4 h-4 text-green-600 mx-auto" /> : <span className="text-muted-foreground">-</span>}</td>
                  <td className="text-center p-3">{secretary ? <CheckCircle className="w-4 h-4 text-green-600 mx-auto" /> : <span className="text-muted-foreground">-</span>}</td>
                  <td className="text-center p-3">{chairman ? <CheckCircle className="w-4 h-4 text-green-600 mx-auto" /> : <span className="text-muted-foreground">-</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-muted/50 border border-border rounded-xl p-4 mt-4">
          <p className="text-sm font-medium mb-1">How Roles Work</p>
          <p className="text-sm text-muted-foreground">
            ADMIN creates an office and assigns a CHAIRMAN or SECRETARY role to a staff member.
            The CHAIRMAN can manage system settings, delegate approval authority, and give final approval on change requests.
            The SECRETARY handles 2nd-level approvals. STAFF can only view their own profile and submit change requests.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "staff-management",
    title: "Staff Management",
    icon: <Users className="w-5 h-5" />,
    content: (
      <div className="space-y-8">
        <div>
          <h3 className="text-xl font-bold mb-3">Dashboard Overview</h3>
          <p className="text-muted-foreground mb-4">
            The dashboard shows key statistics at the top (total staff, selected LGA, activities, pending requests)
            and a sidebar with LGAs grouped by zone (Northern, Central, Southern).
          </p>
          <SignedImage
            src={`${S3_BASE}/dashboard-overview.png`}
            alt="Dashboard overview with stats cards and staff table"
            className="w-full rounded-xl border border-border"
          />
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3">Viewing Staff Records</h3>
          <p className="text-muted-foreground mb-4">
            The staff table displays records with columns for Name, Sex, Status, Rank,
            Qualifications, SGL, and Actions. Use the search bar to filter by name.
            Staff members can only see their own profile.
          </p>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3">Adding a New Staff Member</h3>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground mb-4">
            <li>Click the <strong>&quot;+ Add Staff&quot;</strong> button in the dashboard</li>
            <li>Fill in all required fields: Name, Sex, LGA, Status, Phone Number, SGL, Dates</li>
            <li>Optionally add qualifications and upload a PDF document</li>
            <li>Click <strong>Save</strong> to create the record</li>
          </ol>
          <SignedImage
            src={`${S3_BASE}/add-staff-form.png`}
            alt="Add staff form with all fields"
            className="w-full rounded-xl border border-border"
          />
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3">Bulk Importing Staff</h3>
          <p className="text-muted-foreground mb-4">
            You can import multiple staff records at once using an Excel (.xlsx) file. The file should have columns
            matching the staff fields (Name, Sex, Phone, DOB, Status, etc.).
          </p>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground mb-4">
            <li>Click <strong>&quot;Bulk Import&quot;</strong> in the dashboard</li>
            <li>Select the LGA for the imported staff</li>
            <li>Upload your Excel file</li>
            <li>The system will parse the file and create records for each row</li>
          </ol>
          <SignedImage
            src={`${S3_BASE}/bulk-import.png`}
            alt="Bulk import file upload modal"
            className="w-full rounded-xl border border-border"
          />
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3">Excel File Format</h3>
          <p className="text-muted-foreground mb-4">
            Your Excel file must follow the correct column format for the system to parse it successfully.
            Below is the expected layout — each row represents one staff member.
          </p>
          <SignedImage
            src={`${S3_BASE}/bulk-import-file-format.png`}
            alt="Excel file format showing required columns for bulk import"
            className="w-full rounded-xl border border-border"
          />
          <div className="bg-muted/50 border border-border rounded-xl p-4 mt-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium mb-1">Template</p>
              <p className="text-sm text-muted-foreground">
                Download the template, fill in your data, and upload it back.
                Make sure all required fields (Name, Sex, Phone, Status, SGL) are populated.
              </p>
            </div>
            <a
              href={`/api/signed-url?key=help/bulk-import-template.xlsx&download=bulk-upload-format.xlsx`}
              className="shrink-0 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
            >
              Download Template
            </a>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3">Viewing a Staff Profile</h3>
          <p className="text-muted-foreground mb-4">
            Click <strong>&quot;View Profile&quot;</strong> on any staff row to open their full profile. This shows
            personal details, document, qualifications, and activity history. Admins, Chairmen, and Secretaries can also submit change requests
            from here.
          </p>
          <SignedImage
            src={`${S3_BASE}/staff-detail-modal.png`}
            alt="Staff detail modal showing full profile"
            className="w-full rounded-xl border border-border"
          />
        </div>
      </div>
    ),
  },
  {
    id: "documents",
    title: "Document Management",
    icon: <FileText className="w-5 h-5" />,
    content: (
      <div className="space-y-8">
        <div>
          <h3 className="text-xl font-bold mb-3">Uploading Documents</h3>
          <p className="text-muted-foreground mb-4">
            Each staff member can have one PDF document (credential, appointment letter, etc.) stored securely in AWS S3.
          </p>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground mb-4">
            <li>Open the staff member&apos;s profile</li>
            <li>Click <strong>&quot;Upload PDF Document&quot;</strong></li>
            <li>Select a PDF file from your computer</li>
            <li>The document is uploaded to S3 and a preview is shown</li>
          </ol>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3">Replacing Documents</h3>
          <p className="text-muted-foreground mb-4">
            Documents can only be replaced within a configurable time window (default: 30 minutes) after upload.
            After this window, a change request must be submitted for approval.
          </p>
          <div className="bg-muted/50 border border-border rounded-xl p-4">
            <p className="text-sm font-medium mb-1">Why this restriction?</p>
            <p className="text-sm text-muted-foreground">
              To maintain data integrity and create an audit trail. The Chairman can adjust this window in System Settings.
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3">Viewing Document History</h3>
          <p className="text-muted-foreground">
            Click <strong>&quot;Document History&quot;</strong> in the staff profile to see a log of all documents
            uploaded for that staff member, including who uploaded them and when.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "change-requests",
    title: "Change Requests",
    icon: <CheckCircle className="w-5 h-5" />,
    content: (
      <div className="space-y-8">
        <div>
          <h3 className="text-xl font-bold mb-3">How It Works</h3>
          <p className="text-muted-foreground mb-4">
            Staff data changes go through a <strong>3-tier approval workflow</strong> to ensure data accuracy
            and accountability. Every change is logged with timestamps and user attribution.
          </p>

          <div className="bg-muted/50 border border-border rounded-xl p-6 space-y-3">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-yellow-100 text-yellow-700 flex items-center justify-center text-sm font-bold">1</span>
              <span className="text-sm"><strong>Admin</strong> creates a change request → Status: <code>PENDING</code></span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold">2</span>
              <span className="text-sm"><strong>Admin</strong> approves → Status: <code>ADMIN_APPROVED</code></span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-sm font-bold">3</span>
              <span className="text-sm"><strong>Secretary</strong> approves → Status: <code>SECRETARY_APPROVED</code></span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-sm font-bold">4</span>
              <span className="text-sm"><strong>Chairman</strong> approves → Status: <code>COMPLETED</code></span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3">Submitting a Change Request</h3>
          <p className="text-muted-foreground mb-4">
            ADMIN, CHAIRMAN, and SECRETARY roles can create change requests. Open a staff member&apos;s
            profile and click <strong>&quot;Process Change Request&quot;</strong> to begin.
          </p>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground mb-4">
            <li>Open the staff member&apos;s profile</li>
            <li>Click <strong>&quot;Process Change Request&quot;</strong></li>
            <li>Select the fields to change (name, DOB, phone, rank, status, etc.)</li>
            <li>Choose a reason from the dropdown (some reasons require a supporting document)</li>
            <li>Enter the corrected values</li>
            <li>Optionally attach a supporting document</li>
            <li>Click <strong>Submit</strong></li>
          </ol>
          <SignedImage
            src={`${S3_BASE}/submit-change-request.png`}
            alt="Change request submission modal"
            className="w-full rounded-xl border border-border"
          />
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3">Approving or Rejecting</h3>
          <p className="text-muted-foreground mb-4">
            Each level of approver can <strong>Approve</strong>, <strong>Reject</strong>, or <strong>Correct</strong> a request.
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
            <li><strong>Approve:</strong> Passes the request to the next level</li>
            <li><strong>Reject:</strong> Ends the request immediately with reason</li>
            <li><strong>Correct:</strong> Admin can fix the data directly (only within 24 hours of submission)</li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3">The 24-Hour Correction Window</h3>
          <p className="text-muted-foreground">
            Within 24 hours of a request being submitted, the Admin can directly correct the data instead of
            sending it through the full approval chain. After 24 hours, the correction option expires and the
            request must go through all approval levels.
          </p>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3">Viewing Request Status</h3>
          <SignedImage
            src={`${S3_BASE}/approval-flow.png`}
            alt="Change request showing approval status badges"
            className="w-full rounded-xl border border-border"
          />
        </div>
      </div>
    ),
  },
  {
    id: "cms",
    title: "Local Government Management",
    icon: <Image className="w-5 h-5" />,
    content: (
      <div className="space-y-8">
        <div>
          <h3 className="text-xl font-bold mb-3">Overview</h3>
          <p className="text-muted-foreground">
            The public landing page is fully content-manageable. All text sections, executive photos,
            highlight items, footer content, and annual report downloads can be edited from the dashboard
            without code changes.
          </p>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3">Editing Section Content</h3>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground mb-4">
            <li>Click <strong>&quot;Manage Content&quot;</strong> in the dashboard</li>
            <li>Select the section to edit (Mission &amp; Vision, Appointments, Training, etc.)</li>
            <li>Update the title, subtitle, and rich-text content</li>
            <li>Click <strong>Save</strong></li>
          </ol>
          <SignedImage
            src={`${S3_BASE}/content-manager.png`}
            alt="Content management form for landing page sections"
            className="w-full rounded-xl border border-border"
          />
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3">Managing Executives</h3>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground mb-4">
            <li>Click <strong>&quot;Highlights &amp; Execs&quot;</strong> in the dashboard</li>
            <li>Switch to the <strong>Executives</strong> tab</li>
            <li>Add, edit, or remove executive team members with photos</li>
            <li>Drag to reorder the display order</li>
          </ol>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3">Managing Highlights</h3>
          <p className="text-muted-foreground mb-4">
            Highlights are the featured items shown on the landing page under each section. You can manage:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
            <li><strong>Confirmations of Appointment</strong> — Recently confirmed staff members</li>
            <li><strong>Promotions</strong> — Recently promoted staff members</li>
            <li><strong>Postings</strong> — Recent staff postings/transfers</li>
            <li><strong>Conversions</strong> — Recent cadre conversions</li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3">Updating LGA Details</h3>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground mb-4">
            <li>Click <strong>&quot;Update LGA&quot;</strong> in the dashboard</li>
            <li>Select the LGA from the dropdown</li>
            <li>Edit the description, landmarks, activities, and image</li>
            <li>Click <strong>Save</strong></li>
          </ol>
          <SignedImage
            src={`${S3_BASE}/lga-edit-form.png`}
            alt="LGA edit form with description, landmarks, and image upload"
            className="w-full rounded-xl border border-border"
          />
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3">Uploading Annual Reports</h3>
          <p className="text-muted-foreground mb-4">
            Admins can upload a PDF annual report that visitors can download from the landing page.
          </p>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>Click <strong>&quot;Manage Content&quot;</strong> in the dashboard</li>
            <li>Select the <strong>Annual Report</strong> tab under Reports</li>
            <li>Upload a PDF file (max 10MB)</li>
            <li>The &quot;Download Annual Reports&quot; section will appear on the landing page</li>
          </ol>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3">Customizing the Footer</h3>
          <p className="text-muted-foreground mb-4">
            The footer description, copyright text, and navigation links can be managed from the dashboard.
          </p>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>Click <strong>&quot;Manage Content&quot;</strong> in the dashboard</li>
            <li>Select the <strong>Footer</strong> tab under Reports</li>
            <li>Edit the description, copyright text, and add/remove navigation links</li>
            <li>Click <strong>Save</strong></li>
          </ol>
        </div>
      </div>
    ),
  },
  {
    id: "admin",
    title: "System Administration",
    icon: <Settings className="w-5 h-5" />,
    content: (
      <div className="space-y-8">
        <div>
          <h3 className="text-xl font-bold mb-3">Managing Statuses, Ranks &amp; Qualifications</h3>
          <p className="text-muted-foreground mb-4">
            These are the building blocks of staff records. You can add, edit, or remove them from the dashboard.
          </p>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground mb-4">
            <li>Click <strong>&quot;Manage Status, Ranks &amp; Qualifications&quot;</strong></li>
            <li>Switch between the Status, Rank, and Qualification tabs</li>
            <li>Add new items or edit existing ones</li>
          </ol>
          <SignedImage
            src={`${S3_BASE}/manage-status-ranks.png`}
            alt="Status, ranks, and qualifications management modal"
            className="w-full rounded-xl border border-border"
          />
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3">Assigning the Secretary Role</h3>
          <p className="text-muted-foreground mb-4">
            The CHAIRMAN can assign the SECRETARY role to any staff member. This grants them 2nd-level approval permissions.
          </p>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>Open a staff member&apos;s profile</li>
            <li>Click <strong>&quot;Assign Secretary&quot;</strong></li>
            <li>Confirm the assignment in the dialog</li>
            <li>The staff member now has SECRETARY-level permissions</li>
          </ol>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3">Resetting Staff Passwords</h3>
          <p className="text-muted-foreground mb-4">
            If a staff member forgets their password, admins can reset it. This clears their password
            and forces them to set a new one on their next login (using phone + DOB).
          </p>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>Open the staff member&apos;s profile</li>
            <li>Click <strong>&quot;Reset Password&quot;</strong></li>
            <li>Confirm the reset in the dialog</li>
            <li>The staff member will use phone + DOB to login and must set a new password</li>
          </ol>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3">Delegating Approval Authority</h3>
          <p className="text-muted-foreground mb-4">
            The Chairman can delegate a staff member to approve change requests on their behalf.
            The delegate inherits CHAIRMAN-level approval permissions while the delegation is active.
            Both the delegate and the Chairman are logged in the audit trail for every action.
          </p>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground mb-4">
            <li>Open the profile of the staff member you want to delegate</li>
            <li>Click <strong>&quot;Delegate&quot;</strong> (purple button)</li>
            <li>Review the confirmation dialog and click <strong>&quot;Confirm Delegate&quot;</strong></li>
            <li>The delegate can now approve requests at the Chairman level</li>
          </ol>
          <div className="bg-muted/50 border border-border rounded-xl p-4 space-y-2">
            <p className="text-sm font-medium">Switching Delegates</p>
            <p className="text-sm text-muted-foreground">
              If a delegate is already active, clicking &quot;Delegate&quot; on a different staff member
              will show a switch dialog. The previous delegation is revoked automatically.
            </p>
            <p className="text-sm font-medium mt-3">Revoking Delegation</p>
            <p className="text-sm text-muted-foreground">
              Open the current delegate&apos;s profile and click <strong>&quot;Delegate&quot;</strong> to see
              the revoke option. Revoking restores full control to the Chairman only.
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3">System Settings (Chairman Only)</h3>
          <p className="text-muted-foreground mb-4">
            The Chairman can configure system-wide settings such as the document replacement time window.
          </p>
          <SignedImage
            src={`${S3_BASE}/system-settings.png`}
            alt="System settings modal"
            className="w-full rounded-xl border border-border"
          />
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3">Activity Logs &amp; Audit Trail</h3>
          <p className="text-muted-foreground mb-4">
            All actions in the system are logged for accountability. ADMIN, SECRETARY office, and CHAIRMAN office holders can view:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
            <li><strong>Activity Logs</strong> — All system actions with timestamps (not visible to STAFF)</li>
            <li><strong>Approval Logs</strong> — Detailed approval/rejection history</li>
            <li><strong>Audit Trail</strong> — Complete change history for each staff record</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: "faq",
    title: "Troubleshooting",
    icon: <AlertCircle className="w-5 h-5" />,
    content: (
      <div className="space-y-6">
        {[
          {
            q: "I can't log in — it says 'Invalid credentials'",
            a: "Enter your full phone number (with leading 0, e.g. 08123456789) and your password (date of birth for first login, or your changed password). Contact your admin if you need your credentials reset.",
          },
          {
            q: "My document won't upload",
            a: "Only PDF files are accepted. Make sure the file size is reasonable (under 10MB). If the problem persists, check your internet connection and try again.",
          },
          {
            q: "An image is not showing on the landing page",
            a: "Images are stored in AWS S3. If an image isn't loading, it may not have been uploaded correctly. Go to the relevant management section and re-upload the image.",
          },
          {
            q: "My change request is stuck in PENDING",
            a: "Change requests need approval from Admin → Secretary → Chairman. Check with your Admin, Secretary, or Chairman to see if the request has been reviewed. If it's been more than 24 hours, the Admin can no longer correct it — it must go through the full approval chain.",
          },
          {
            q: "I need to replace a document but the button is disabled",
            a: "Documents can only be replaced within the configured time window (default: 30 minutes). After that, you must submit a change request for approval. The Chairman can adjust this window in System Settings.",
          },
          {
            q: "How do I add a new LGA",
            a: "Currently, the 18 LGAs are pre-configured. If you need to add or modify an LGA, contact your system administrator or developer.",
          },
          {
            q: "Can I export staff data?",
            a: "Currently, staff data is viewable in the dashboard table. Export functionality can be added as a feature enhancement. Contact your developer.",
          },
          {
            q: "How do I change my password?",
            a: "When you first log in (or after an admin/chairman resets your password), you'll be prompted to set a new password. Your initial password is your date of birth. Admins and Chairmen can reset passwords — contact them if you need a reset.",
          },
        ].map((item, i) => (
          <details key={i} className="group border border-border rounded-xl overflow-hidden">
            <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors">
              <span className="font-medium pr-4">{item.q}</span>
              <ChevronDown className="w-5 h-5 text-muted-foreground group-open:rotate-180 transition-transform shrink-0" />
            </summary>
            <div className="px-4 pb-4 text-muted-foreground text-sm leading-relaxed">
              {item.a}
            </div>
          </details>
        ))}
      </div>
    ),
  },
]

export default function HelpPage() {
  const [search, setSearch] = useState("")
  const [activeSection, setActiveSection] = useState("getting-started")

  const filteredSections = sections.filter(
    (s) =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      JSON.stringify(s.content).toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm hidden sm:inline">Back to Home</span>
              </Link>
              <div className="h-6 w-px bg-border" />
              <h1 className="text-lg font-bold">Help &amp; Documentation</h1>
            </div>
            <Link href="/login">
              <button className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors">
                Login
              </button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-72 shrink-0">
            <div className="lg:sticky lg:top-24 space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search documentation..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Nav Links */}
              <nav className="space-y-1">
                {filteredSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      activeSection === section.id
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {section.icon}
                    {section.title}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Content */}
          <main className="flex-1 min-w-0">
            {filteredSections.map((section) => (
              <motion.div
                key={section.id}
                id={section.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: activeSection === section.id ? 1 : 0.3, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`${activeSection === section.id ? "block" : "hidden"} mb-12`}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    {section.icon}
                  </div>
                  <h2 className="text-2xl font-bold">{section.title}</h2>
                </div>
                <div className="prose prose-neutral max-w-none">{section.content}</div>
              </motion.div>
            ))}
          </main>
        </div>
      </div>
    </div>
  )
}
