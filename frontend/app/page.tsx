"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { tokenStore } from "@/lib/token-store";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    if (tokenStore.getAccess()) {
      router.replace("/chat");
    } else {
      router.replace("/login");
    }
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <span className="font-mono text-xs tracking-[0.2em] text-ink-dim">
        BOOT<span className="caret" />
      </span>
    </div>
  );
}
