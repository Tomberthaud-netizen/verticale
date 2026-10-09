"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ajouterPostesBaremeTypes,
  creerPosteBareme,
  modifierPosteBareme,
  suggererPrixPoste,
  supprimerPosteBareme,
  type PosteBaremeInput,
} from "@/app/chiffrageActions";
import type { SuggestionPrixResult } from "@/lib/suggestionPrixServeur";
import { BASES_CALCUL, TYPES_PIECE, listerTypesPieces } from "@/lib/chiffrage";
import { formaterMontantPrecis } from "@/lib/finances";
import { LOTS } from "@/constants/lots";
import { UNITES_LIGNE } from "@/constants/unites";

interface PosteResume {
  id: string;
  lot: string;
  designation: string;
  unite: string;
  base: string;
  prixUnitaire: number;
  typesPieces: string;
  actif: boolean;
}

const CHAMP = "border border-border rounded-md px-2 py-1.5 text-sm bg-background min-w-0";

function FormulairePoste({ poste, onFini }: { poste?: PosteResume; onFini?: () => void }) {
  const router = useRouter();
  const [lot, setLot] = useState(poste?.lot ?? LOTS[0]);
  const [designation, setDesignation] = useState(poste?.designation ?? "");
  const [unite, setUnite] = useState(poste?.unite ?? "M²");
  const [base, setBase] = useState(poste?.base ?? "SURFACE_SOL");
  const [prix, setPrix] = useState(poste ? String(poste.prixUnitaire) : "");
  const [types, setTypes] = useState<string[]>(poste ? listerTypesPieces(poste.typesPieces) : []);
  const [actif, setActif] = useState(poste?.actif ?? true);
  const [suggestion, setSuggestion] = useState<SuggestionPrixResult | null | "aucune">(null);
  const [enCours, setEnCours] = useState<"enregistrement" | "suppression" | "suggestion" | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  function donnees(): PosteBaremeInput {
    return { lot, designation, unite, base, prixUnitaire: Number(prix), typesPieces: types, actif };
  }

  function changerBase(valeur: string) {
    setBase(valeur);
    const unitaire = BASES_CALCUL.find((b) => b.cle === valeur)?.unite;
    if (unitaire) setUnite(unitaire);
  }

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours("enregistrement");
    try {
      if (poste) await modifierPosteBareme(poste.id, donnees());
      else {
        await creerPosteBareme(donnees());
        setDesignation("");
        setPrix("");
        setSuggestion(null);
      }
      router.refresh();
      onFini?.();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setEnCours(null);
    }
  }

  async function supprimer() {
    if (!poste || !window.confirm(`Supprimer le poste « ${poste.designation} » du barème ?`)) return;
    setErreur(null);
    setEnCours("suppression");
    try {
      await supprimerPosteBareme(poste.id);
      router.refresh();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Une erreur est survenue.");
      setEnCours(null);
    }
  }

  async function suggerer() {
    setErreur(null);
    setEnCours("suggestion");
    try {
      setSuggestion((await suggererPrixPoste(designation, unite)) ?? "aucune");
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setEnCours(null);
    }
  }

  function basculerType(cle: string) {
    setTypes((prev) => (prev.includes(cle) ? prev.filter((t) => t !== cle) : [...prev, cle]));
  }

  return (
    <form onSubmit={enregistrer} className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2 items-center md:grid-cols-[1.2fr_2fr_4.5rem_1.6fr_6.5rem_auto]">
        <select value={lot} onChange={(e) => setLot(e.target.value)} className={CHAMP} aria-label="Lot">
          {LOTS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
          {!(LOTS as readonly string[]).includes(lot) && <option value={lot}>{lot}</option>}
        </select>
        <input
          required
          value={designation}
          onChange={(e) => {
            setDesignation(e.target.value);
            setSuggestion(null);
          }}
          placeholder="Désignation du poste"
          className={`${CHAMP} col-span-2 md:col-span-1`}
        />
        <select value={unite} onChange={(e) => setUnite(e.target.value)} className={CHAMP} aria-label="Unité">
          {UNITES_LIGNE.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
        <select value={base} onChange={(e) => changerBase(e.target.value)} className={CHAMP} aria-label="Base de calcul">
          {BASES_CALCUL.map((b) => (
            <option key={b.cle} value={b.cle}>
              {b.libelle}
            </option>
          ))}
        </select>
        <input
          required
          type="number"
          min={0}
          step="0.01"
          value={prix}
          onChange={(e) => setPrix(e.target.value)}
          placeholder="Prix HT (€)"
          className={CHAMP}
        />
        <button
          type="button"
          onClick={suggerer}
          disabled={!designation.trim() || enCours !== null}
          className="rounded-md border border-border text-xs font-medium px-2 py-1.5 hover:bg-background disabled:opacity-40"
        >
          {enCours === "suggestion" ? "…" : "Suggérer"}
        </button>
      </div>

      <details className="text-sm">
        <summary className="cursor-pointer text-muted">
          Pièces concernées :{" "}
          <span className="text-foreground">
            {types.length === 0 ? "toutes" : types.map((t) => TYPES_PIECE.find((p) => p.cle === t)?.libelle ?? t).join(", ")}
          </span>
        </summary>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
          {TYPES_PIECE.map((t) => (
            <label key={t.cle} className="flex items-center gap-1.5">
              <input type="checkbox" checked={types.includes(t.cle)} onChange={() => basculerType(t.cle)} />
              {t.libelle}
            </label>
          ))}
          <span className="text-xs text-muted w-full">Aucune case cochée = toutes les pièces.</span>
        </div>
      </details>

      {suggestion === "aucune" && (
        <p className="text-xs text-muted">Aucun prix de référence en {unite} trouvé pour cette désignation.</p>
      )}
      {suggestion && suggestion !== "aucune" && (
        <p className="text-xs text-muted flex flex-wrap items-center gap-2">
          <span>
            {suggestion.origine === "DEVIS" ? "Devis" : "Catalogue"} : {formaterMontantPrecis(suggestion.prixActualise ?? suggestion.prixSource)}/{suggestion.unite ?? unite}
            {suggestion.prixActualise != null && suggestion.prixActualise !== suggestion.prixSource
              ? ` (${formaterMontantPrecis(suggestion.prixSource)} actualisé)`
              : ""}{" "}
            — {suggestion.sourceLabel}
          </span>
          <button
            type="button"
            onClick={() => setPrix(String(Math.round((suggestion.prixActualise ?? suggestion.prixSource) * 100) / 100))}
            className="font-medium underline text-foreground"
          >
            Utiliser ce prix
          </button>
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={enCours !== null}
          className="rounded-md bg-foreground text-background text-sm font-medium px-3 py-1.5 hover:opacity-90 disabled:opacity-50"
        >
          {enCours === "enregistrement" ? "Enregistrement…" : poste ? "Enregistrer" : "Ajouter le poste"}
        </button>
        <label className="flex items-center gap-1.5 text-sm">
          <input type="checkbox" checked={actif} onChange={(e) => setActif(e.target.checked)} />
          Actif
        </label>
        {poste && (
          <button
            type="button"
            onClick={supprimer}
            disabled={enCours !== null}
            className="ml-auto text-xs text-muted hover:text-red-600 disabled:opacity-40"
          >
            {enCours === "suppression" ? "Suppression…" : "Supprimer"}
          </button>
        )}
      </div>
      {erreur && <p className="text-sm text-red-600">{erreur}</p>}
    </form>
  );
}

export default function BaremeEditeur({ postes }: { postes: PosteResume[] }) {
  const router = useRouter();
  const [enCours, setEnCours] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function ajouterTypes() {
    setEnCours(true);
    setMessage(null);
    try {
      const { ajoutes } = await ajouterPostesBaremeTypes();
      setMessage(
        ajoutes === 0
          ? "Tous les postes types sont déjà dans le barème."
          : `${ajoutes} poste${ajoutes > 1 ? "s" : ""} ajouté${ajoutes > 1 ? "s" : ""} avec un prix à 0 € : renseignez vos prix.`
      );
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={ajouterTypes}
          disabled={enCours}
          className="rounded-md border border-border text-sm font-medium px-3 py-1.5 hover:bg-background transition-colors disabled:opacity-50"
        >
          {enCours ? "Ajout…" : "Ajouter les postes types (sans prix)"}
        </button>
        {message && <p className="text-sm text-muted">{message}</p>}
      </div>

      {postes.length === 0 ? (
        <p className="text-sm text-muted">Votre barème est vide : ajoutez un poste ci-dessous ou partez des postes types.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {postes.map((p) => (
            <li key={p.id} className={`border border-border rounded-lg bg-surface p-3 ${p.actif ? "" : "opacity-60"}`}>
              <FormulairePoste poste={p} />
            </li>
          ))}
        </ul>
      )}

      <div className="border border-dashed border-border rounded-lg p-3">
        <p className="text-sm font-semibold mb-2">Nouveau poste</p>
        <FormulairePoste />
      </div>
    </div>
  );
}
