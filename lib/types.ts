export type Role = "Admin" | "Doctor" | "Receptionist" | "Patient";

export interface UserInfo {
  id: number;
  fullName: string;
  email: string;
  role: Role;
  patientId?: number | null;
}

export interface AuthResponse {
  token: string;
  expiresAt: string;
  user: UserInfo;
}

export interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  createdAt: string;
}

export interface Doctor {
  id: number;
  name: string;
  specialty?: string | null;
}

export type AppointmentStatus = "Scheduled" | "CheckedIn" | "Completed" | "Cancelled";

export interface Appointment {
  id: number;
  patientId: number;
  patientName: string;
  doctorId?: number | null;
  doctorName: string;
  scheduledAt: string;
  reason?: string | null;
  status: AppointmentStatus;
}

export interface Prescription {
  id: number;
  patientId: number;
  patientName: string;
  consultationId?: number | null;
  doctorName: string;
  issuedDate: string;
  medicine: string;
  dosage?: string | null;
  frequency?: string | null;
  duration?: string | null;
  instructions?: string | null;
}

export interface Consultation {
  id: number;
  patientId: number;
  patientName: string;
  appointmentId?: number | null;
  doctorName: string;
  visitDate: string;
  symptoms?: string | null;
  diagnosis: string;
  treatmentNotes?: string | null;
  prescriptions: Prescription[];
}

export type InvoiceStatus = "Pending" | "PartiallyPaid" | "Paid";

export interface InvoiceItem {
  id: number;
  description: string;
  amount: number;
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  patientId: number;
  patientName: string;
  issuedDate: string;
  status: InvoiceStatus;
  total: number;
  amountPaid: number;
  balance: number;
  notes?: string | null;
  items: InvoiceItem[];
}

/** Role-aware dashboard stats (only some fields present per role). */
export interface DashboardStats {
  role: Role;
  totalPatients?: number;
  todaysAppointments?: number;
  checkedIn?: number;
  pendingInvoices?: number;
  consultations?: number;
  upcomingAppointments?: number;
  prescriptions?: number;
  visits?: number;
  outstandingBills?: number;
}
