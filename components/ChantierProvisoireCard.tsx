import Link from "next/link";
import type { Chantier } from "@prisma/client";

export default function ChantierProvisoireCard({
  chantier,
}: {
  chantier: Pick<Chantier, "id" | "nom" | "surfaceM2" | "nombrePieces">;
}) {
  return (
    <div className="bg-surface border border-dashed border-border rounded-lg p-4 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Link href={`/chantiers/${chantier.id}`} className="font-semibold text-lg hover:underline">
            {chantier.nom}
          </Link>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            À compléter
          </span>
        </div>
        <p className="text-sm text-muted mt-0.5">
          {chantier.surfaceM2} m²
          {chantier.nombrePieces != null && ` · ${chantier.nombrePieces} pièce${chantier.nombrePieces > 1 ? "s" : ""}`}
        </p>
      </div>
      <Link
        href={`/chantiers/${chantier.id}`}
        className="shrink-0 rounded-md bg-foreground text-background text-sm font-medium px-4 py-2 hover:opacity-90 transition-opacity"
      >
        Compléter
      </Link>
    </div>
  );
}
