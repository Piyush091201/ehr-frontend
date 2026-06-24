export type Role = "Admin" | "Doctor" | "Receptionist";

export interface UserInfo {
  id: number;
  fullName: string;
  email: string;
  role: Role;
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

export type AppointmentStatus = "Scheduled" | "Completed" | "Cancelled" | "NoShow";

export interface Appointment {
  id: number;
  patientId: number;
  patientName: string;
  doctorName: string;
  scheduledAt: string;
  reason?: string | null;
  status: AppointmentStatus;
}

export interface MedicalRecord {
  id: number;
  patientId: number;
  patientName: string;
  doctorName: string;
  recordDate: string;
  diagnosis: string;
  treatment?: string | null;
  prescription?: string | null;
  notes?: string | null;
}

export interface DashboardStats {
  totalPatients: number;
  totalAppointments: number;
  upcomingAppointments: number;
  totalRecords: number;
}
