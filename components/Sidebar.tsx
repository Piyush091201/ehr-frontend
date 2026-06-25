"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavItem {
  href: string;
  label: string;
  icon: string;
}

export default function Sidebar({ items, subtitle }: { items: NavItem[]; subtitle: string }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col bg-slate-900 text-slate-200 md:flex">
      <div className="flex items-center gap-2 px-6 py-5 text-white">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-600 text-lg">⚕</span>
        <div>
          <div className="text-base font-bold leading-tight">EHR System</div>
          <div className="text-[11px] text-slate-400">{subtitle}</div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-2">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                active ? "bg-teal-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <span className="w-5 text-center">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-6 py-4 text-xs text-slate-500">EHR portfolio demo</div>
    </aside>
  );
}
