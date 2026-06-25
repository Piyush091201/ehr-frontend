"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, homePathForRole } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { inputClass } from "@/components/ui";

const demoAccounts = [
  { label: "Admin", email: "admin@ehr.com", password: "Admin@123" },
  { label: "Doctor", email: "doctor@ehr.com", password: "Doctor@123" },
  { label: "Receptionist", email: "reception@ehr.com", password: "Reception@123" },
  { label: "Patient", email: "patient@ehr.com", password: "Patient@123" },
];

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("admin@ehr.com");
  const [password, setPassword] = useState("Admin@123");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setErrors({});
    setLoading(true);
    try {
      const user = await login(email, password);
      router.push(homePathForRole(user.role));
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.fieldErrors);
        setError(Object.keys(err.fieldErrors).length ? null : err.message);
      } else {
        setError("Login failed");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-gradient-to-br from-teal-600 to-sky-800 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-teal-600 text-2xl text-white">
            ⚕
          </div>
          <h1 className="text-2xl font-bold text-slate-800">EHR System</h1>
          <p className="text-sm text-slate-500">Sign in to your account</p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass(!!errors.email)}
            />
            {errors.email && <span className="mt-1 block text-xs font-medium text-red-600">{errors.email[0]}</span>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass(!!errors.password)}
            />
            {errors.password && <span className="mt-1 block text-xs font-medium text-red-600">{errors.password[0]}</span>}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-teal-600 py-2.5 font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <div className="mt-6 border-t border-slate-100 pt-4">
          <p className="mb-2 text-center text-xs font-medium uppercase tracking-wide text-slate-400">
            Demo accounts
          </p>
          <div className="grid grid-cols-2 gap-2">
            {demoAccounts.map((a) => (
              <button
                key={a.email}
                type="button"
                onClick={() => {
                  setEmail(a.email);
                  setPassword(a.password);
                  setErrors({});
                  setError(null);
                }}
                className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-medium text-slate-600 transition hover:border-teal-400 hover:text-teal-700"
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
