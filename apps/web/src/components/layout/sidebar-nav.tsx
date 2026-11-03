"use client";

import {
  Bot,
  KeyRound,
  LayoutDashboard,
  ScrollText,
  Settings,
  Unplug,
  Vault,
  Waypoints,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/cn";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/connectors", label: "Connectors", icon: Unplug },
  { href: "/agents", label: "Agents", icon: Bot },
  { href: "/permissions", label: "Permissions", icon: KeyRound },
  { href: "/activity", label: "Activity", icon: ScrollText },
  { href: "/mcp", label: "MCP access", icon: Waypoints },
  { href: "/settings", label: "Settings", icon: Settings },
];

export const SidebarNav = ({ onNavigate }: { onNavigate?: () => void }) => {
  const pathname = usePathname();

  return (
    <nav className="flex h-full flex-col">
      <Link href="/dashboard" className="flex items-center gap-2 px-2 text-paper" onClick={onNavigate}>
        <span className="grid size-9 place-items-center rounded-2xl bg-copper text-paper">
          <Vault size={18} />
        </span>
        <span>
          <span className="block font-serif text-xl leading-none">AgentVault</span>
          <span className="text-xs text-paper/60">Agent access</span>
        </span>
      </Link>
      <ul className="mt-8 space-y-1">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-3 py-2 text-sm",
                  active ? "bg-paper text-ink" : "text-paper/75 hover:bg-white/5 hover:text-paper",
                )}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
