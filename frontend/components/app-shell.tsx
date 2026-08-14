"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { Sidebar } from "@/components/sidebar";
import { MobileNav } from "@/components/mobile-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { loading, user } = useAuth();

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <MobileNav />
        <main className="flex-1 overflow-hidden pb-14 md:pb-0">{children}</main>
      </div>
    </div>
  );
}
