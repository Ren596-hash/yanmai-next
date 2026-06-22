"use client";

import { useEffect } from "react";
import { seedDemoData } from "@/lib/storage";

export default function SeedInitializer({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    seedDemoData().catch(() => {});
  }, []);

  return <>{children}</>;
}
