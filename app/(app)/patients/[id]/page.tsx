"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Patient, MedicalRecord, Appointment } from "@/lib/types";
import Modal from "@/components/Modal";
import { Field, inputClass, StatusBadge, EmptyState } from "@/components/ui";

const emptyRecord = {
  doctorName: "",
  recordDate: new Date().toISOString().slice(0, 10),
  diagnosis: "",
  treatment: "",
  prescription: "",
  notes: "",
};

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const canEditRecords = user?.role === "Admin" || user?.role === "Doctor";

  const [patient, setPatient] = useState<Patient | null>(null);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...emptyRecord });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [p, r, a] = await Promise.all([
        apiFetch<Patient>(`/api/patients/${id}`),
        apiFetch<MedicalRecord[]>(`/api/medicalrecords?patientId=${id}`),
        apiFetch<Appointment[]>(`/api/appointments?patientId=${id}`),
      ]);
      setPatient(p);
      setRecords(r);
      setAppointments(a);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load patient");
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  function openRecord() {
    setForm({ ...emptyRecord, doctorName: user?.fullName ?? "" });
    setError(null);
    setOpen(true);
  }

  async function saveRecord(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiFetch("/api/medicalrecords", {
        method: "POST",
        body: {
          patientId: Number(id),
          ...form,
          recordDate: new Date(form.recordDate).toISOString(),
        },
      });
      setOpen(false);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save record");
    } finally {
      setSaving(false);
    }
  }

  if (error && !patient) {
    return <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>;
  }
  if (!patient) return <p className="text-sm text-slate-400">Loading…</p>;

  return (
    <div className="space-y-6">
      <Link href="/patients" className="text-sm text-teal-600 hover:underline">
        ← Back to patients
      </Link>

      <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-100 text-xl font-bold text-teal-700">
            {patient.firstName[0]}
            {patient.lastName[0]}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-800">
              {patient.firstName} {patient.lastName}
            </h1>
            <p className="text-sm text-slate-500">
              {patient.gender} · DOB {new Date(patient.dateOfBirth).toLocaleDateString()}
            </p>
          </div>
        </div>
        <dl className="mt-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-slate-400">Blood group</dt>
            <dd className="font-medium text-slate-700">{patient.bloodGroup || "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Phone</dt>
            <dd className="font-medium text-slate-700">{patient.phone || "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Email</dt>
            <dd className="font-medium text-slate-700">{patient.email || "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Address</dt>
            <dd className="font-medium text-slate-700">{patient.address || "—"}</dd>
          </div>
        </dl>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-800">Medical Records</h2>
            {canEditRecords && (
              <button onClick={openRecord} className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700">
                + Add record
              </button>
            )}
          </div>
          <div className="space-y-3 p-5">
            {records.length === 0 ? (
              <EmptyState message="No medical records yet." />
            ) : (
              records.map((r) => (
                <div key={r.id} className="rounded-lg border border-slate-100 p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-800">{r.diagnosis}</span>
                    <span className="text-xs text-slate-400">{new Date(r.recordDate).toLocaleDateString()}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">By {r.doctorName}</p>
                  {r.treatment && <p className="mt-2 text-sm text-slate-600"><b>Treatment:</b> {r.treatment}</p>}
                  {r.prescription && <p className="text-sm text-slate-600"><b>Rx:</b> {r.prescription}</p>}
                  {r.notes && <p className="text-sm text-slate-600"><b>Notes:</b> {r.notes}</p>}
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-xl border border-slate-100 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-800">Appointments</h2>
          </div>
          <div className="p-5">
            {appointments.length === 0 ? (
              <EmptyState message="No appointments." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {appointments.map((a) => (
                  <li key={a.id} className="flex items-center justify-between py-3">
                    <div>
                      <div className="text-sm font-medium text-slate-800">{a.doctorName}</div>
                      <div className="text-xs text-slate-500">{new Date(a.scheduledAt).toLocaleString()}</div>
                    </div>
                    <StatusBadge status={a.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      <Modal open={open} title="Add Medical Record" onClose={() => setOpen(false)}>
        <form onSubmit={saveRecord} className="space-y-4">
          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Doctor">
              <input required value={form.doctorName} onChange={(e) => setForm({ ...form, doctorName: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Date">
              <input type="date" required value={form.recordDate} onChange={(e) => setForm({ ...form, recordDate: e.target.value })} className={inputClass} />
            </Field>
          </div>
          <Field label="Diagnosis">
            <input required value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Treatment">
            <input value={form.treatment} onChange={(e) => setForm({ ...form, treatment: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Prescription">
            <input value={form.prescription} onChange={(e) => setForm({ ...form, prescription: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Notes">
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputClass} rows={2} />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60">
              {saving ? "Saving…" : "Save record"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
