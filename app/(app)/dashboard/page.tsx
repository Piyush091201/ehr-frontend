"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { DashboardStats, Appointment } from "@/lib/types";
import { StatusBadge } from "@/components/ui";

const cards = [
  { key: "totalPatients", label: "Total Patients", icon: "👥", color: "bg-teal-50 text-teal-700" },
  { key: "upcomingAppointments", label: "Upcoming Appointments", icon: "📅", color: "bg-sky-50 text-sky-700" },
  { key: "totalAppointments", label: "All Appointments", icon: "🗓", color: "bg-indigo-50 text-indigo-700" },
  { key: "totalRecords", label: "Medical Records", icon: "📋", color: "bg-amber-50 text-amber-700" },
] as const;

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [upcoming, setUpcoming] = useState<Appointment[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      apiFetch<DashboardStats>("/api/dashboard/stats"),
      apiFetch<Appointment[]>("/api/appointments"),
    ])
      .then(([s, a]) => {
        setStats(s);
        setUpcoming(a.filter((x) => x.status === "Scheduled").slice(0, 5));
      })
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Welcome back, {user?.fullName.split(" ")[0]} 👋
        </h1>
        <p className="text-sm text-slate-500">Here is what is happening in your clinic today.</p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.key} className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg text-xl ${c.color}`}>
              {c.icon}
            </div>
            <div className="text-3xl font-bold text-slate-800">
              {stats ? stats[c.key] : "—"}
            </div>
            <div className="text-sm text-slate-500">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-800">Upcoming Appointments</h2>
          <Link href="/appointments" className="text-sm font-medium text-teal-600 hover:underline">
            View all →
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-400">No upcoming appointments.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {upcoming.map((a) => (
              <li key={a.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <div className="font-medium text-slate-800">{a.patientName}</div>
                  <div className="text-xs text-slate-500">
                    {a.doctorName} · {new Date(a.scheduledAt).toLocaleString()}
                  </div>
                </div>
                <StatusBadge status={a.status} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
