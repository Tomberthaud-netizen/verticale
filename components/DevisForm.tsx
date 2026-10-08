"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { createDevis, modifierDevis, suggererPrix, type LigneDevisInput, type SuggestionPrixResult } from "@/app/actions";
import {
  calculerMontantTVA,
  calculerTotalHT,
  calculerTotalHTNet,
  calculerTotalLigne,
  calculerTotalLigneTTC,
  calculerTotalTTC,
} from "@/lib/devis";
import { formaterMontantPrecis } from "@/lib/finances";
import { filtrerDesignations } from "@/lib/suggestionPrix";
import { UNITES_LIGNE as UNITES } from "@/constants/unites";

interface LigneDraft {
  key: string;
  designation: string;
  detail: string;
  unite: string;
  quantite: string;
  prixUnitaire: string;
  suggestion: SuggestionPrixResult | null;
  suggestionEnCours: boolean;
  suggestionRecherchee: boolean;
  completionsOuvertes: boolean;
}


let nextKey = 1;

function ligneVide(): LigneDraft {
  return {
    key: String(nextKey++),
    designation: "",
    detail: "",
    unite: "",
    quantite: "1",
    prixUnitaire: "",
    suggestion: null,
    suggestionEnCours: false,
    suggestionRecherchee: false,
    completionsOuvertes: false,
  };
}

export interface DevisExistant {
  id: string;
  numero: string;
  intitule: string;
  entreprise: string;
  chantierId: string | null;
  responsableId: string | null;
  clientNom: string | null;
  clientAdresse: string | null;
  clientEmail: string | null;
  clientTelephone: string | null;
  dateDevis: Date;
  validiteJours: number | null;
  tauxTVA: number;
  remiseHT: number;
  colonneTTC: boolean;
  notes: string | null;
  lignes: { designation: string; detail: string | null; unite: string | null; quantite: number; prixUnitaire: number }[];
}

export default function DevisForm({
  designationsExistantes,
  devisExistant,
  chantiers = [],
  chantierIdInitial,
  personnes = [],
  entrepriseActive,
  estAdminPrincipal = false,
}: {
  designationsExistantes: string[];
  devisExistant?: DevisExistant;
  chantiers?: { id: string; nom: string }[];
  chantierIdInitial?: string;
  personnes?: { id: string; nom: string; prenom: string }[];
  entrepriseActive?: string;
  /** Le numéro de devis (référence légale/comptable) n'est modifiable que par l'administrateur
   * principal — le champ est masqué pour tout le monde d'autre. */
  estAdminPrincipal?: boolean;
}) {
  const router = useRouter();
  const entreprise = devisExistant?.entreprise ?? entrepriseActive ?? "VERTICALE";
  const peutModifierNumero = !!devisExistant && estAdminPrincipal;
  const [numero, setNumero] = useState(devisExistant?.numero ?? "");
  const [intitule, setIntitule] = useState(devisExistant?.intitule ?? "");
  const [chantierId, setChantierId] = useState(devisExistant?.chantierId ?? chantierIdInitial ?? "");
  const [responsableId, setResponsableId] = useState(devisExistant?.responsableId ?? "");
  const [clientNom, setClientNom] = useState(devisExistant?.clientNom ?? "");
  const [clientAdresse, setClientAdresse] = useState(devisExistant?.clientAdresse ?? "");
  const [clientEmail, setClientEmail] = useState(devisExistant?.clientEmail ?? "");
  const [clientTelephone, setClientTelephone] = useState(devisExistant?.clientTelephone ?? "");
  const [dateDevis, setDateDevis] = useState(() =>
    format(devisExistant?.dateDevis ?? new Date(), "yyyy-MM-dd")
  );
  const [validiteJours, setValiditeJours] = useState(
    devisExistant?.validiteJours != null ? String(devisExistant.validiteJours) : "30"
  );
  const [tauxTVA, setTauxTVA] = useState(String(devisExistant?.tauxTVA ?? 20));
  const [remiseHT, setRemiseHT] = useState(devisExistant?.remiseHT ? String(devisExistant.remiseHT) : "");
  const [colonneTTC, setColonneTTC] = useState(devisExistant?.colonneTTC ?? false);
  const [notes, setNotes] = useState(devisExistant?.notes ?? "");
  const [lignes, setLignes] = useState<LigneDraft[]>(
    devisExistant && devisExistant.lignes.length > 0
      ? devisExistant.lignes.map((l) => ({
          key: String(nextKey++),
          designation: l.designation,
          detail: l.detail ?? "",
          unite: l.unite ?? "",
          quantite: String(l.quantite),
          prixUnitaire: String(l.prixUnitaire),
          suggestion: null,
          suggestionEnCours: false,
          suggestionRecherchee: false,
          completionsOuvertes: false,
        }))
      : [ligneVide()]
  );
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const lignesCalcul = useMemo<LigneDevisInput[]>(
    () =>
      lignes.map((l) => ({
        designation: l.designation,
        detail: l.detail,
        unite: l.unite,
        quantite: Number(l.quantite) || 0,
        prixUnitaire: Number(l.prixUnitaire) || 0,
      })),
    [lignes]
  );
  const sousTotalHT = calculerTotalHT(lignesCalcul);
  const remiseHTNum = Number(remiseHT) || 0;
  const totalHT = calculerTotalHTNet(sousTotalHT, remiseHTNum);
  const tauxTVANum = Number(tauxTVA) || 0;
  // Désignation | Détail | Unité | Qté | PU | Total HT | [Total TTC] | Retirer
  const colonnesLigne = colonneTTC
    ? "1.5fr 1fr 5rem 5rem 7rem 7rem 7rem auto"
    : "1.5fr 1fr 5rem 5rem 7rem 7rem auto";
  const montantTVA = calculerMontantTVA(totalHT, tauxTVANum);
  const totalTTC = calculerTotalTTC(totalHT, montantTVA);

  function ajouterLigne() {
    setLignes((prev) => [...prev, ligneVide()]);
  }

  function supprimerLigne(key: string) {
    setLignes((prev) => prev.filter((l) => l.key !== key));
  }

  function modifierLigne(key: string, patch: Partial<LigneDraft>) {
    setLignes((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  async function chargerSuggestion(key: string, designation: string) {
    if (!designation.trim()) {
      modifierLigne(key, { suggestion: null, suggestionRecherchee: false });
      return;
    }
    modifierLigne(key, { suggestionEnCours: true });
    try {
      const suggestion = await suggererPrix(designation, dateDevis);
      modifierLigne(key, { suggestion, suggestionEnCours: false, suggestionRecherchee: true });
    } catch {
      modifierLigne(key, { suggestionEnCours: false, suggestionRecherchee: true });
    }
  }

  function appliquerSuggestion(key: string, suggestion: SuggestionPrixResult) {
    modifierLigne(key, { prixUnitaire: String(suggestion.prixActualise ?? suggestion.prixSource) });
  }

  function choisirDesignation(key: string, designation: string) {
    modifierLigne(key, { designation, completionsOuvertes: false });
    chargerSuggestion(key, designation);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    if (lignes.length === 0) {
      setErreur("Ajoutez au moins une ligne de travaux.");
      return;
    }
    setEnCours(true);
    try {
      const payload = {
        numero: peutModifierNumero ? numero || undefined : undefined,
        intitule,
        chantierId: chantierId || undefined,
        responsableId: responsableId || undefined,
        clientNom: clientNom || undefined,
        clientAdresse: clientAdresse || undefined,
        clientEmail: clientEmail || undefined,
        clientTelephone: clientTelephone || undefined,
        dateDevis,
        validiteJours: validiteJours.trim() === "" ? null : Number(validiteJours),
        tauxTVA: tauxTVANum,
        remiseHT: remiseHTNum,
        colonneTTC,
        notes: notes || undefined,
        lignes: lignesCalcul,
      };
      if (devisExistant) {
        await modifierDevis(devisExistant.id, payload);
        router.push(`/devis/${devisExistant.id}`);
      } else {
        const { id } = await createDevis(payload);
        router.push(`/devis/${id}`);
      }
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Une erreur est survenue.");
      setEnCours(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-5xl">
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Intitulé du devis
          <input
            required
            value={intitule}
            onChange={(e) => setIntitule(e.target.value)}
            className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface"
            placeholder="Ex : Rénovation salle de bain"
          />
        </label>
        <div className="flex flex-col gap-1 text-sm font-medium">
          Entreprise
          <div className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-background text-muted">
            {entreprise}
          </div>
        </div>
        {peutModifierNumero && (
          <label className="flex flex-col gap-1 text-sm font-medium">
            Numéro du devis
            <input
              required
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface"
              placeholder="Ex : VRT-2026-0007"
            />
            <span className="text-xs text-muted font-normal">
              Réservé à l&apos;administrateur principal — doit rester unique.
            </span>
          </label>
        )}
        {!devisExistant && chantiers.length > 0 && (
          <label className="flex flex-col gap-1 text-sm font-medium">
            Chantier (optionnel)
            <select
              value={chantierId}
              onChange={(e) => setChantierId(e.target.value)}
              className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface"
            >
              <option value="">Aucun</option>
              {chantiers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom}
                </option>
              ))}
            </select>
          </label>
        )}
        {personnes.length > 0 && (
          <label className="flex flex-col gap-1 text-sm font-medium">
            Responsable (optionnel)
            <select
              value={responsableId}
              onChange={(e) => setResponsableId(e.target.value)}
              className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface"
            >
              <option value="">Non attribué</option>
              {personnes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.prenom} {p.nom}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="flex flex-col gap-1 text-sm font-medium">
          Client (nom)
          <input
            value={clientNom}
            onChange={(e) => setClientNom(e.target.value)}
            className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface"
            placeholder="Ex : M. et Mme Dupont"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Email du client
          <input
            type="email"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
            className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface"
            placeholder="Ex : client@exemple.fr"
          />
          <span className="text-xs text-muted font-normal">Utilisé pour l&apos;envoi du devis par mail une fois validé.</span>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Téléphone du client
          <input
            type="tel"
            value={clientTelephone}
            onChange={(e) => setClientTelephone(e.target.value)}
            className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface"
            placeholder="Ex : 06 12 34 56 78"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Adresse exacte {!chantierId && <span className="text-red-600">*</span>}
          <input
            required={!chantierId}
            value={clientAdresse}
            onChange={(e) => setClientAdresse(e.target.value)}
            className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface"
            placeholder="Ex : 12 rue des Lilas, 75012 Paris"
          />
          {!chantierId && (
            <span className="text-xs text-muted font-normal">
              Obligatoire tant qu&apos;aucun chantier n&apos;est lié.
            </span>
          )}
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Date du devis
          <input
            required
            type="date"
            value={dateDevis}
            onChange={(e) => setDateDevis(e.target.value)}
            className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Validité de l&apos;offre (jours)
          <input
            type="number"
            min={1}
            value={validiteJours}
            onChange={(e) => setValiditeJours(e.target.value)}
            className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface"
            placeholder="Ex : 30"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Taux de TVA (%)
          <input
            required
            type="number"
            min={0}
            step="0.1"
            value={tauxTVA}
            onChange={(e) => setTauxTVA(e.target.value)}
            className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface"
          />
        </label>
        <label className="flex items-center gap-2 text-sm font-medium sm:col-span-2">
          <input
            type="checkbox"
            checked={colonneTTC}
            onChange={(e) => setColonneTTC(e.target.checked)}
            className="rounded border-border"
          />
          Ajouter une colonne « Total TTC » sur chaque ligne
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Notes / conditions particulières
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface resize-y"
        />
      </label>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Lignes de travaux</h3>
          <button
            type="button"
            onClick={ajouterLigne}
            className="text-sm font-medium text-foreground underline underline-offset-2"
          >
            + Ajouter une ligne
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {lignes.map((ligne, i) => (
            <div key={ligne.key} className="flex flex-col gap-1">
              <div
                className="grid items-center gap-2 border border-border rounded-md p-2 bg-surface"
                style={{ gridTemplateColumns: colonnesLigne }}
              >
                <div className="relative min-w-0">
                  <input
                    type="text"
                    required
                    autoComplete="off"
                    value={ligne.designation}
                    onChange={(e) =>
                      modifierLigne(ligne.key, {
                        designation: e.target.value,
                        completionsOuvertes: true,
                        suggestion: null,
                        suggestionRecherchee: false,
                      })
                    }
                    onFocus={() => modifierLigne(ligne.key, { completionsOuvertes: true })}
                    onBlur={(e) => {
                      modifierLigne(ligne.key, { completionsOuvertes: false });
                      chargerSuggestion(ligne.key, e.target.value);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") modifierLigne(ligne.key, { completionsOuvertes: false });
                    }}
                    placeholder="Type de travaux (ex : Peinture murs)"
                    className="w-full border border-border rounded-md px-2 py-1.5 text-sm bg-surface min-w-0"
                  />
                  {ligne.completionsOuvertes &&
                    (() => {
                      const completions = filtrerDesignations(designationsExistantes, ligne.designation);
                      if (completions.length === 0) return null;
                      return (
                        <ul className="absolute z-10 top-full left-0 right-0 mt-1 bg-surface border border-border rounded-md shadow-md max-h-48 overflow-y-auto">
                          {completions.map((completion) => (
                            <li key={completion}>
                              <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => choisirDesignation(ligne.key, completion)}
                                className="w-full text-left px-2 py-1.5 text-sm hover:bg-background"
                              >
                                {completion}
                              </button>
                            </li>
                          ))}
                        </ul>
                      );
                    })()}
                </div>
                <input
                  type="text"
                  autoComplete="off"
                  value={ligne.detail}
                  onChange={(e) => modifierLigne(ligne.key, { detail: e.target.value })}
                  placeholder="Détail (optionnel)"
                  className="w-full border border-border rounded-md px-2 py-1.5 text-sm bg-surface min-w-0"
                />
                <select
                  value={ligne.unite}
                  onChange={(e) => modifierLigne(ligne.key, { unite: e.target.value })}
                  className="border border-border rounded-md px-2 py-1.5 text-sm bg-surface min-w-0"
                >
                  <option value="">Unité</option>
                  {ligne.unite && !(UNITES as readonly string[]).includes(ligne.unite) && (
                    <option value={ligne.unite}>{ligne.unite}</option>
                  )}
                  {UNITES.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  required
                  min={0}
                  step="0.01"
                  value={ligne.quantite}
                  onChange={(e) => modifierLigne(ligne.key, { quantite: e.target.value })}
                  placeholder="Qté"
                  className="border border-border rounded-md px-2 py-1.5 text-sm bg-surface min-w-0"
                />
                <input
                  type="number"
                  required
                  step="0.01"
                  value={ligne.prixUnitaire}
                  onChange={(e) => modifierLigne(ligne.key, { prixUnitaire: e.target.value })}
                  placeholder="PU (€)"
                  title="Un prix unitaire négatif déduit le montant du devis (ex : matériaux payés directement par le client)"
                  className="border border-border rounded-md px-2 py-1.5 text-sm bg-surface min-w-0"
                />
                <span className="text-sm text-muted text-right tabular-nums">
                  {formaterMontantPrecis(calculerTotalLigne(lignesCalcul[i]))}
                </span>
                {colonneTTC && (
                  <span className="text-sm text-muted text-right tabular-nums">
                    {formaterMontantPrecis(calculerTotalLigneTTC(lignesCalcul[i], tauxTVANum))} TTC
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => supprimerLigne(ligne.key)}
                  disabled={lignes.length === 1}
                  className="text-sm text-muted hover:text-red-600 disabled:opacity-30 disabled:hover:text-muted"
                >
                  Retirer
                </button>
              </div>

              {ligne.suggestionEnCours && (
                <p className="text-xs text-muted px-1">Recherche d&apos;un prix de référence…</p>
              )}
              {!ligne.suggestionEnCours && ligne.suggestion && (
                <div className="text-xs text-muted px-1 flex items-center gap-2 flex-wrap">
                  <span>
                    {ligne.suggestion.origine === "DEVIS" ? "💡 Référence" : "📋 Estimation catalogue"}
                    {" "}
                    {formaterMontantPrecis(ligne.suggestion.prixSource)}
                    {ligne.suggestion.dateSourceISO ? (
                      <> le {format(new Date(ligne.suggestion.dateSourceISO), "d MMM yyyy", { locale: fr })}</>
                    ) : (
                      <> (date inconnue)</>
                    )}{" "}
                    ({ligne.suggestion.sourceLabel})
                    {ligne.suggestion.confiance && (
                      <> · fiabilité {ligne.suggestion.confiance.toLowerCase()}</>
                    )}
                    {ligne.suggestion.prixActualise != null ? (
                      <>
                        {" "}
                        · actualisé indice BT :{" "}
                        <strong className="text-foreground">{formaterMontantPrecis(ligne.suggestion.prixActualise)}</strong>
                      </>
                    ) : (
                      <> · indice BT indisponible pour cette période, prix non actualisé</>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => appliquerSuggestion(ligne.key, ligne.suggestion!)}
                    className="underline underline-offset-2 shrink-0 text-foreground"
                  >
                    Utiliser
                  </button>
                </div>
              )}
              {!ligne.suggestionEnCours && ligne.suggestionRecherchee && !ligne.suggestion && (
                <p className="text-xs text-muted px-1">Aucune référence de prix trouvée pour cette désignation.</p>
              )}
            </div>
          ))}
        </div>
      </div>

      <label className="flex flex-col gap-1 text-sm font-medium max-w-xs">
        Remise commerciale (HT)
        <input
          type="number"
          min={0}
          max={sousTotalHT}
          step="0.01"
          value={remiseHT}
          onChange={(e) => setRemiseHT(e.target.value)}
          placeholder="0"
          className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface"
        />
      </label>

      <div className="flex flex-wrap gap-4">
        {remiseHTNum > 0 && (
          <>
            <div className="bg-surface border border-border rounded-lg p-4 flex-1 min-w-[160px]">
              <p className="text-sm text-muted font-medium">Sous-total HT</p>
              <p className="text-xl font-semibold mt-1">{formaterMontantPrecis(sousTotalHT)}</p>
            </div>
            <div className="bg-surface border border-border rounded-lg p-4 flex-1 min-w-[160px]">
              <p className="text-sm text-muted font-medium">Remise commerciale</p>
              <p className="text-xl font-semibold mt-1 text-red-600">-{formaterMontantPrecis(remiseHTNum)}</p>
            </div>
          </>
        )}
        <div className="bg-surface border border-border rounded-lg p-4 flex-1 min-w-[160px]">
          <p className="text-sm text-muted font-medium">Total HT</p>
          <p className="text-xl font-semibold mt-1">{formaterMontantPrecis(totalHT)}</p>
        </div>
        <div className="bg-surface border border-border rounded-lg p-4 flex-1 min-w-[160px]">
          <p className="text-sm text-muted font-medium">TVA ({tauxTVANum}%)</p>
          <p className="text-xl font-semibold mt-1">{formaterMontantPrecis(montantTVA)}</p>
        </div>
        <div className="bg-surface border border-border rounded-lg p-4 flex-1 min-w-[160px]">
          <p className="text-sm text-muted font-medium">Total TTC</p>
          <p className="text-xl font-semibold mt-1">{formaterMontantPrecis(totalTTC)}</p>
        </div>
      </div>

      {erreur && <p className="text-sm text-red-600">{erreur}</p>}

      <button
        type="submit"
        disabled={enCours}
        className="self-start rounded-md bg-foreground text-background text-sm font-medium px-5 py-2.5 hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {enCours ? "Enregistrement…" : devisExistant ? "Enregistrer les modifications" : "Créer le devis"}
      </button>
    </form>
  );
}
