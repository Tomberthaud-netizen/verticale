"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { modifierPlanningDevis } from "@/app/actions";
import { calculerFinPeriode } from "@/lib/dates";
import { construireEchelleJoursOuvres } from "@/lib/gantt";
import { DEVIS_PROJETE_COLOR } from "@/constants/colors";
import GanttChart from "@/components/Gantt/GanttChart";

interface PlanningDevisFormProps {
  devisId: string;
  dateDebutPrevisionnelle: Date | null;
  dureeJoursOuvres: number | null;
}

export default function PlanningDevisForm({
  devisId,
  dateDebutPrevisionnelle,
  dureeJoursOuvres,
}: PlanningDevisFormProps) {
  const router = useRouter();
  const [dateDebut, setDateDebut] = useState(
    dateDebutPrevisionnelle ? format(dateDebutPrevisionnelle, "yyyy-MM-dd") : ""
  );
  const [duree, setDuree] = useState(dureeJoursOuvres ? String(dureeJoursOuvres) : "");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const apercu = useMemo(() => {
    const dureeNombre = Number(duree);
    if (!dateDebut || !dureeNombre || dureeNombre <= 0) return null;
    const debut = new Date(dateDebut);
    if (Number.isNaN(debut.getTime())) return null;
    const fin = calculerFinPeriode(debut, dureeNombre);
    return { echelle: construireEchelleJoursOuvres(debut, fin), debut, fin };
  }, [dateDebut, duree]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      await modifierPlanningDevis(devisId, {
        dateDebut: dateDebut || null,
        dureeJoursOuvres: duree ? Number(duree) : null,
      });
      router.refresh();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Date de début du chantier
          <input
            type="date"
            value={dateDebut}
            onChange={(e) => setDateDebut(e.target.value)}
            className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Délai (jours ouvrés)
          <input
            type="number"
            min={1}
            value={duree}
            onChange={(e) => setDuree(e.target.value)}
            placeholder="Ex : 15"
            className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface w-32"
          />
        </label>
        <button
          type="submit"
          disabled={enCours}
          className="rounded-md border border-border text-sm font-medium px-4 py-2 hover:bg-surface transition-colors disabled:opacity-50"
        >
          {enCours ? "Enregistrement…" : "Enregistrer"}
        </button>
        {erreur && <p className="text-sm text-red-600 w-full">{erreur}</p>}
      </form>

      {apercu && (
        <GanttChart
          echelle={apercu.echelle}
          rows={[
            {
              id: "apercu",
              label: "Aperçu",
              segments: [
                {
                  id: "apercu",
                  debut: apercu.debut,
                  fin: apercu.fin,
                  bg: DEVIS_PROJETE_COLOR.bg,
                  border: DEVIS_PROJETE_COLOR.border,
                  label: DEVIS_PROJETE_COLOR.label,
                  estime: true,
                },
              ],
            },
          ]}
        />
      )}
    </div>
  );
}
