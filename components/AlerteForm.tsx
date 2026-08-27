"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addAlerte } from "@/app/actions";

export default function AlerteForm({ chantierId }: { chantierId: string }) {
  const router = useRouter();
  const [joursAvantLivraison, setJoursAvantLivraison] = useState(10);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      await addAlerte(chantierId, { joursAvantLivraison });
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
        Alerte à N jours de la livraison
        <input
          required
          type="number"
          min={1}
          value={joursAvantLivraison}
          onChange={(e) => setJoursAvantLivraison(Number(e.target.value))}
          className="border border-border rounded-md px-2 py-1.5 text-sm bg-surface w-32"
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
