"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { supprimerFacturePreparee } from "@/app/actions";
import { formaterMontantPrecis } from "@/lib/finances";

interface FacturePrepareeResume {
  id: string;
  montantHT: number;
  notes: string | null;
  sousTraitantNom: string;
  dateAcompte: Date;
}

interface FactureResume {
  id: string;
  numero: string;
  montantHT: number;
  dateFacture: Date;
}

export default function FacturesDevisPanel({
  facturesPreparees,
  factures,
}: {
  facturesPreparees: FacturePrepareeResume[];
  factures: FactureResume[];
}) {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);

  async function supprimer(brouillon: FacturePrepareeResume) {
    if (!window.confirm("Supprimer ce brouillon de facture ? L'acompte lui-même est conservé.")) return;
    setErreur(null);
    try {
      await supprimerFacturePreparee(brouillon.id);
      router.refresh();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Une erreur est survenue.");
    }
  }

  if (facturesPreparees.length === 0 && factures.length === 0) return null;

  return (
    <section className="flex flex-col gap-3 print:hidden">
      <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">Factures</h2>

      {facturesPreparees.length > 0 && (
        <ul className="flex flex-col gap-2">
          {facturesPreparees.map((b) => (
            <li
              key={b.id}
              className="flex flex-wrap items-center justify-between gap-3 border border-dashed border-amber-300 bg-amber-50 rounded-md px-3 py-2 text-sm"
            >
              <div className="min-w-0">
                <p className="font-medium text-amber-900">
                  Facture à compléter{" "}
                  <span className="font-normal">
                    — acompte de {formaterMontantPrecis(b.montantHT)} HT · {b.sousTraitantNom} ·{" "}
                    {format(b.dateAcompte, "d MMM yyyy", { locale: fr })}
                  </span>
                </p>
                {b.notes && <p className="text-xs text-amber-800 whitespace-pre-wrap">{b.notes}</p>}
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href={`/finance/factures/nouveau?brouillon=${b.id}`}
                  className="rounded-md bg-foreground text-background text-sm font-medium px-3 py-1.5 hover:opacity-90 transition-opacity"
                >
                  Compléter la facture
                </Link>
                <button type="button" onClick={() => supprimer(b)} className="text-xs text-amber-800 hover:text-red-600">
                  Supprimer le brouillon
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {factures.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {factures.map((f) => (
            <li
              key={f.id}
              className="flex justify-between items-center gap-3 border border-border rounded-md px-3 py-2 bg-surface text-sm"
            >
              <Link href={`/finance/factures/${f.id}`} className="font-medium underline underline-offset-2">
                {f.numero}
              </Link>
              <span className="text-muted">
                {format(f.dateFacture, "d MMM yyyy", { locale: fr })} · {formaterMontantPrecis(f.montantHT)} HT
              </span>
            </li>
          ))}
        </ul>
      )}
      {erreur && <p className="text-sm text-red-600">{erreur}</p>}
    </section>
  );
}
