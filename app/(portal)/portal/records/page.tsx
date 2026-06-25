"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { Consultation } from "@/lib/types";
import { EmptyState, Card, formatDate } from "@/components/ui";

export default function MyRecordsPage() {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<Consultation[]>("/api/consultations")
      .then(setConsultations)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">My Medical Records</h1>
        <p className="text-sm text-slate-500">Your visit history, diagnoses, and treatment notes.</p>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : consultations.length === 0 ? (
        <EmptyState message="No medical records yet." />
      ) : (
        <div className="space-y-4">
          {consultations.map((c) => (
            <Card key={c.id} className="p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">{c.diagnosis}</h3>
                <span className="text-xs text-slate-400">{formatDate(c.visitDate)}</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">Seen by {c.doctorName}</p>
              {c.symptoms && <p className="mt-2 text-sm text-slate-600"><b>Symptoms:</b> {c.symptoms}</p>}
              {c.treatmentNotes && <p className="text-sm text-slate-600"><b>Treatment:</b> {c.treatmentNotes}</p>}
              {c.prescriptions.length > 0 && (
                <div className="mt-3 rounded-lg bg-slate-50 p-3">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Prescribed</p>
                  <ul className="space-y-1 text-sm text-slate-700">
                    {c.prescriptions.map((p) => (
                      <li key={p.id}>💊 {p.medicine} — {[p.dosage, p.frequency, p.duration].filter(Boolean).join(", ")}</li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
