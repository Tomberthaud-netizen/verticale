"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ajouterProduitFournisseur,
  confirmerImportProduitsFournisseur,
  importerProduitsDepuisSiteWeb,
  type ProduitFournisseurCandidat,
} from "@/app/fournisseursActions";
import { LOTS } from "@/constants/lots";
import ProduitFournisseurRow, { type ProduitFournisseurRowData } from "./ProduitFournisseurRow";

export default function ProduitsFournisseurPanel({
  fournisseurId,
  siteWeb,
  produits,
}: {
  fournisseurId: string;
  siteWeb: string | null;
  produits: ProduitFournisseurRowData[];
}) {
  const router = useRouter();

  // Ajout manuel
  const [designation, setDesignation] = useState("");
  const [lot, setLot] = useState("");
  const [unite, setUnite] = useState("");
  const [prixUnitaire, setPrixUnitaire] = useState("");
  const [erreurAjout, setErreurAjout] = useState<string | null>(null);
  const [ajoutEnCours, setAjoutEnCours] = useState(false);

  // Import depuis le site web
  const [importEnCours, setImportEnCours] = useState(false);
  const [erreurImport, setErreurImport] = useState<string | null>(null);
  const [candidats, setCandidats] = useState<(ProduitFournisseurCandidat & { retenu: boolean })[] | null>(null);
  const [confirmationEnCours, setConfirmationEnCours] = useState(false);

  async function soumettreAjout(e: React.FormEvent) {
    e.preventDefault();
    setErreurAjout(null);
    setAjoutEnCours(true);
    try {
      await ajouterProduitFournisseur(fournisseurId, {
        designation,
        lot: lot || undefined,
        unite: unite || undefined,
        prixUnitaire: Number(prixUnitaire),
      });
      setDesignation("");
      setLot("");
      setUnite("");
      setPrixUnitaire("");
      router.refresh();
    } catch (err) {
      setErreurAjout(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setAjoutEnCours(false);
    }
  }

  async function lancerImport() {
    setErreurImport(null);
    setCandidats(null);
    setImportEnCours(true);
    try {
      const resultat = await importerProduitsDepuisSiteWeb(fournisseurId);
      if (resultat.length === 0) {
        setErreurImport("Aucun produit avec un prix affiché n'a été trouvé sur ce site.");
      } else {
        setCandidats(resultat.map((c) => ({ ...c, retenu: true })));
      }
    } catch (err) {
      setErreurImport(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setImportEnCours(false);
    }
  }

  async function confirmerImport() {
    if (!candidats) return;
    const retenus = candidats.filter((c) => c.retenu);
    if (retenus.length === 0) {
      setErreurImport("Sélectionnez au moins un produit à importer.");
      return;
    }
    setConfirmationEnCours(true);
    setErreurImport(null);
    try {
      await confirmerImportProduitsFournisseur(
        fournisseurId,
        retenus.map((c) => ({ designation: c.designation, unite: c.unite, prixUnitaire: c.prixUnitaire, lot: c.lot }))
      );
      setCandidats(null);
      router.refresh();
    } catch (err) {
      setErreurImport(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setConfirmationEnCours(false);
    }
  }

  function majCandidat(index: number, patch: Partial<ProduitFournisseurCandidat & { retenu: boolean }>) {
    setCandidats((prev) => (prev ? prev.map((c, i) => (i === index ? { ...c, ...patch } : c)) : prev));
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">Produits vendus</h2>
        {siteWeb && (
          <button
            type="button"
            onClick={lancerImport}
            disabled={importEnCours}
            className="rounded-md border border-border text-sm font-medium px-3 py-1.5 hover:bg-surface transition-colors disabled:opacity-50"
          >
            {importEnCours ? "Analyse du site en cours…" : "Créer les lignes depuis le site web"}
          </button>
        )}
      </div>
      <p className="text-xs text-muted -mt-2">
        Chaque produit ajouté ici crée automatiquement une ligne jumelle dans le Catalogue de prix.
      </p>

      {erreurImport && <p className="text-sm text-red-600">{erreurImport}</p>}

      {candidats && (
        <div className="border border-border rounded-lg p-4 flex flex-col gap-3 bg-surface">
          <p className="text-sm font-medium">
            {candidats.length} produit{candidats.length > 1 ? "s" : ""} trouvé{candidats.length > 1 ? "s" : ""} sur le site —
            relisez avant d&apos;importer :
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left text-muted border-b border-border">
                  <th className="py-2 pr-2 font-medium" />
                  <th className="py-2 pr-2 font-medium">Désignation</th>
                  <th className="py-2 pr-2 font-medium">Lot</th>
                  <th className="py-2 pr-2 font-medium">Unité</th>
                  <th className="py-2 pr-0 font-medium text-right">Prix unitaire HT</th>
                </tr>
              </thead>
              <tbody>
                {candidats.map((c, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="py-2 pr-2">
                      <input
                        type="checkbox"
                        checked={c.retenu}
                        onChange={(e) => majCandidat(i, { retenu: e.target.checked })}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        value={c.designation}
                        onChange={(e) => majCandidat(i, { designation: e.target.value })}
                        className="border border-border rounded-md px-2 py-1 text-sm bg-background w-full min-w-[200px]"
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <select
                        value={c.lot ?? ""}
                        onChange={(e) => majCandidat(i, { lot: e.target.value || undefined })}
                        className="border border-border rounded-md px-2 py-1 text-sm bg-background"
                      >
                        <option value="">—</option>
                        {LOTS.map((l) => (
                          <option key={l} value={l}>
                            {l}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        value={c.unite ?? ""}
                        onChange={(e) => majCandidat(i, { unite: e.target.value || undefined })}
                        className="border border-border rounded-md px-2 py-1 text-sm bg-background w-16"
                      />
                    </td>
                    <td className="py-2 pr-0 text-right">
                      <input
                        type="number"
                        step="0.01"
                        value={c.prixUnitaire}
                        onChange={(e) => majCandidat(i, { prixUnitaire: Number(e.target.value) })}
                        className="border border-border rounded-md px-2 py-1 text-sm bg-background w-24 text-right"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={confirmerImport}
              disabled={confirmationEnCours}
              className="rounded-md bg-accent text-background text-sm font-medium px-4 py-2 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {confirmationEnCours ? "Import…" : `Importer les produits cochés`}
            </button>
            <button type="button" onClick={() => setCandidats(null)} className="text-sm text-muted hover:underline">
              Annuler
            </button>
          </div>
        </div>
      )}

      {produits.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left text-muted border-b border-border">
                <th className="py-2 pr-2 font-medium">Désignation</th>
                <th className="py-2 pr-2 font-medium">Lot</th>
                <th className="py-2 pr-2 font-medium">Unité</th>
                <th className="py-2 pr-2 font-medium text-right">Prix unitaire HT</th>
                <th className="py-2 pr-2 font-medium text-right">Prix catalogue</th>
                <th className="py-2 pr-2 font-medium text-right">Écart</th>
                <th className="py-2 pr-0 font-medium" />
              </tr>
            </thead>
            <tbody>
              {produits.map((p) => (
                <ProduitFournisseurRow key={p.id} item={p} />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-muted">Aucun produit renseigné pour ce fournisseur.</p>
      )}

      <form onSubmit={soumettreAjout} className="flex flex-wrap items-end gap-3 border-t border-border pt-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted">Désignation</label>
          <input
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
            required
            className="border border-border rounded-md px-3 py-2 text-sm bg-surface min-w-[220px]"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted">Lot</label>
          <select value={lot} onChange={(e) => setLot(e.target.value)} className="border border-border rounded-md px-3 py-2 text-sm bg-surface">
            <option value="">—</option>
            {LOTS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted">Unité</label>
          <input
            value={unite}
            onChange={(e) => setUnite(e.target.value)}
            placeholder="m², ml…"
            className="border border-border rounded-md px-3 py-2 text-sm bg-surface w-20"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted">Prix unitaire HT</label>
          <input
            type="number"
            step="0.01"
            value={prixUnitaire}
            onChange={(e) => setPrixUnitaire(e.target.value)}
            required
            className="border border-border rounded-md px-3 py-2 text-sm bg-surface w-28"
          />
        </div>
        <button
          type="submit"
          disabled={ajoutEnCours}
          className="rounded-md border border-border text-sm font-medium px-4 py-2 hover:bg-surface transition-colors disabled:opacity-50"
        >
          {ajoutEnCours ? "Ajout…" : "+ Ajouter"}
        </button>
      </form>
      {erreurAjout && <p className="text-sm text-red-600">{erreurAjout}</p>}
    </section>
  );
}
