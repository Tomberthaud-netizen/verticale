"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { upsertIndiceBT } from "@/app/actions";

export default function IndiceBTForm() {
  const router = useRouter();
  const [periode, setPeriode] = useState(() => format(new Date(), "yyyy-MM"));
  const [valeur, setValeur] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      await upsertIndiceBT(periode, Number(valeur));
      setValeur("");
      router.refresh();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-3">
      <label className="flex flex-col gap-1 text-sm font-medium">
        Période
        <input
          required
          type="month"
          value={periode}
          onChange={(e) => setPeriode(e.target.value)}
          className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Valeur de l&apos;indice
        <input
          required
          type="number"
          min={0}
          step="0.1"
          value={valeur}
          onChange={(e) => setValeur(e.target.value)}
          placeholder="Ex : 138.3"
          className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface w-32"
        />
      </label>
      {erreur && <p className="text-sm text-red-600">{erreur}</p>}
      <button
        type="submit"
        disabled={enCours}
        className="rounded-md bg-foreground text-background text-sm font-medium px-4 py-2 hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {enCours ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}
