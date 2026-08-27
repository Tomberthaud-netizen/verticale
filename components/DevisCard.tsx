import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { StatutAffaire } from "@prisma/client";
import { calculerTotalHT, calculerTotalHTNet } from "@/lib/devis";
import { formaterMontant } from "@/lib/finances";
import StatutAffaireBadge from "@/components/StatutAffaireBadge";

export interface DevisPourCarte {
  id: string;
  numero: string;
  intitule: string;
  entreprise: string;
  dateDevis: Date;
  tauxTVA: number;
  remiseHT: number;
  statutAffaire: StatutAffaire;
  clientNom: string | null;
  valide: boolean;
  lignes: { quantite: number; prixUnitaire: number }[];
  chantier: { id: string; nom: string } | null;
  responsable: { nom: string; prenom: string } | null;
}

export default function DevisCard({ devis }: { devis: DevisPourCarte }) {
  const totalHT = calculerTotalHTNet(calculerTotalHT(devis.lignes), devis.remiseHT);

  return (
    <Link
      href={`/devis/${devis.id}`}
      className="bg-surface border border-border rounded-lg p-4 flex flex-col md:flex-row md:items-center gap-3 hover:border-foreground/30 transition-colors"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold">{devis.intitule}</span>
          <StatutAffaireBadge statut={devis.statutAffaire} />
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-background border border-border text-muted">
            {devis.entreprise}
          </span>
          {devis.valide && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Validé
            </span>
          )}
          {devis.chantier && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {devis.chantier.nom}
            </span>
          )}
        </div>
        <p className="text-sm text-muted mt-0.5">
          {devis.numero} · {format(devis.dateDevis, "d MMM yyyy", { locale: fr })}
          {devis.clientNom && <> · {devis.clientNom}</>}
          {devis.responsable && (
            <>
              {" "}
              · {devis.responsable.prenom} {devis.responsable.nom}
            </>
          )}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-lg font-semibold tabular-nums">{formaterMontant(totalHT)}</p>
        <p className="text-xs text-muted">HT · {devis.lignes.length} ligne(s)</p>
      </div>
    </Link>
  );
}
