"use client";

import { useRouter } from "next/navigation";

export default function RetourButton({ label = "← Retour" }: { label?: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="print:hidden self-start text-sm font-medium text-muted hover:text-foreground transition-colors"
    >
      {label}
    </button>
  );
}
