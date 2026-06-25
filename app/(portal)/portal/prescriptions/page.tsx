"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { Prescription } from "@/lib/types";
import { EmptyState, Card, formatDate } from "@/components/ui";

export default function MyPrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<Prescription[]>("/api/prescriptions")
      .then(setPrescriptions)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">My Prescriptions</h1>
        <p className="text-sm text-slate-500">All medicines prescribed to you.</p>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : prescriptions.length === 0 ? (
        <EmptyState message="No prescriptions yet." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {prescriptions.map((p) => (
            <Card key={p.id} className="p-5">
              <div className="flex items-start justify-between">
                <div className="text-lg font-semibold text-slate-800">💊 {p.medicine}</div>
                <span className="text-xs text-slate-400">{formatDate(p.issuedDate)}</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">{p.doctorName}</p>
              <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
                <Detail label="Dosage" value={p.dosage} />
                <Detail label="Frequency" value={p.frequency} />
                <Detail label="Duration" value={p.duration} />
              </dl>
              {p.instructions && <p className="mt-3 text-sm text-slate-600"><b>Instructions:</b> {p.instructions}</p>}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="font-medium text-slate-700">{value || "—"}</dd>
    </div>
  );
}
