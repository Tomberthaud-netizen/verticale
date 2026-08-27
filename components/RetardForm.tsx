"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { addRetard } from "@/app/actions";

export default function RetardForm({ chantierId }: { chantierId: string }) {
  const router = useRouter();
  const [nombreJours, setNombreJours] = useState(1);
  const [dateAjout, setDateAjout] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [commentaire, setCommentaire] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      await addRetard(chantierId, { nombreJours, dateAjout, commentaire: commentaire || undefined });
      setCommentaire("");
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
        Jours de retard
        <input
          required
          type="number"
          min={1}
          value={nombreJours}
          onChange={(e) => setNombreJours(Number(e.target.value))}
          className="border border-border rounded-md px-2 py-1.5 text-sm bg-surface w-28"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium text-muted">
        Date d&apos;ajout
        <input
          required
          type="date"
          value={dateAjout}
          onChange={(e) => setDateAjout(e.target.value)}
          className="border border-border rounded-md px-2 py-1.5 text-sm bg-surface"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium text-muted">
        Commentaire (optionnel)
        <input
          value={commentaire}
          onChange={(e) => setCommentaire(e.target.value)}
          placeholder="Ex : Attente livraison"
          className="border border-border rounded-md px-2 py-1.5 text-sm bg-surface w-56"
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
