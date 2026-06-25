"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import Sidebar, { NavItem } from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

const items: NavItem[] = [
  { href: "/portal", label: "Dashboard", icon: "▦" },
  { href: "/portal/appointments", label: "My Appointments", icon: "📅" },
  { href: "/portal/records", label: "My Medical Records", icon: "📋" },
  { href: "/portal/prescriptions", label: "My Prescriptions", icon: "💊" },
  { href: "/portal/invoices", label: "My Invoices", icon: "🧾" },
];

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
    else if (user.role !== "Patient") router.replace("/dashboard");
  }, [loading, user, router]);

  if (loading || !user || user.role !== "Patient") {
    return <div className="flex flex-1 items-center justify-center text-slate-500">Loading…</div>;
  }

  return (
    <div className="flex flex-1">
      <Sidebar items={items} subtitle="Patient Portal" />
      <div className="flex flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
