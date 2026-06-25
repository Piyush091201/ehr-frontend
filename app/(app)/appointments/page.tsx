"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, ApiError, FieldErrors } from "@/lib/api";
import type { Appointment, Patient, Doctor, AppointmentStatus } from "@/lib/types";
import Modal from "@/components/Modal";
import { Field, inputClass, StatusBadge, EmptyState, Card, formatDateTime } from "@/components/ui";

const emptyForm = {
  patientId: 0,
  doctorId: 0,
  scheduledAt: "",
  reason: "",
};

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Reschedule modal
  const [reschedId, setReschedId] = useState<number | null>(null);
  const [reschedAt, setReschedAt] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, p, d] = await Promise.all([
        apiFetch<Appointment[]>("/api/appointments"),
        apiFetch<Patient[]>("/api/patients"),
        apiFetch<Doctor[]>("/api/doctors"),
      ]);
      setAppointments(a);
      setPatients(p);
      setDoctors(d);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditId(null);
    setForm({ ...emptyForm, patientId: patients[0]?.id ?? 0, doctorId: doctors[0]?.id ?? 0 });
    setErrors({});
    setFormError(null);
    setOpen(true);
  }

  function openEdit(a: Appointment) {
    setEditId(a.id);
    setForm({
      patientId: a.patientId,
      doctorId: a.doctorId ?? 0,
      scheduledAt: a.scheduledAt.slice(0, 16),
      reason: a.reason ?? "",
    });
    setErrors({});
    setFormError(null);
    setOpen(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    setFormError(null);
    try {
      const doctor = doctors.find((d) => d.id === Number(form.doctorId));
      const payload = {
        patientId: Number(form.patientId),
        doctorId: Number(form.doctorId) || null,
        doctorName: doctor?.name ?? "",
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        reason: form.reason,
        status: "Scheduled" as AppointmentStatus,
      };
      if (editId) await apiFetch(`/api/appointments/${editId}`, { method: "PUT", body: payload });
      else await apiFetch("/api/appointments", { method: "POST", body: payload });
      setOpen(false);
      load();
    } catch (e) {
      if (e instanceof ApiError) {
        setErrors(e.fieldErrors);
        if (!Object.keys(e.fieldErrors).length) setFormError(e.message);
      } else setFormError("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(id: number, status: AppointmentStatus) {
    try {
      await apiFetch(`/api/appointments/${id}/status`, { method: "PATCH", body: { status } });
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Appointments</h1>
          <p className="text-sm text-slate-500">Book, assign, and track patient appointments.</p>
        </div>
        <button onClick={openCreate} disabled={patients.length === 0} className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-50">
          + Book Appointment
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : appointments.length === 0 ? (
        <EmptyState message="No appointments scheduled." />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Patient</th><th className="px-5 py-3">Doctor</th>
                <th className="px-5 py-3">When</th><th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {appointments.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-800">{a.patientName}</td>
                  <td className="px-5 py-3 text-slate-600">{a.doctorName}</td>
                  <td className="px-5 py-3 text-slate-600">{formatDateTime(a.scheduledAt)}</td>
                  <td className="px-5 py-3"><StatusBadge status={a.status} /></td>
                  <td className="px-5 py-3 text-right whitespace-nowrap">
                    {a.status === "Scheduled" && (
                      <button onClick={() => setStatus(a.id, "CheckedIn")} className="mr-2 text-xs font-medium text-indigo-600 hover:underline">Check in</button>
                    )}
                    {a.status === "CheckedIn" && (
                      <button onClick={() => setStatus(a.id, "Completed")} className="mr-2 text-xs font-medium text-green-600 hover:underline">Complete</button>
                    )}
                    <button onClick={() => { setReschedId(a.id); setReschedAt(a.scheduledAt.slice(0, 16)); }} className="mr-2 text-xs text-slate-500 hover:text-teal-600">Reschedule</button>
                    <button onClick={() => openEdit(a)} className="mr-2 text-xs text-slate-500 hover:text-teal-600">Edit</button>
                    {a.status !== "Cancelled" && a.status !== "Completed" && (
                      <button onClick={() => setStatus(a.id, "Cancelled")} className="text-xs text-slate-500 hover:text-red-600">Cancel</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Modal open={open} title={editId ? "Edit Appointment" : "Book Appointment"} onClose={() => setOpen(false)}>
        <form onSubmit={save} className="space-y-4" noValidate>
          {formError && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</div>}
          <Field label="Patient" error={errors.patientId?.[0]}>
            <select value={form.patientId} onChange={(e) => setForm({ ...form, patientId: Number(e.target.value) })} className={inputClass(!!errors.patientId)}>
              {patients.map((p) => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
            </select>
          </Field>
          <Field label="Assign doctor" error={errors.doctorName?.[0]}>
            <select value={form.doctorId} onChange={(e) => setForm({ ...form, doctorId: Number(e.target.value) })} className={inputClass(!!errors.doctorName)}>
              <option value={0}>— Select doctor —</option>
              {doctors.map((d) => <option key={d.id} value={d.id}>{d.name}{d.specialty ? ` (${d.specialty})` : ""}</option>)}
            </select>
          </Field>
          <Field label="Date & time" error={errors.scheduledAt?.[0]}>
            <input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} className={inputClass(!!errors.scheduledAt)} />
          </Field>
          <Field label="Reason">
            <input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className={inputClass()} />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60">{saving ? "Saving…" : "Save"}</button>
          </div>
        </form>
      </Modal>

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
