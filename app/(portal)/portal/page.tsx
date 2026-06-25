"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { DashboardStats, Appointment, Prescription, Invoice } from "@/lib/types";
import { StatCard, StatusBadge, Card, formatDate, formatDateTime, formatMoney } from "@/components/ui";

export default function PortalDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      apiFetch<DashboardStats>("/api/dashboard/stats"),
      apiFetch<Appointment[]>("/api/appointments"),
      apiFetch<Prescription[]>("/api/prescriptions"),
      apiFetch<Invoice[]>("/api/invoices"),
    ])
      .then(([s, a, p, i]) => {
        setStats(s);
        setAppointments(a);
        setPrescriptions(p);
        setInvoices(i);
      })
      .catch((e) => setError(e.message));
  }, []);

  const upcoming = appointments
    .filter((a) => a.status === "Scheduled" || a.status === "CheckedIn")
    .slice(0, 4);
  const outstanding = invoices.filter((i) => i.status !== "Paid");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Hello, {user?.fullName.split(" ")[0]} 👋</h1>
        <p className="text-sm text-slate-500">Welcome to your health portal.</p>
      </div>

      {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon="📅" label="Upcoming Appointments" value={stats?.upcomingAppointments ?? "—"} color="bg-sky-50 text-sky-700" />
        <StatCard icon="💊" label="Prescriptions" value={stats?.prescriptions ?? "—"} color="bg-teal-50 text-teal-700" />
        <StatCard icon="📋" label="Past Visits" value={stats?.visits ?? "—"} color="bg-indigo-50 text-indigo-700" />
        <StatCard icon="🧾" label="Outstanding Bills" value={stats?.outstandingBills ?? "—"} color="bg-amber-50 text-amber-700" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <SectionHeader title="Upcoming Appointments" href="/portal/appointments" />
          {upcoming.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-400">No upcoming appointments.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {upcoming.map((a) => (
                <li key={a.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <div className="font-medium text-slate-800">{a.doctorName}</div>
                    <div className="text-xs text-slate-500">{formatDateTime(a.scheduledAt)}</div>
                  </div>
                  <StatusBadge status={a.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <SectionHeader title="Recent Prescriptions" href="/portal/prescriptions" />
          {prescriptions.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-400">No prescriptions.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {prescriptions.slice(0, 4).map((p) => (
                <li key={p.id} className="px-5 py-3">
                  <div className="font-medium text-slate-800">💊 {p.medicine}</div>
                  <div className="text-xs text-slate-500">
                    {[p.frequency, p.duration].filter(Boolean).join(" · ")} — {formatDate(p.issuedDate)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {outstanding.length > 0 && (
        <Card>
          <SectionHeader title="Outstanding Bills" href="/portal/invoices" />
          <ul className="divide-y divide-slate-100">
            {outstanding.map((i) => (
              <li key={i.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <div className="font-medium text-slate-800">{i.invoiceNumber}</div>
                  <div className="text-xs text-slate-500">Balance {formatMoney(i.balance)}</div>
                </div>
                <StatusBadge status={i.status} />
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

function SectionHeader({ title, href }: { title: string; href: string }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
      <h2 className="font-semibold text-slate-800">{title}</h2>
      <Link href={href} className="text-sm font-medium text-teal-600 hover:underline">View all →</Link>
    </div>
  );
}
