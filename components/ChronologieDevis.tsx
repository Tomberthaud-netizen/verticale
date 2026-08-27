"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { TypeEvenementDevis } from "@prisma/client";
import { ajouterEvenementDevis, supprimerEvenementDevis } from "@/app/affairesActions";
import { TYPES_EVENEMENT_DEVIS, TYPE_EVENEMENT_DEVIS_LABELS } from "@/constants/affaires";

export interface EvenementDevisExistant {
  id: string;
  type: TypeEvenementDevis;
  contenu: string;
  date: Date;
}

export default function ChronologieDevis({
  devisId,
  evenements,
}: {
  devisId: string;
  evenements: EvenementDevisExistant[];
}) {
  const router = useRouter();
  const [type, setType] = useState<string>("NOTE");
  const [contenu, setContenu] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      await ajouterEvenementDevis(devisId, type, contenu);
      setContenu("");
      router.refresh();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setEnCours(false);
    }
  }

  async function handleSupprimer(evenementId: string) {
    await supprimerEvenementDevis(devisId, evenementId);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      {evenements.length > 0 ? (
        <ul className="flex flex-col gap-1.5">
          {evenements.map((ev) => (
            <li
              key={ev.id}
              className="flex justify-between items-start gap-3 border border-border rounded-md px-3 py-2 bg-surface text-sm"
            >
              <span className="flex items-start gap-2 min-w-0">
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-background border border-border text-muted shrink-0">
                  {TYPE_EVENEMENT_DEVIS_LABELS[ev.type]}
                </span>
                <span className="min-w-0">
                  <span className="block">{ev.contenu}</span>
                  <span className="text-xs text-muted">{format(ev.date, "d MMMM yyyy 'à' HH:mm", { locale: fr })}</span>
                </span>
              </span>
              <button
                type="button"
                onClick={() => handleSupprimer(ev.id)}
                className="text-xs text-muted hover:text-red-600 shrink-0"
              >
                Supprimer
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">Aucun événement enregistré.</p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Type
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface"
          >
            {TYPES_EVENEMENT_DEVIS.map((t) => (
              <option key={t} value={t}>
                {TYPE_EVENEMENT_DEVIS_LABELS[t]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium flex-1 min-w-[200px]">
          Contenu
          <input
            required
            value={contenu}
            onChange={(e) => setContenu(e.target.value)}
            placeholder="Ex : Client relancé par téléphone, réponse sous 1 semaine"
            className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface"
          />
        </label>
        <button
          type="submit"
          disabled={enCours}
          className="rounded-md border border-border text-sm font-medium px-4 py-2 hover:bg-background transition-colors disabled:opacity-50"
        >
          {enCours ? "Ajout…" : "+ Ajouter"}
        </button>
      </form>
      {erreur && <p className="text-sm text-red-600">{erreur}</p>}
    </div>
  );
}
