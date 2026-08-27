"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { modifierCouleurPrincipale } from "@/app/administrationActions";

export default function CouleurPrincipaleForm({ couleurActuelle }: { couleurActuelle: string }) {
  const router = useRouter();
  const [couleur, setCouleur] = useState(couleurActuelle);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      await modifierCouleurPrincipale(couleur);
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
        Couleur principale
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={couleur}
            onChange={(e) => setCouleur(e.target.value)}
            className="w-10 h-10 rounded-md border border-border cursor-pointer bg-surface p-0.5"
          />
          <input
            type="text"
            value={couleur}
            onChange={(e) => setCouleur(e.target.value)}
            className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface w-32"
          />
        </div>
      </label>
      <button
        type="submit"
        disabled={enCours}
        className="rounded-md bg-accent text-background text-sm font-medium px-4 py-2 hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {enCours ? "Enregistrement…" : "Enregistrer"}
      </button>
      {erreur && <p className="text-sm text-red-600 w-full">{erreur}</p>}
    </form>
  );
}
