import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { PHASE_COLORS, EVENEMENT_TYPE_COLORS, libellePhase, libelleEvenement } from "@/constants/colors";
import type { ChantierCalcule } from "@/lib/chantier";
import { formaterMontant } from "@/lib/finances";
import { filtrerDatesImportantesRecentes } from "@/lib/dates";

export default function ChantierCard({ chantier }: { chantier: ChantierCalcule }) {
  const retardTotal = chantier.retards.reduce((s, r) => s + r.nombreJours, 0);
  const alertesDeclenchees = chantier.alertes.filter((a) => a.declenchee).length;
  const datesImportantesAffichees = filtrerDatesImportantesRecentes(chantier.datesImportantes).slice(0, 3);

  return (
    <div className="bg-surface border border-border rounded-lg p-4 flex flex-col md:flex-row md:items-center gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Link href={`/chantiers/${chantier.id}`} className="font-semibold text-lg hover:underline">
            {chantier.nom}
          </Link>
          {retardTotal > 0 && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
              +{retardTotal} j de retard
            </span>
          )}
          {alertesDeclenchees > 0 && chantier.etat !== "TERMINE" && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              {alertesDeclenchees} alerte{alertesDeclenchees > 1 ? "s" : ""}
            </span>
          )}
        </div>
        <p className="text-sm text-muted mt-0.5">
          {chantier.entreprise} · Équipe {chantier.equipe} · du{" "}
          {format(chantier.dateDebut, "d MMM yyyy", { locale: fr })} au{" "}
          {format(chantier.dateFinCalculee, "d MMM yyyy", { locale: fr })}
          {chantier.coutReel != null && (
            <>
              {" "}
              · Coût réel <span className="font-medium text-foreground">{formaterMontant(chantier.coutReel)}</span>
            </>
          )}
        </p>
        <div className="flex items-center gap-2 mt-2 max-w-xs">
          <div className="flex-1 h-1.5 rounded-full bg-background overflow-hidden">
            <div
              className="h-full rounded-full bg-foreground"
              style={{ width: `${chantier.avancement}%` }}
            />
          </div>
          <span className="text-xs text-muted shrink-0">{chantier.avancement}%</span>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {chantier.phases.map((phase) => (
            <span key={phase.id} className="relative group/phase">
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full text-white cursor-default block"
                style={{ backgroundColor: PHASE_COLORS[phase.type].bg }}
              >
                {libellePhase(phase)}
              </span>
              <span className="pointer-events-none absolute left-1/2 bottom-full z-30 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-[11px] font-medium text-background opacity-0 group-hover/phase:opacity-100">
                Du {format(phase.dateDebut, "d MMM yyyy", { locale: fr })} au {format(phase.dateFin, "d MMM yyyy", { locale: fr })}
              </span>
            </span>
          ))}
        </div>
      </div>

      {datesImportantesAffichees.length > 0 && (
        <div className="md:w-56 shrink-0 text-sm border-t md:border-t-0 md:border-l border-border pt-3 md:pt-0 md:pl-4">
          <p className="text-xs font-medium text-muted mb-1">Dates importantes</p>
          <ul className="space-y-0.5">
            {datesImportantesAffichees.map((d) => (
              <li key={d.id} className="flex justify-between items-center gap-2">
                <span className="flex items-center gap-1.5 min-w-0">
                  {d.type === "LIVRAISON" && (
                    <span
                      className="text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0"
                      style={{
                        backgroundColor: EVENEMENT_TYPE_COLORS.LIVRAISON.bg,
                        color: EVENEMENT_TYPE_COLORS.LIVRAISON.text,
                      }}
                    >
                      {libelleEvenement(d)}
                    </span>
                  )}
                  <span className="truncate">{d.nom}</span>
                </span>
                <span className="text-muted shrink-0">{format(d.date, "d MMM", { locale: fr })}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
