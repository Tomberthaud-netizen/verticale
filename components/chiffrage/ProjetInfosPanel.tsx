"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { modifierProjetChiffrage, supprimerProjetChiffrage } from "@/app/chiffrageActions";
import type { ChantierChoix } from "./NouveauProjetChiffrageForm";

export default function ProjetInfosPanel({
  projet,
  chantiers,
}: {
  projet: { id: string; nom: string; adresse: string | null; notes: string | null; chantierId: string | null };
  chantiers: ChantierChoix[];
}) {
  const router = useRouter();
  const [nom, setNom] = useState(projet.nom);
  const [adresse, setAdresse] = useState(projet.adresse ?? "");
  const [notes, setNotes] = useState(projet.notes ?? "");
  const [chantierId, setChantierId] = useState(projet.chantierId ?? "");
  const [enCours, setEnCours] = useState<"enregistrement" | "suppression" | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enregistre, setEnregistre] = useState(false);

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnregistre(false);
    setEnCours("enregistrement");
    try {
      await modifierProjetChiffrage(projet.id, { nom, adresse, notes, chantierId: chantierId || null });
      setEnregistre(true);
      router.refresh();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setEnCours(null);
    }
  }

  async function supprimer() {
    if (!window.confirm(`Supprimer définitivement le projet « ${projet.nom} » (pièces, plan et chiffrage compris) ?`)) return;
    setErreur(null);
    setEnCours("suppression");
    try {
      await supprimerProjetChiffrage(projet.id);
      router.push("/chiffrage");
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Une erreur est survenue.");
      setEnCours(null);
    }
  }

  return (
    <form onSubmit={enregistrer} className="border border-border rounded-lg bg-surface p-4 flex flex-col gap-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Nom du projet
          <input
            required
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-background"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Chantier lié
          <select
            value={chantierId}
            onChange={(e) => setChantierId(e.target.value)}
            className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-background"
          >
            <option value="">— Aucun chantier —</option>
            {chantiers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom} ({c.entreprise})
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium sm:col-span-2">
          Adresse
          <input
            value={adresse}
            onChange={(e) => setAdresse(e.target.value)}
            className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-background"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium sm:col-span-2">
          Notes
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-background resize-y"
          />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={enCours !== null}
          className="rounded-md bg-foreground text-background text-sm font-medium px-4 py-2 hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {enCours === "enregistrement" ? "Enregistrement…" : "Enregistrer"}
        </button>
        {enregistre && <span className="text-sm text-emerald-700">Enregistré.</span>}
        <button
          type="button"
          onClick={supprimer}
          disabled={enCours !== null}
          className="ml-auto text-xs text-muted hover:text-red-600 disabled:opacity-40"
        >
          {enCours === "suppression" ? "Suppression…" : "Supprimer le projet"}
        </button>
      </div>
      {erreur && <p className="text-sm text-red-600">{erreur}</p>}
    </form>
  );
}
