"use client";

import { useEffect, useState } from "react";
import { apiFetch, apiDownload } from "@/lib/api";
import type { Invoice } from "@/lib/types";
import { EmptyState, Card, StatusBadge, formatDate, formatMoney } from "@/components/ui";

export default function MyInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<Invoice[]>("/api/invoices")
      .then(setInvoices)
      .finally(() => setLoading(false));
  }, []);

  async function download(inv: Invoice) {
    try {
      await apiDownload(`/api/invoices/${inv.id}/pdf`, `${inv.invoiceNumber}.pdf`);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to download");
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">My Invoices</h1>
        <p className="text-sm text-slate-500">Your billing history. Download any invoice as a PDF.</p>
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
                <th className="px-5 py-3">Invoice #</th><th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Total</th><th className="px-5 py-3">Balance</th>
                <th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-800">{inv.invoiceNumber}</td>
                  <td className="px-5 py-3 text-slate-500">{formatDate(inv.issuedDate)}</td>
                  <td className="px-5 py-3 text-slate-700">{formatMoney(inv.total)}</td>
                  <td className="px-5 py-3 text-slate-700">{formatMoney(inv.balance)}</td>
                  <td className="px-5 py-3"><StatusBadge status={inv.status} /></td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => download(inv)} className="text-sm font-medium text-teal-600 hover:underline">Download</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
