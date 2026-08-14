"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, FileText, LogOut, Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAuth } from "@/components/auth/auth-provider";

const nav = [
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/documents", label: "Docs", icon: FileText },
];

export function MobileNav() {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <div className="md:hidden">
      <header className="flex h-14 items-center justify-between border-b border-surface-border bg-bg-soft/80 backdrop-blur-xl px-4">
        <Link href="/chat" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-accent to-accent-soft glow">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-base font-semibold gradient-text">Lumen</span>
        </Link>
        <button
          onClick={() => logout()}
          className="rounded-md p-2 text-text-muted hover:bg-surface-hover"
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-50 flex border-t border-surface-border bg-bg-soft/90 backdrop-blur-xl">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors",
                active ? "text-accent-glow" : "text-text-muted"
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
