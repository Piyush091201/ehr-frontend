"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { DashboardStats, Appointment } from "@/lib/types";
import { StatCard, StatusBadge, Card, formatDateTime } from "@/components/ui";

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      apiFetch<DashboardStats>("/api/dashboard/stats"),
      apiFetch<Appointment[]>("/api/appointments"),
    ])
      .then(([s, a]) => {
        setStats(s);
        setAppointments(a);
      })
      .catch((e) => setError(e.message));
  }, []);

  const isDoctor = user?.role === "Doctor";

  const cards = isDoctor
    ? [
        { icon: "📅", label: "Today's Appointments", value: stats?.todaysAppointments, color: "bg-sky-50 text-sky-700" },
        { icon: "🚪", label: "Checked In", value: stats?.checkedIn, color: "bg-indigo-50 text-indigo-700" },
        { icon: "📋", label: "My Consultations", value: stats?.consultations, color: "bg-teal-50 text-teal-700" },
        { icon: "👥", label: "Total Patients", value: stats?.totalPatients, color: "bg-amber-50 text-amber-700" },
      ]
    : [
        { icon: "👥", label: "Total Patients", value: stats?.totalPatients, color: "bg-teal-50 text-teal-700" },
        { icon: "📅", label: "Today's Appointments", value: stats?.todaysAppointments, color: "bg-sky-50 text-sky-700" },
        { icon: "🚪", label: "Checked In", value: stats?.checkedIn, color: "bg-indigo-50 text-indigo-700" },
        { icon: "🧾", label: "Pending Invoices", value: stats?.pendingInvoices, color: "bg-amber-50 text-amber-700" },
      ];

  const queue = isDoctor
    ? appointments.filter((a) => a.status === "CheckedIn" || a.status === "Scheduled").slice(0, 6)
    : appointments.filter((a) => a.status !== "Cancelled" && a.status !== "Completed").slice(0, 6);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Welcome back, {user?.fullName.split(" ").slice(-1)[0]} 👋
        </h1>
        <p className="text-sm text-slate-500">
          {isDoctor ? "Your clinic activity at a glance." : "Here is what is happening in your clinic today."}
        </p>
      </div>

      {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <StatCard key={c.label} icon={c.icon} label={c.label} value={c.value ?? "—"} color={c.color} />
        ))}
      </div>

      <Card>
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-800">
            {isDoctor ? "My Patient Queue" : "Active Appointments"}
          </h2>
          <Link href="/appointments" className="text-sm font-medium text-teal-600 hover:underline">
            View all →
          </Link>
        </div>
        {queue.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-400">Nothing scheduled right now.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {queue.map((a) => (
              <li key={a.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <div className="font-medium text-slate-800">{a.patientName}</div>
                  <div className="text-xs text-slate-500">
                    {a.doctorName} · {formatDateTime(a.scheduledAt)}
                  </div>
                </div>
                <StatusBadge status={a.status} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
