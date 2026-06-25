"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiFetch, apiDownload, ApiError, FieldErrors } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Patient, Consultation, Appointment, Prescription, Invoice } from "@/lib/types";
import Modal from "@/components/Modal";
import {
  Field, inputClass, StatusBadge, EmptyState, Card, formatDate, formatDateTime, formatMoney, age,
} from "@/components/ui";

type Tab = "overview" | "history" | "prescriptions" | "invoices";

const emptyRx = { medicine: "", dosage: "", frequency: "", duration: "", instructions: "" };
const emptyConsult = {
  visitDate: new Date().toISOString().slice(0, 10),
  symptoms: "",
  diagnosis: "",
  treatmentNotes: "",
};

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const canConsult = user?.role === "Admin" || user?.role === "Doctor";

  const [tab, setTab] = useState<Tab>("overview");
  const [patient, setPatient] = useState<Patient | null>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...emptyConsult });
  const [rxLines, setRxLines] = useState([{ ...emptyRx }]);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [p, c, a, rx, inv] = await Promise.all([
        apiFetch<Patient>(`/api/patients/${id}`),
        apiFetch<Consultation[]>(`/api/consultations?patientId=${id}`),
        apiFetch<Appointment[]>(`/api/appointments?patientId=${id}`),
        apiFetch<Prescription[]>(`/api/prescriptions?patientId=${id}`),
        apiFetch<Invoice[]>(`/api/invoices?patientId=${id}`),
      ]);
      setPatient(p);
      setConsultations(c);
      setAppointments(a);
      setPrescriptions(rx);
      setInvoices(inv);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load patient");
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  function openConsult() {
    setForm({ ...emptyConsult });
    setRxLines([{ ...emptyRx }]);
    setErrors({});
    setFormError(null);
    setOpen(true);
  }

  async function saveConsult(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    setFormError(null);
    try {
      await apiFetch("/api/consultations", {
        method: "POST",
        body: {
          patientId: Number(id),
          visitDate: new Date(form.visitDate).toISOString(),
          symptoms: form.symptoms,
          diagnosis: form.diagnosis,
          treatmentNotes: form.treatmentNotes,
          prescriptions: rxLines.filter((r) => r.medicine.trim()),
        },
      });
      setOpen(false);
      setTab("history");
      load();
    } catch (e) {
      if (e instanceof ApiError) {
        setErrors(e.fieldErrors);
        if (!Object.keys(e.fieldErrors).length) setFormError(e.message);
      } else setFormError("Failed to save consultation");
    } finally {
      setSaving(false);
    }
  }

  async function downloadInvoice(inv: Invoice) {
    try {
      await apiDownload(`/api/invoices/${inv.id}/pdf`, `${inv.invoiceNumber}.pdf`);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to download");
    }
  }

  if (error && !patient) return <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>;
  if (!patient) return <p className="text-sm text-slate-400">Loading…</p>;

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "history", label: `Medical History (${consultations.length})` },
    { key: "prescriptions", label: `Prescriptions (${prescriptions.length})` },
    { key: "invoices", label: `Invoices (${invoices.length})` },
  ];

  return (
    <div className="space-y-6">
      <Link href="/patients" className="text-sm text-teal-600 hover:underline">← Back to patients</Link>

      <Card className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-100 text-xl font-bold text-teal-700">
              {patient.firstName[0]}{patient.lastName[0]}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{patient.firstName} {patient.lastName}</h1>
              <p className="text-sm text-slate-500">
                {age(patient.dateOfBirth)} yrs · {patient.gender} · {patient.bloodGroup || "—"}
              </p>
            </div>
          </div>
          {canConsult && (
            <button onClick={openConsult} className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700">
              + Record Consultation
            </button>
          )}
        </div>
      </Card>

      <div className="flex flex-wrap gap-1 border-b border-slate-200">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition ${
              tab === t.key ? "border-teal-600 text-teal-700" : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-5">
            <h2 className="mb-4 font-semibold text-slate-800">Personal Information</h2>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <Info label="Date of birth" value={formatDate(patient.dateOfBirth)} />
              <Info label="Gender" value={patient.gender} />
              <Info label="Blood group" value={patient.bloodGroup || "—"} />
              <Info label="Phone" value={patient.phone || "—"} />
              <Info label="Email" value={patient.email || "—"} />
              <Info label="Address" value={patient.address || "—"} />
            </dl>
          </Card>
          <Card>
            <div className="border-b border-slate-100 px-5 py-4"><h2 className="font-semibold text-slate-800">Appointments</h2></div>
            <div className="p-5">
              {appointments.length === 0 ? <EmptyState message="No appointments." /> : (
                <ul className="divide-y divide-slate-100">
                  {appointments.map((a) => (
                    <li key={a.id} className="flex items-center justify-between py-3">
                      <div>
                        <div className="text-sm font-medium text-slate-800">{a.doctorName}</div>
                        <div className="text-xs text-slate-500">{formatDateTime(a.scheduledAt)}</div>
                      </div>
                      <StatusBadge status={a.status} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>
        </div>
      )}

      {tab === "history" && (
        <div className="space-y-4">
          {consultations.length === 0 ? <EmptyState message="No consultations recorded yet." /> : (
            consultations.map((c) => (
              <Card key={c.id} className="p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-800">{c.diagnosis}</h3>
                  <span className="text-xs text-slate-400">{formatDate(c.visitDate)}</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">By {c.doctorName}</p>
                {c.symptoms && <p className="mt-2 text-sm text-slate-600"><b>Symptoms:</b> {c.symptoms}</p>}
                {c.treatmentNotes && <p className="text-sm text-slate-600"><b>Treatment:</b> {c.treatmentNotes}</p>}
                {c.prescriptions.length > 0 && (
                  <div className="mt-3 rounded-lg bg-slate-50 p-3">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Prescriptions</p>
                    <ul className="space-y-1 text-sm text-slate-700">
                      {c.prescriptions.map((p) => (
                        <li key={p.id}>💊 {p.medicine} — {[p.dosage, p.frequency, p.duration].filter(Boolean).join(", ")}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      )}

      {tab === "prescriptions" && (
        <Card className="overflow-hidden">
          {prescriptions.length === 0 ? <EmptyState message="No prescriptions." /> : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Date</th><th className="px-5 py-3">Medicine</th>
                  <th className="px-5 py-3">Dosage</th><th className="px-5 py-3">Frequency</th>
                  <th className="px-5 py-3">Duration</th><th className="px-5 py-3">Doctor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {prescriptions.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 text-slate-500">{formatDate(p.issuedDate)}</td>
                    <td className="px-5 py-3 font-medium text-slate-800">{p.medicine}</td>
                    <td className="px-5 py-3 text-slate-600">{p.dosage || "—"}</td>
                    <td className="px-5 py-3 text-slate-600">{p.frequency || "—"}</td>
                    <td className="px-5 py-3 text-slate-600">{p.duration || "—"}</td>
                    <td className="px-5 py-3 text-slate-600">{p.doctorName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      {tab === "invoices" && (
        <Card className="overflow-hidden">
          {invoices.length === 0 ? <EmptyState message="No invoices." /> : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Invoice</th><th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Total</th><th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-800">{inv.invoiceNumber}</td>
                    <td className="px-5 py-3 text-slate-500">{formatDate(inv.issuedDate)}</td>
                    <td className="px-5 py-3 text-slate-700">{formatMoney(inv.total)}</td>
                    <td className="px-5 py-3"><StatusBadge status={inv.status} /></td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => downloadInvoice(inv)} className="text-sm font-medium text-teal-600 hover:underline">Download</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      <Modal open={open} title="Record Consultation" onClose={() => setOpen(false)}>
        <form onSubmit={saveConsult} className="space-y-4" noValidate>
          {formError && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</div>}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Visit date">
              <input type="date" value={form.visitDate} onChange={(e) => setForm({ ...form, visitDate: e.target.value })} className={inputClass()} />
            </Field>
            <Field label="Diagnosis" error={errors.diagnosis?.[0]}>
              <input value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} className={inputClass(!!errors.diagnosis)} />
            </Field>
          </div>
          <Field label="Symptoms">
            <textarea value={form.symptoms} onChange={(e) => setForm({ ...form, symptoms: e.target.value })} className={inputClass()} rows={2} />
          </Field>
          <Field label="Treatment notes">
            <textarea value={form.treatmentNotes} onChange={(e) => setForm({ ...form, treatmentNotes: e.target.value })} className={inputClass()} rows={2} />
          </Field>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Prescriptions</span>
              <button type="button" onClick={() => setRxLines([...rxLines, { ...emptyRx }])} className="text-sm font-medium text-teal-600 hover:underline">
                + Add medicine
              </button>
            </div>
            <div className="space-y-3">
              {rxLines.map((line, i) => (
                <div key={i} className="rounded-lg border border-slate-200 p-3">
                  <div className="mb-2 grid grid-cols-2 gap-2">
                    <input placeholder="Medicine" value={line.medicine} onChange={(e) => updateLine(i, "medicine", e.target.value)} className={inputClass()} />
                    <input placeholder="Dosage (e.g. 1 tablet)" value={line.dosage} onChange={(e) => updateLine(i, "dosage", e.target.value)} className={inputClass()} />
                    <input placeholder="Frequency (e.g. Twice daily)" value={line.frequency} onChange={(e) => updateLine(i, "frequency", e.target.value)} className={inputClass()} />
                    <input placeholder="Duration (e.g. 5 days)" value={line.duration} onChange={(e) => updateLine(i, "duration", e.target.value)} className={inputClass()} />
                  </div>
                  <input placeholder="Instructions (optional)" value={line.instructions} onChange={(e) => updateLine(i, "instructions", e.target.value)} className={inputClass()} />
                  {rxLines.length > 1 && (
                    <button type="button" onClick={() => setRxLines(rxLines.filter((_, j) => j !== i))} className="mt-2 text-xs text-red-500 hover:underline">
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60">
              {saving ? "Saving…" : "Save consultation"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );

  function updateLine(index: number, key: keyof typeof emptyRx, value: string) {
    setRxLines((lines) => lines.map((l, i) => (i === index ? { ...l, [key]: value } : l)));
  }
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-slate-400">{label}</dt>
      <dd className="font-medium text-slate-700">{value}</dd>
    </div>
  );
}
