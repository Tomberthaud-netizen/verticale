"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { modifierSuiviAffaire } from "@/app/affairesActions";

interface SuiviAffaireFormProps {
  devisId: string;
  responsableId: string | null;
  prochaineActionDate: Date | null;
  prochaineActionNote: string | null;
  personnes: { id: string; nom: string; prenom: string }[];
}

export default function SuiviAffaireForm({
  devisId,
  responsableId: responsableIdInitial,
  prochaineActionDate: prochaineActionDateInitial,
  prochaineActionNote: prochaineActionNoteInitial,
  personnes,
}: SuiviAffaireFormProps) {
  const router = useRouter();
  const [responsableId, setResponsableId] = useState(responsableIdInitial ?? "");
  const [prochaineActionDate, setProchaineActionDate] = useState(
    prochaineActionDateInitial ? format(prochaineActionDateInitial, "yyyy-MM-dd") : ""
  );
  const [prochaineActionNote, setProchaineActionNote] = useState(prochaineActionNoteInitial ?? "");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function sauvegarder(patch: { responsableId?: string }) {
    setErreur(null);
    setEnCours(true);
    try {
      await modifierSuiviAffaire(devisId, {
        responsableId: (patch.responsableId ?? responsableId) || null,
        prochaineActionDate: prochaineActionDate || null,
        prochaineActionNote: prochaineActionNote || null,
      });
      router.refresh();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setEnCours(false);
    }
  }

  async function handleResponsableChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const nouveauResponsableId = e.target.value;
    setResponsableId(nouveauResponsableId);
    await sauvegarder({ responsableId: nouveauResponsableId });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await sauvegarder({});
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Responsable
          <select
            value={responsableId}
            onChange={handleResponsableChange}
            disabled={enCours}
            className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface disabled:opacity-50"
          >
            <option value="">Non attribué</option>
            {personnes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.prenom} {p.nom}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Prochaine action — date
          <input
            type="date"
            value={prochaineActionDate}
            onChange={(e) => setProchaineActionDate(e.target.value)}
            className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Prochaine action — note
          <input
            value={prochaineActionNote}
            onChange={(e) => setProchaineActionNote(e.target.value)}
            placeholder="Ex : Relancer le client"
            className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface"
          />
        </label>
      </div>

      {erreur && <p className="text-sm text-red-600">{erreur}</p>}

      <button
        type="submit"
        disabled={enCours}
        className="self-start rounded-md border border-border text-sm font-medium px-4 py-2 hover:bg-surface transition-colors disabled:opacity-50"
      >
        {enCours ? "Enregistrement…" : "Enregistrer le suivi"}
      </button>
    </form>
  );
}
