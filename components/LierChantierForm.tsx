"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { delierDevisDuChantier, lierDevisAuChantier } from "@/app/actions";

interface LierChantierFormProps {
  devisId: string;
  chantiers: { id: string; nom: string }[];
  chantierActuel: { id: string; nom: string } | null;
}

export default function LierChantierForm({ devisId, chantiers, chantierActuel }: LierChantierFormProps) {
  const router = useRouter();
  const [chantierId, setChantierId] = useState(chantiers[0]?.id ?? "");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function handleLier(e: React.FormEvent) {
    e.preventDefault();
    if (!chantierId) return;
    setErreur(null);
    setEnCours(true);
    try {
      await lierDevisAuChantier(devisId, chantierId);
      router.refresh();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setEnCours(false);
    }
  }

  async function handleDelier() {
    setErreur(null);
    setEnCours(true);
    try {
      await delierDevisDuChantier(devisId);
      router.refresh();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setEnCours(false);
    }
  }

  if (chantierActuel) {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted">Lié au chantier :</span>
          <span className="font-medium">{chantierActuel.nom}</span>
          <button
            type="button"
            onClick={handleDelier}
            disabled={enCours}
            className="text-muted hover:text-red-600 underline underline-offset-2 disabled:opacity-50"
          >
            {enCours ? "…" : "Délier"}
          </button>
        </div>
        {erreur && <p className="text-sm text-red-600">{erreur}</p>}
      </div>
    );
  }

  if (chantiers.length === 0) {
    return <p className="text-sm text-muted">Aucun chantier disponible pour lier ce devis.</p>;
  }

  return (
    <form onSubmit={handleLier} className="flex items-center gap-2 flex-wrap">
      <select
        value={chantierId}
        onChange={(e) => setChantierId(e.target.value)}
        className="border border-border rounded-md px-3 py-1.5 text-sm bg-surface"
      >
        {chantiers.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nom}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={enCours}
        className="rounded-md border border-border text-sm font-medium px-3 py-1.5 hover:bg-surface transition-colors disabled:opacity-50"
      >
        {enCours ? "Liaison…" : "Lier à ce chantier"}
      </button>
      {erreur && <p className="text-sm text-red-600 w-full">{erreur}</p>}
    </form>
  );
}
