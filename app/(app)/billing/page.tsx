"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, apiDownload, ApiError, FieldErrors } from "@/lib/api";
import type { Invoice, Patient } from "@/lib/types";
import Modal from "@/components/Modal";
import { Field, inputClass, StatusBadge, EmptyState, Card, formatDate, formatMoney } from "@/components/ui";

const defaultItems = [
  { description: "Consultation Fee", amount: "500" },
  { description: "Lab Charges", amount: "" },
  { description: "Medication Charges", amount: "" },
];

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [patientId, setPatientId] = useState(0);
  const [items, setItems] = useState(defaultItems.map((i) => ({ ...i })));
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Payment modal
  const [payInv, setPayInv] = useState<Invoice | null>(null);
  const [payAmount, setPayAmount] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [inv, p] = await Promise.all([
        apiFetch<Invoice[]>("/api/invoices"),
        apiFetch<Patient[]>("/api/patients"),
      ]);
      setInvoices(inv);
      setPatients(p);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const draftTotal = items.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);

  function openCreate() {
    setPatientId(patients[0]?.id ?? 0);
    setItems(defaultItems.map((i) => ({ ...i })));
    setNotes("");
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
      const payload = {
        patientId: Number(patientId),
        notes,
        items: items
          .filter((i) => i.description.trim() && i.amount !== "")
          .map((i) => ({ description: i.description.trim(), amount: parseFloat(i.amount) || 0 })),
      };
      await apiFetch("/api/invoices", { method: "POST", body: payload });
      setOpen(false);
      load();
    } catch (e) {
      if (e instanceof ApiError) {
        setErrors(e.fieldErrors);
        if (!Object.keys(e.fieldErrors).length) setFormError(e.message);
      } else setFormError("Failed to create invoice");
    } finally {
      setSaving(false);
    }
  }

  async function recordPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!payInv) return;
    try {
      await apiFetch(`/api/invoices/${payInv.id}/pay`, {
        method: "PATCH",
        body: { amountPaid: parseFloat(payAmount) || 0 },
      });
      setPayInv(null);
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
    }
  }

  async function download(inv: Invoice) {
    try {
      await apiDownload(`/api/invoices/${inv.id}/pdf`, `${inv.invoiceNumber}.pdf`);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to download");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Billing &amp; Invoices</h1>
          <p className="text-sm text-slate-500">Generate invoices and track payments.</p>
        </div>
        <button onClick={openCreate} disabled={patients.length === 0} className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-50">
          + New Invoice
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : invoices.length === 0 ? (
        <EmptyState message="No invoices yet." />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Invoice</th><th className="px-5 py-3">Patient</th>
                <th className="px-5 py-3">Date</th><th className="px-5 py-3">Total</th>
                <th className="px-5 py-3">Paid</th><th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-800">{inv.invoiceNumber}</td>
                  <td className="px-5 py-3 text-slate-600">{inv.patientName}</td>
                  <td className="px-5 py-3 text-slate-500">{formatDate(inv.issuedDate)}</td>
                  <td className="px-5 py-3 text-slate-700">{formatMoney(inv.total)}</td>
                  <td className="px-5 py-3 text-slate-600">{formatMoney(inv.amountPaid)}</td>
                  <td className="px-5 py-3"><StatusBadge status={inv.status} /></td>
                  <td className="px-5 py-3 text-right whitespace-nowrap">
                    {inv.status !== "Paid" && (
                      <button onClick={() => { setPayInv(inv); setPayAmount(String(inv.total)); }} className="mr-3 text-xs font-medium text-green-600 hover:underline">Record payment</button>
                    )}
                    <button onClick={() => download(inv)} className="text-xs font-medium text-teal-600 hover:underline">PDF</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Create invoice */}
      <Modal open={open} title="New Invoice" onClose={() => setOpen(false)}>
        <form onSubmit={save} className="space-y-4" noValidate>
          {formError && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</div>}
          {errors.items && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errors.items[0]}</div>}
          <Field label="Patient">
            <select value={patientId} onChange={(e) => setPatientId(Number(e.target.value))} className={inputClass()}>
              {patients.map((p) => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
            </select>
          </Field>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Line items</span>
              <button type="button" onClick={() => setItems([...items, { description: "", amount: "" }])} className="text-sm font-medium text-teal-600 hover:underline">+ Add item</button>
            </div>
            <div className="space-y-2">
              {items.map((it, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input placeholder="Description" value={it.description} onChange={(e) => updateItem(i, "description", e.target.value)} className={inputClass() + " flex-1"} />
                  <input placeholder="0" type="number" min="0" step="0.01" value={it.amount} onChange={(e) => updateItem(i, "amount", e.target.value)} className={inputClass() + " w-28"} />
                  {items.length > 1 && (
                    <button type="button" onClick={() => setItems(items.filter((_, j) => j !== i))} className="text-slate-400 hover:text-red-500" aria-label="Remove">✕</button>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-between border-t border-slate-100 pt-3 text-sm font-semibold text-slate-800">
              <span>Total</span><span>{formatMoney(draftTotal)}</span>
            </div>
          </div>

          <Field label="Notes">
            <input value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass()} />
          </Field>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60">{saving ? "Saving…" : "Create invoice"}</button>
          </div>
        </form>
      </Modal>

      {/* Record payment */}
      <Modal open={payInv !== null} title={`Record Payment — ${payInv?.invoiceNumber ?? ""}`} onClose={() => setPayInv(null)}>
        {payInv && (
          <form onSubmit={recordPayment} className="space-y-4">
            <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Total {formatMoney(payInv.total)} · Already paid {formatMoney(payInv.amountPaid)}
            </div>
            <Field label="Amount paid (total)">
              <input type="number" min="0" step="0.01" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} className={inputClass()} />
            </Field>
            <p className="text-xs text-slate-400">Enter the cumulative amount paid. Equal to total = Paid; less = Partially Paid.</p>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setPayInv(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
              <button type="submit" className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700">Save</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );

  function updateItem(index: number, key: "description" | "amount", value: string) {
    setItems((arr) => arr.map((it, i) => (i === index ? { ...it, [key]: value } : it)));
  }
}
