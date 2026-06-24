"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Patient } from "@/lib/types";
import Modal from "@/components/Modal";
import { Field, inputClass, EmptyState } from "@/components/ui";

const empty = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  gender: "Male",
  bloodGroup: "",
  phone: "",
  email: "",
  address: "",
};

function age(dob: string) {
  const diff = Date.now() - new Date(dob).getTime();
  return Math.max(0, Math.floor(diff / 31557600000));
}

export default function PatientsPage() {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (term: string) => {
    setLoading(true);
    try {
      const q = term ? `?search=${encodeURIComponent(term)}` : "";
      setPatients(await apiFetch<Patient[]>(`/api/patients${q}`));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load patients");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(search), 300);
    return () => clearTimeout(t);
  }, [search, load]);

  function openCreate() {
    setEditId(null);
    setForm(empty);
    setError(null);
    setOpen(true);
  }

  function openEdit(p: Patient) {
    setEditId(p.id);
    setForm({
      firstName: p.firstName,
      lastName: p.lastName,
      dateOfBirth: p.dateOfBirth.slice(0, 10),
      gender: p.gender || "Male",
      bloodGroup: p.bloodGroup ?? "",
      phone: p.phone ?? "",
      email: p.email ?? "",
      address: p.address ?? "",
    });
    setError(null);
    setOpen(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = { ...form, dateOfBirth: new Date(form.dateOfBirth).toISOString() };
      if (editId) {
        await apiFetch(`/api/patients/${editId}`, { method: "PUT", body: payload });
      } else {
        await apiFetch("/api/patients", { method: "POST", body: payload });
      }
      setOpen(false);
      load(search);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save patient");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    if (!confirm("Delete this patient and all related records?")) return;
    try {
      await apiFetch(`/api/patients/${id}`, { method: "DELETE" });
      load(search);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to delete");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Patients</h1>
          <p className="text-sm text-slate-500">Manage patient records.</p>
        </div>
        <button
          onClick={openCreate}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
        >
          + New Patient
        </button>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name or email…"
        className={inputClass + " max-w-sm"}
      />

      {loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : patients.length === 0 ? (
        <EmptyState message="No patients found." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Age / Gender</th>
                <th className="px-5 py-3">Blood</th>
                <th className="px-5 py-3">Contact</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {patients.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <Link href={`/patients/${p.id}`} className="font-medium text-teal-700 hover:underline">
                      {p.firstName} {p.lastName}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-slate-600">
                    {age(p.dateOfBirth)} · {p.gender}
                  </td>
                  <td className="px-5 py-3 text-slate-600">{p.bloodGroup || "—"}</td>
                  <td className="px-5 py-3 text-slate-600">{p.phone || p.email || "—"}</td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => openEdit(p)} className="mr-3 text-sm text-slate-500 hover:text-teal-600">
                      Edit
                    </button>
                    {user?.role === "Admin" && (
                      <button onClick={() => remove(p.id)} className="text-sm text-slate-500 hover:text-red-600">
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={open} title={editId ? "Edit Patient" : "New Patient"} onClose={() => setOpen(false)}>
        <form onSubmit={save} className="space-y-4">
          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          <div className="grid grid-cols-2 gap-3">
            <Field label="First name">
              <input required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Last name">
              <input required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Date of birth">
              <input type="date" required value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Gender">
              <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className={inputClass}>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </Field>
            <Field label="Blood group">
              <input value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })} className={inputClass} placeholder="O+" />
            </Field>
            <Field label="Phone">
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} />
            </Field>
          </div>
          <Field label="Email">
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Address">
            <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputClass} rows={2} />
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
