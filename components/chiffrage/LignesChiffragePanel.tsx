"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { calculerChiffrage, enregistrerLignesChiffrage } from "@/app/chiffrageActions";
import { calculerTotalHTChiffrage, totauxParLot } from "@/lib/chiffrage";
import { formaterMontantPrecis } from "@/lib/finances";
import { UNITES_LIGNE } from "@/constants/unites";

export interface LigneChiffrageResume {
  id: string;
  lot: string;
  designation: string;
  detail: string | null;
  unite: string | null;
  quantite: number;
  prixUnitaire: number;
}

interface LigneEdition {
  key: string;
  lot: string;
  designation: string;
  detail: string;
  unite: string;
  quantite: string;
  prixUnitaire: string;
}

let cle = 1;

function versEdition(l: LigneChiffrageResume): LigneEdition {
  return {
    key: String(cle++),
    lot: l.lot,
    designation: l.designation,
    detail: l.detail ?? "",
    unite: l.unite ?? "",
    quantite: String(l.quantite),
    prixUnitaire: String(l.prixUnitaire),
  };
}

const CHAMP = "border border-border rounded-md px-2 py-1.5 text-sm bg-background min-w-0";

/** Tableau du chiffrage : calcul automatique depuis les pièces et le barème, puis ajustement ligne par ligne. */
export default function LignesChiffragePanel({
  projetId,
  lignes,
  nbPieces,
}: {
  projetId: string;
  lignes: LigneChiffrageResume[];
  nbPieces: number;
}) {
  const router = useRouter();
  const [edition, setEdition] = useState<LigneEdition[]>(() => lignes.map(versEdition));
  const [modifie, setModifie] = useState(false);
  const [enCours, setEnCours] = useState<"calcul" | "enregistrement" | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const numeriques = edition.map((l) => ({
    lot: l.lot,
    quantite: Number(l.quantite.replace(",", ".")) || 0,
    prixUnitaire: Number(l.prixUnitaire.replace(",", ".")) || 0,
  }));
  const total = calculerTotalHTChiffrage(numeriques);
  const parLot = totauxParLot(numeriques);
  const sansPrix = edition.filter((l) => !(Number(l.prixUnitaire.replace(",", ".")) !== 0)).length;

  function maj(key: string, patch: Partial<LigneEdition>) {
    setEdition((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
    setModifie(true);
    setMessage(null);
  }

  async function calculer() {
    if (
      lignes.length > 0 &&
      !window.confirm("Recalculer le chiffrage remplacera toutes les lignes actuelles, y compris vos modifications. Continuer ?")
    )
      return;
    setErreur(null);
    setMessage(null);
    setEnCours("calcul");
    try {
      const { lignes: n } = await calculerChiffrage(projetId);
      setModifie(false);
      setMessage(`${n} ligne${n > 1 ? "s" : ""} calculée${n > 1 ? "s" : ""}.`);
      router.refresh();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setEnCours(null);
    }
  }

  async function enregistrer() {
    setErreur(null);
    setMessage(null);
    setEnCours("enregistrement");
    try {
      await enregistrerLignesChiffrage(
        projetId,
        edition.map((l) => ({
          lot: l.lot,
          designation: l.designation,
          detail: l.detail,
          unite: l.unite,
          quantite: Number(l.quantite.replace(",", ".")),
          prixUnitaire: Number(l.prixUnitaire.replace(",", ".")),
        }))
      );
      setModifie(false);
      setMessage("Modifications enregistrées.");
      router.refresh();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setEnCours(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={calculer}
          disabled={enCours !== null || nbPieces === 0}
          title={nbPieces === 0 ? "Ajoutez d'abord au moins une pièce" : undefined}
          className="rounded-md bg-foreground text-background text-sm font-medium px-4 py-2 hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          {enCours === "calcul" ? "Calcul…" : lignes.length > 0 ? "Recalculer le chiffrage" : "Calculer le chiffrage"}
        </button>
        {message && <span className="text-sm text-emerald-700">{message}</span>}
      </div>
      {erreur && <p className="text-sm text-red-600">{erreur}</p>}

      {edition.length > 0 && (
        <>
          <p className="text-xs text-muted">
            Les quantités viennent de la surface (ou du périmètre) des pièces concernées ; les ouvertures (portes, fenêtres)
            ne sont pas déduites des murs. Ajustez librement les quantités et les prix.
          </p>
          <div className="flex flex-col gap-2">
            {edition.map((l) => (
              <div key={l.key} className="border border-border rounded-md p-2 bg-surface flex flex-col gap-1.5">
                <div className="grid grid-cols-3 gap-2 items-center md:grid-cols-[1fr_2fr_4.5rem_5.5rem_6.5rem_auto]">
                  <input value={l.lot} onChange={(e) => maj(l.key, { lot: e.target.value })} className={CHAMP} aria-label="Lot" />
                  <input
                    required
                    value={l.designation}
                    onChange={(e) => maj(l.key, { designation: e.target.value })}
                    className={`${CHAMP} col-span-3 md:col-span-1 order-first md:order-none`}
                    aria-label="Désignation"
                  />
                  <select value={l.unite} onChange={(e) => maj(l.key, { unite: e.target.value })} className={CHAMP} aria-label="Unité">
                    <option value="">—</option>
                    {l.unite && !(UNITES_LIGNE as readonly string[]).includes(l.unite) && <option value={l.unite}>{l.unite}</option>}
                    {UNITES_LIGNE.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                  <input
                    required
                    value={l.quantite}
                    onChange={(e) => maj(l.key, { quantite: e.target.value })}
                    inputMode="decimal"
                    className={CHAMP}
                    aria-label="Quantité"
                  />
                  <input
                    required
                    value={l.prixUnitaire}
                    onChange={(e) => maj(l.key, { prixUnitaire: e.target.value })}
                    inputMode="decimal"
                    className={CHAMP}
                    aria-label="Prix unitaire HT"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setEdition((prev) => prev.filter((x) => x.key !== l.key));
                      setModifie(true);
                    }}
                    className="text-xs text-muted hover:text-red-600"
                  >
                    Retirer
                  </button>
                </div>
                <input
                  value={l.detail}
                  onChange={(e) => maj(l.key, { detail: e.target.value })}
                  placeholder="Détail (pièces concernées…)"
                  className={`${CHAMP} text-muted`}
                  aria-label="Détail"
                />
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              setEdition((prev) => [
                ...prev,
                { key: String(cle++), lot: prev[prev.length - 1]?.lot ?? "Divers", designation: "", detail: "", unite: "U", quantite: "1", prixUnitaire: "" },
              ]);
              setModifie(true);
            }}
            className="self-start text-sm font-medium underline underline-offset-2"
          >
            + Ajouter une ligne
          </button>

          <div className="border border-border rounded-md bg-surface p-3 text-sm flex flex-col gap-1 max-w-md">
            {parLot.map((t) => (
              <p key={t.lot} className="flex justify-between gap-4">
                <span className="text-muted">{t.lot}</span>
                <span className="tabular-nums">{formaterMontantPrecis(t.totalHT)}</span>
              </p>
            ))}
            <p className="flex justify-between gap-4 font-semibold border-t border-border pt-1 mt-1">
              <span>Total HT</span>
              <span className="tabular-nums">{formaterMontantPrecis(total)}</span>
            </p>
            {sansPrix > 0 && (
              <p className="text-xs text-amber-700 mt-1">
                {sansPrix} ligne{sansPrix > 1 ? "s" : ""} sans prix : renseignez le barème puis recalculez, ou saisissez le prix ici.
              </p>
            )}
          </div>

          {modifie && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={enregistrer}
                disabled={enCours !== null}
                className="rounded-md bg-foreground text-background text-sm font-medium px-4 py-2 hover:opacity-90 disabled:opacity-50"
              >
                {enCours === "enregistrement" ? "Enregistrement…" : "Enregistrer les modifications"}
              </button>
              <span className="text-xs text-muted">Modifications non enregistrées.</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
