"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, homePathForRole } from "@/lib/auth";

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    router.replace(user ? homePathForRole(user.role) : "/login");
  }, [user, loading, router]);

  return (
    <div className="flex flex-1 items-center justify-center text-slate-500">Loading…</div>
  );
}
