"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { AppChrome } from "@/components/app-chrome";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { loading, user } = useAuth();

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="font-mono text-xs tracking-[0.2em] text-ink-dim">
          BOOT<span className="caret" />
        </span>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppChrome />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
