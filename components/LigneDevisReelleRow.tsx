"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { modifierLigneDevisReelle } from "@/app/catalogueActions";
import { formaterMontant } from "@/lib/finances";

export interface LigneDevisReelleRowData {
  id: string;
  designation: string;
  unite: string | null;
  prixUnitaire: number;
  devis: { id: string; numero: string; valide: boolean };
}

export default function LigneDevisReelleRow({ item }: { item: LigneDevisReelleRowData }) {
  const router = useRouter();
  const [edition, setEdition] = useState(false);
  const [designation, setDesignation] = useState(item.designation);
  const [unite, setUnite] = useState(item.unite ?? "");
  const [prixUnitaire, setPrixUnitaire] = useState(String(item.prixUnitaire));
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  function annuler() {
    setDesignation(item.designation);
    setUnite(item.unite ?? "");
    setPrixUnitaire(String(item.prixUnitaire));
    setErreur(null);
    setEdition(false);
  }

  async function enregistrer() {
    setErreur(null);
    setEnCours(true);
    try {
      await modifierLigneDevisReelle(item.id, { designation, unite: unite || undefined, prixUnitaire: Number(prixUnitaire) });
      setEdition(false);
      router.refresh();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setEnCours(false);
    }
  }

  if (edition) {
    return (
      <tr className="border-b border-border bg-surface">
        <td className="py-2 pr-2">
          <input
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
            className="border border-border rounded-md px-2 py-1 text-sm bg-background w-full min-w-[220px]"
          />
        </td>
        <td className="py-2 pr-2">
          <input
            value={unite}
            onChange={(e) => setUnite(e.target.value)}
            className="border border-border rounded-md px-2 py-1 text-sm bg-background w-16"
          />
        </td>
        <td className="py-2 pr-2 text-right">
          <input
            type="number"
            step="0.01"
            value={prixUnitaire}
            onChange={(e) => setPrixUnitaire(e.target.value)}
            className="border border-border rounded-md px-2 py-1 text-sm bg-background w-24 text-right"
          />
        </td>
        <td className="py-2 pr-0 text-right whitespace-nowrap">
          <button
            type="button"
            onClick={enregistrer}
            disabled={enCours}
            className="text-emerald-700 hover:underline disabled:opacity-50 mr-3"
          >
            {enCours ? "…" : "Enregistrer"}
          </button>
          <button type="button" onClick={annuler} disabled={enCours} className="text-muted hover:underline disabled:opacity-50">
            Annuler
          </button>
          {erreur && <p className="text-xs text-red-600 mt-1">{erreur}</p>}
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-border">
      <td className="py-2 pr-2">{item.designation}</td>
      <td className="py-2 pr-2 text-muted">{item.unite ?? "—"}</td>
      <td className="py-2 pr-2 text-right tabular-nums">{formaterMontant(item.prixUnitaire)}</td>
      <td className="py-2 pr-0 text-right whitespace-nowrap">
        <Link href={`/devis/${item.devis.id}`} className="text-muted hover:underline mr-3">
          {item.devis.numero}
        </Link>
        {item.devis.valide ? (
          <span className="text-xs text-muted" title="Devis validé : non modifiable ici">
            figé
          </span>
        ) : (
          <button type="button" onClick={() => setEdition(true)} className="text-sm hover:underline">
            Modifier
          </button>
        )}
      </td>
    </tr>
  );
}
