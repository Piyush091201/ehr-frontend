"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import Sidebar, { NavItem } from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import type { Role } from "@/lib/types";

const allItems: (NavItem & { roles: Role[] })[] = [
  { href: "/dashboard", label: "Dashboard", icon: "▦", roles: ["Admin", "Doctor", "Receptionist"] },
  { href: "/patients", label: "Patients", icon: "👤", roles: ["Admin", "Doctor", "Receptionist"] },
  { href: "/appointments", label: "Appointments", icon: "📅", roles: ["Admin", "Doctor", "Receptionist"] },
  { href: "/billing", label: "Billing", icon: "🧾", roles: ["Admin", "Receptionist"] },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
    else if (user.role === "Patient") router.replace("/portal");
  }, [loading, user, router]);

  if (loading || !user || user.role === "Patient") {
    return <div className="flex flex-1 items-center justify-center text-slate-500">Loading…</div>;
  }

  const items = allItems.filter((i) => i.roles.includes(user.role));

  return (
    <div className="flex flex-1">
      <Sidebar items={items} subtitle="Staff Workspace" />
      <div className="flex flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
