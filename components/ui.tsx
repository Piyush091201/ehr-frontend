import { ReactNode } from "react";

/* ---------- formatting helpers ---------- */

export function formatMoney(amount: number): string {
  return "₹" + amount.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export function age(dob: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(dob).getTime()) / 31557600000));
}

/* ---------- badges ---------- */

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Scheduled: "bg-sky-100 text-sky-700",
    CheckedIn: "bg-indigo-100 text-indigo-700",
    Completed: "bg-green-100 text-green-700",
    Cancelled: "bg-red-100 text-red-700",
    Pending: "bg-amber-100 text-amber-700",
    PartiallyPaid: "bg-orange-100 text-orange-700",
    Paid: "bg-green-100 text-green-700",
  };
  const label = status === "CheckedIn" ? "Checked In" : status === "PartiallyPaid" ? "Partially Paid" : status;
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] ?? "bg-slate-100 text-slate-600"}`}>
      {label}
    </span>
  );
}

export function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    Admin: "bg-purple-100 text-purple-700",
    Doctor: "bg-teal-100 text-teal-700",
    Receptionist: "bg-slate-100 text-slate-600",
    Patient: "bg-sky-100 text-sky-700",
  };
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[role] ?? "bg-slate-100 text-slate-600"}`}>
      {role}
    </span>
  );
}

/* ---------- form helpers ---------- */

const inputBase =
  "w-full rounded-lg border px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 transition";

export function inputClass(hasError?: boolean): string {
  return (
    inputBase +
    (hasError
      ? " border-red-400 focus:border-red-500 focus:ring-red-200"
      : " border-slate-300 focus:border-teal-500 focus:ring-teal-200")
  );
}

export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs font-medium text-red-600">{error}</span>}
    </label>
  );
}

/* ---------- misc ---------- */

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-white py-12 text-center text-sm text-slate-400">
      {message}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-slate-100 bg-white shadow-sm ${className}`}>{children}</div>
  );
}

export function StatCard({
  icon,
  value,
  label,
  color,
}: {
  icon: string;
  value: ReactNode;
  label: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg text-xl ${color}`}>
        {icon}
      </div>
      <div className="text-3xl font-bold text-slate-800">{value}</div>
      <div className="text-sm text-slate-500">{label}</div>
    </div>
  );
}
