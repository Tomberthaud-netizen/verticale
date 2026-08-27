"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { modifierAdresseChantier } from "@/app/actions";

export default function AdresseChantierForm({ chantierId, adresse }: { chantierId: string; adresse: string }) {
  const router = useRouter();
  const [valeur, setValeur] = useState(adresse);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      await modifierAdresseChantier(chantierId, valeur);
      router.refresh();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1 text-sm font-medium flex-1 min-w-[240px]">
        {adresse ? "Modifier l'adresse" : "Adresse exacte"}
        <input
          required
          value={valeur}
          onChange={(e) => setValeur(e.target.value)}
          className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface"
          placeholder="Ex : 12 rue des Lilas, 91000 Évry"
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
