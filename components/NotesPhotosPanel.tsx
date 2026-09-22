"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { modifierNotesPhotos } from "@/app/actions";

export default function NotesPhotosPanel({ chantierId, notes }: { chantierId: string; notes: string | null }) {
  const router = useRouter();
  const [edition, setEdition] = useState(false);
  const [valeur, setValeur] = useState(notes ?? "");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  function annuler() {
    setValeur(notes ?? "");
    setErreur(null);
    setEdition(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      await modifierNotesPhotos(chantierId, valeur);
      setEdition(false);
      router.refresh();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setEnCours(false);
    }
  }

  if (!edition) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-xs font-semibold text-muted uppercase tracking-wide">Notes</h3>
          <button
            type="button"
            onClick={() => setEdition(true)}
            className="print:hidden text-xs text-muted hover:text-foreground hover:underline"
          >
            Modifier
          </button>
        </div>
        <p className="text-sm whitespace-pre-wrap">
          {notes || <span className="text-muted">Aucune note pour le moment.</span>}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold text-muted uppercase tracking-wide">Notes</h3>
      <textarea
        value={valeur}
        onChange={(e) => setValeur(e.target.value)}
        rows={4}
        placeholder="Notes visibles par toute personne ayant accès à ce chantier…"
        className="border border-border rounded-md px-3 py-2 text-sm bg-surface"
      />
      {erreur && <p className="text-sm text-red-600">{erreur}</p>}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={enCours}
          className="self-start rounded-md bg-foreground text-background text-sm font-medium px-4 py-2 hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {enCours ? "Enregistrement…" : "Enregistrer"}
        </button>
        <button
          type="button"
          onClick={annuler}
          disabled={enCours}
          className="text-sm text-muted hover:underline disabled:opacity-50"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
