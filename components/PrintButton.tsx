"use client";

export default function PrintButton({ label = "Imprimer / Export PDF" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="print:hidden shrink-0 rounded-md border border-border text-sm font-medium px-3 py-1.5 hover:bg-background transition-colors"
    >
      {label}
    </button>
  );
}
