"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { modifierParametresEmail } from "@/app/administrationActions";

export default function EmailReglagesForm({ objetActuel, corpsActuel }: { objetActuel: string; corpsActuel: string }) {
  const router = useRouter();
  const [objet, setObjet] = useState(objetActuel);
  const [corps, setCorps] = useState(corpsActuel);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      await modifierParametresEmail(objet, corps);
      router.refresh();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-2xl">
      <p className="text-sm text-muted">
        Modèle utilisé quand vous cliquez sur « Envoyer par mail » depuis un devis validé. Placeholders disponibles :{" "}
        <code className="text-xs bg-surface border border-border rounded px-1 py-0.5">{"{numero}"}</code>{" "}
        <code className="text-xs bg-surface border border-border rounded px-1 py-0.5">{"{clientNom}"}</code>{" "}
        <code className="text-xs bg-surface border border-border rounded px-1 py-0.5">{"{intitule}"}</code>{" "}
        <code className="text-xs bg-surface border border-border rounded px-1 py-0.5">{"{entreprise}"}</code>. Le mail
        part automatiquement depuis le serveur, PDF du devis en pièce jointe.
      </p>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Objet
        <input
          value={objet}
          onChange={(e) => setObjet(e.target.value)}
          required
          className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Corps du mail
        <textarea
          value={corps}
          onChange={(e) => setCorps(e.target.value)}
          required
          rows={8}
          className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface resize-y"
        />
      </label>
      <button
        type="submit"
        disabled={enCours}
        className="self-start rounded-md bg-accent text-background text-sm font-medium px-4 py-2 hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {enCours ? "Enregistrement…" : "Enregistrer"}
      </button>
      {erreur && <p className="text-sm text-red-600">{erreur}</p>}
    </form>
  );
}
