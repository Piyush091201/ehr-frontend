"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { Appointment, Patient, AppointmentStatus } from "@/lib/types";
import Modal from "@/components/Modal";
import { Field, inputClass, StatusBadge, EmptyState } from "@/components/ui";

const statuses: AppointmentStatus[] = ["Scheduled", "Completed", "Cancelled", "NoShow"];

const emptyForm = {
  patientId: 0,
  doctorName: "",
  scheduledAt: "",
  reason: "",
  status: "Scheduled" as AppointmentStatus,
};

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, p] = await Promise.all([
        apiFetch<Appointment[]>("/api/appointments"),
        apiFetch<Patient[]>("/api/patients"),
      ]);
      setAppointments(a);
      setPatients(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditId(null);
    setForm({ ...emptyForm, patientId: patients[0]?.id ?? 0 });
    setError(null);
    setOpen(true);
  }

  function openEdit(a: Appointment) {
    setEditId(a.id);
    setForm({
      patientId: a.patientId,
      doctorName: a.doctorName,
      scheduledAt: a.scheduledAt.slice(0, 16),
      reason: a.reason ?? "",
      status: a.status,
    });
    setError(null);
    setOpen(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...form,
        patientId: Number(form.patientId),
        scheduledAt: new Date(form.scheduledAt).toISOString(),
      };
      if (editId) {
        await apiFetch(`/api/appointments/${editId}`, { method: "PUT", body: payload });
      } else {
        await apiFetch("/api/appointments", { method: "POST", body: payload });
      }
      setOpen(false);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    if (!confirm("Delete this appointment?")) return;
    try {
      await apiFetch(`/api/appointments/${id}`, { method: "DELETE" });
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to delete");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Appointments</h1>
          <p className="text-sm text-slate-500">Schedule and track patient appointments.</p>
        </div>
        <button
          onClick={openCreate}
          disabled={patients.length === 0}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-50"
        >
          + New Appointment
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : appointments.length === 0 ? (
        <EmptyState message="No appointments scheduled." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Patient</th>
                <th className="px-5 py-3">Doctor</th>
                <th className="px-5 py-3">When</th>
                <th className="px-5 py-3">Reason</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {appointments.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-800">{a.patientName}</td>
                  <td className="px-5 py-3 text-slate-600">{a.doctorName}</td>
                  <td className="px-5 py-3 text-slate-600">{new Date(a.scheduledAt).toLocaleString()}</td>
                  <td className="px-5 py-3 text-slate-600">{a.reason || "—"}</td>
                  <td className="px-5 py-3"><StatusBadge status={a.status} /></td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => openEdit(a)} className="mr-3 text-sm text-slate-500 hover:text-teal-600">
                      Edit
                    </button>
                    <button onClick={() => remove(a.id)} className="text-sm text-slate-500 hover:text-red-600">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={open} title={editId ? "Edit Appointment" : "New Appointment"} onClose={() => setOpen(false)}>
        <form onSubmit={save} className="space-y-4">
          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          <Field label="Patient">
            <select required value={form.patientId} onChange={(e) => setForm({ ...form, patientId: Number(e.target.value) })} className={inputClass}>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Doctor">
              <input required value={form.doctorName} onChange={(e) => setForm({ ...form, doctorName: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Date & time">
              <input type="datetime-local" required value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} className={inputClass} />
            </Field>
          </div>
          <Field label="Reason">
            <input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Status">
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as AppointmentStatus })} className={inputClass}>
              {statuses.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60">
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
