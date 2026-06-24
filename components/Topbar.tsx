"use client";

import { useAuth } from "@/lib/auth";
import { RoleBadge } from "./ui";

export default function Topbar() {
  const { user, logout } = useAuth();

  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
      <div className="md:hidden flex items-center gap-2 font-bold text-slate-800">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-600 text-sm text-white">
          ⚕
        </span>
        EHR
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-4">
        {user && (
          <div className="text-right">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-800">{user.fullName}</span>
              <RoleBadge role={user.role} />
            </div>
            <span className="text-xs text-slate-400">{user.email}</span>
          </div>
        )}
        <button
          onClick={logout}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-red-300 hover:text-red-600"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
