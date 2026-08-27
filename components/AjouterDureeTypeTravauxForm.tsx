"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ajouterDureeTypeTravaux } from "@/app/catalogueActions";

export default function AjouterDureeTypeTravauxForm() {
  const router = useRouter();
  const [type, setType] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      await ajouterDureeTypeTravaux(type);
      setType("");
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
        Nouveau type de travaux
        <input
          required
          value={type}
          onChange={(e) => setType(e.target.value)}
          placeholder="Ex : Désamiantage"
          className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface"
        />
      </label>
      <button
        type="submit"
        disabled={enCours}
        className="rounded-md border border-border text-sm font-medium px-4 py-2 hover:bg-surface transition-colors disabled:opacity-50"
      >
        {enCours ? "Ajout…" : "+ Ajouter"}
      </button>
      {erreur && <p className="text-sm text-red-600 w-full">{erreur}</p>}
    </form>
  );
}
