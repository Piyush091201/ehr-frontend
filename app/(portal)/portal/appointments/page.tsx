"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { Appointment } from "@/lib/types";
import Modal from "@/components/Modal";
import { Field, inputClass, StatusBadge, EmptyState, Card, formatDateTime } from "@/components/ui";

export default function MyAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [reschedId, setReschedId] = useState<number | null>(null);
  const [reschedAt, setReschedAt] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setAppointments(await apiFetch<Appointment[]>("/api/appointments"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function cancel(id: number) {
    if (!confirm("Cancel this appointment?")) return;
    try {
      await apiFetch(`/api/appointments/${id}/cancel`, { method: "PATCH" });
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
    }
  }

  async function doReschedule(e: React.FormEvent) {
    e.preventDefault();
    if (!reschedId) return;
    try {
      await apiFetch(`/api/appointments/${reschedId}/reschedule`, {
        method: "PATCH",
        body: { scheduledAt: new Date(reschedAt).toISOString() },
      });
      setReschedId(null);
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">My Appointments</h1>
        <p className="text-sm text-slate-500">View, reschedule, or cancel your appointments.</p>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : appointments.length === 0 ? (
        <EmptyState message="You have no appointments." />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Date &amp; Time</th><th className="px-5 py-3">Doctor</th>
                <th className="px-5 py-3">Reason</th><th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {appointments.map((a) => {
                const active = a.status === "Scheduled" || a.status === "CheckedIn";
                return (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 text-slate-700">{formatDateTime(a.scheduledAt)}</td>
                    <td className="px-5 py-3 text-slate-600">{a.doctorName}</td>
                    <td className="px-5 py-3 text-slate-600">{a.reason || "—"}</td>
                    <td className="px-5 py-3"><StatusBadge status={a.status} /></td>
                    <td className="px-5 py-3 text-right whitespace-nowrap">
                      {active ? (
                        <>
                          <button onClick={() => { setReschedId(a.id); setReschedAt(a.scheduledAt.slice(0, 16)); }} className="mr-3 text-xs text-slate-500 hover:text-teal-600">Reschedule</button>
                          <button onClick={() => cancel(a.id)} className="text-xs text-slate-500 hover:text-red-600">Cancel</button>
                        </>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      <Modal open={reschedId !== null} title="Reschedule Appointment" onClose={() => setReschedId(null)}>
        <form onSubmit={doReschedule} className="space-y-4">
          <Field label="New date & time">
            <input type="datetime-local" required value={reschedAt} onChange={(e) => setReschedAt(e.target.value)} className={inputClass()} />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setReschedId(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
            <button type="submit" className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700">Reschedule</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
