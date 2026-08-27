"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import type { EvenementType } from "@prisma/client";
import { addDateImportante } from "@/app/actions";
import { EVENEMENT_TYPE_COLORS } from "@/constants/colors";

const TYPES_EVENEMENT: EvenementType[] = ["LIVRAISON", "REUNION", "INSPECTION", "AUTRE"];

export default function DateImportanteForm({ chantierId }: { chantierId: string }) {
  const router = useRouter();
  const [nom, setNom] = useState("");
  const [date, setDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [type, setType] = useState<EvenementType>("LIVRAISON");
  const [typePersonnalise, setTypePersonnalise] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    if (type === "AUTRE" && !typePersonnalise.trim()) {
      setErreur("Précisez le type d'événement.");
      return;
    }
    setEnCours(true);
    try {
      await addDateImportante(chantierId, {
        nom,
        date,
        type,
        typePersonnalise: type === "AUTRE" ? typePersonnalise.trim() : undefined,
      });
      setNom("");
      setTypePersonnalise("");
      router.refresh();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2">
      <label className="flex flex-col gap-1 text-xs font-medium text-muted">
        Type
        <select
          value={type}
          onChange={(e) => setType(e.target.value as EvenementType)}
          className="border border-border rounded-md px-2 py-1.5 text-sm bg-surface"
        >
          {TYPES_EVENEMENT.map((t) => (
            <option key={t} value={t}>
              {EVENEMENT_TYPE_COLORS[t].label}
            </option>
          ))}
        </select>
      </label>
      {type === "AUTRE" && (
        <label className="flex flex-col gap-1 text-xs font-medium text-muted">
          Préciser le type
          <input
            required
            value={typePersonnalise}
            onChange={(e) => setTypePersonnalise(e.target.value)}
            placeholder="Ex : Contrôle technique"
            className="border border-border rounded-md px-2 py-1.5 text-sm bg-surface w-40"
          />
        </label>
      )}
      <label className="flex flex-col gap-1 text-xs font-medium text-muted">
        Nom
        <input
          required
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          placeholder="Ex : Livraison matériaux"
          className="border border-border rounded-md px-2 py-1.5 text-sm bg-surface w-48"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium text-muted">
        Date
        <input
          required
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border border-border rounded-md px-2 py-1.5 text-sm bg-surface"
        />
      </label>
      <button
        type="submit"
        disabled={enCours}
        className="rounded-md bg-foreground text-background text-sm font-medium px-3 py-1.5 hover:opacity-90 disabled:opacity-50"
      >
        Ajouter
      </button>
      {erreur && <p className="text-sm text-red-600 basis-full">{erreur}</p>}
    </form>
  );
}
