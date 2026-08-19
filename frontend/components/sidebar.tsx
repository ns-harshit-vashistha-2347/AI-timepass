"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, FileText, LogOut, Sparkles, Building2 } from "lucide-react";

import { cn } from "@/lib/cn";
import { useAuth } from "@/components/auth/auth-provider";

const nav = [
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/office", label: "Office", icon: Building2 },
  { href: "/documents", label: "Documents", icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const initials =
    (user?.full_name || user?.email || "?")
      .split(" ")
      .map((s) => s[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col border-r border-surface-border bg-bg-soft/70 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-2 border-b border-surface-border px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-accent-soft glow">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <span className="text-lg font-semibold tracking-tight">
          <span className="gradient-text">Lumen</span>
        </span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-accent/15 text-accent-glow"
                  : "text-text-muted hover:bg-surface-hover hover:text-text"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-surface-border p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-soft text-xs font-semibold text-white">
            {user?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatar_url}
                alt=""
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              initials
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-text">
              {user?.full_name || user?.email}
            </p>
            <p className="truncate text-xs text-text-subtle">{user?.email}</p>
          </div>
          <button
            onClick={() => logout()}
            className="rounded-md p-1.5 text-text-subtle hover:bg-surface-hover hover:text-danger"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
