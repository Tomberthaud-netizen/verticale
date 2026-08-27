"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { modifierPlanningDevis } from "@/app/actions";

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
  );
}
