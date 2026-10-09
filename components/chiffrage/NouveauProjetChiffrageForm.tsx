"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { creerProjetChiffrage } from "@/app/chiffrageActions";

export interface ChantierChoix {
  id: string;
  nom: string;
  adresse: string;
  entreprise: string;
}

/** Formulaire de création d'un projet de chiffrage, éventuellement rattaché à un chantier existant. */
export default function NouveauProjetChiffrageForm({ chantiers }: { chantiers: ChantierChoix[] }) {
  const router = useRouter();
  const [ouvert, setOuvert] = useState(false);
  const [nom, setNom] = useState("");
  const [adresse, setAdresse] = useState("");
  const [chantierId, setChantierId] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  // Choisir un chantier pré-remplit le nom et l'adresse tant qu'ils sont vides.
  function choisirChantier(id: string) {
    setChantierId(id);
    const chantier = chantiers.find((c) => c.id === id);
    if (!chantier) return;
    if (!nom.trim()) setNom(chantier.nom);
    if (!adresse.trim()) setAdresse(chantier.adresse);
  }

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      const { id } = await creerProjetChiffrage({ nom, adresse, chantierId: chantierId || null });
      router.push(`/chiffrage/${id}`);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Une erreur est survenue.");
      setEnCours(false);
    }
  }

  if (!ouvert) {
    return (
      <button
        type="button"
        onClick={() => setOuvert(true)}
        className="self-start rounded-md bg-foreground text-background text-sm font-medium px-4 py-2 hover:opacity-90 transition-opacity"
      >
        + Nouveau projet de chiffrage
      </button>
    );
  }

  return (
    <form onSubmit={soumettre} className="border border-border rounded-lg bg-surface p-4 flex flex-col gap-3 max-w-2xl">
      <h2 className="font-semibold">Nouveau projet de chiffrage</h2>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Lier à un chantier déjà créé (optionnel)
        <select
          value={chantierId}
          onChange={(e) => choisirChantier(e.target.value)}
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
      <label className="flex flex-col gap-1 text-sm font-medium">
        Nom du projet
        <input
          required
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          placeholder="Ex : Rénovation appartement Bobillot"
          className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-background"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Adresse (optionnel)
        <input
          value={adresse}
          onChange={(e) => setAdresse(e.target.value)}
          className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-background"
        />
      </label>
      {erreur && <p className="text-sm text-red-600">{erreur}</p>}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={enCours}
          className="rounded-md bg-foreground text-background text-sm font-medium px-4 py-2 hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {enCours ? "Création…" : "Créer le projet"}
        </button>
        <button type="button" onClick={() => setOuvert(false)} disabled={enCours} className="text-sm text-muted hover:underline">
          Annuler
        </button>
      </div>
    </form>
  );
}
