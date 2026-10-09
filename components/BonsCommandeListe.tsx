"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  convertirBonCommandeEnFacture,
  envoyerBonCommandeParEmail,
  modifierBonCommande,
  modifierDateBonCommande,
  modifierNumeroBonCommande,
  supprimerBonCommande,
} from "@/app/bonsCommandeActions";
import {
  calculerMontantFactureDepuisBonCommande,
  calculerTotalHTBonCommande,
  estPourcentageValide,
} from "@/lib/bonCommande";
import { formaterMontantPrecis } from "@/lib/finances";
import LignesBonCommandeEditeur, {
  lignesEditionVersSaisie,
  versEdition,
  type LigneEdition,
} from "@/components/LignesBonCommandeEditeur";
import NouveauBonCommandeForm, { type ChoixNouveauBon } from "@/components/NouveauBonCommandeForm";

interface LigneResume {
  designation: string;
  detail: string | null;
  unite: string | null;
  quantite: number;
  prixUnitaire: number;
}

interface BonResume {
  id: string;
  numero: string;
  intitule: string;
  dateBon: Date;
  envoyeLe: Date | null;
  sousTraitantNom: string;
  sousTraitantEmail: string | null;
  totalHT: number;
  lignes: LigneResume[];
  notes: string | null;
  chantier: { id: string; nom: string } | null;
  devis: { id: string; numero: string } | null;
  facture: { id: string; numero: string } | null;
}

function LigneBon({
  bon,
  peutFacturer,
  estAdminPrincipal,
}: {
  bon: BonResume;
  peutFacturer: boolean;
  estAdminPrincipal: boolean;
}) {
  const router = useRouter();
  const [enCours, setEnCours] = useState<"envoi" | "suppression" | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [formFacture, setFormFacture] = useState(false);
  const [pourcentage, setPourcentage] = useState("");
  const [clientNom, setClientNom] = useState("");
  const [clientAdresse, setClientAdresse] = useState("");
  const [tauxTVA, setTauxTVA] = useState("20");
  const [creation, setCreation] = useState(false);
  const [edition, setEdition] = useState(false);
  // Le contenu du bon n'est affiché qu'à la demande : un clic sur la carte l'ouvre ou le referme.
  const [detailOuvert, setDetailOuvert] = useState(false);

  function basculerDetail(e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest("a, button, input, select, textarea, form")) return;
    setDetailOuvert((v) => !v);
  }
  const [lignesEdition, setLignesEdition] = useState<LigneEdition[]>([]);
  const [notesEdition, setNotesEdition] = useState("");
  const [enregistrement, setEnregistrement] = useState(false);
  const [editionNumero, setEditionNumero] = useState(false);
  const [numeroSaisi, setNumeroSaisi] = useState("");
  const [enregistrementNumero, setEnregistrementNumero] = useState(false);
  const [editionDate, setEditionDate] = useState(false);
  const [dateSaisie, setDateSaisie] = useState("");
  const [enregistrementDate, setEnregistrementDate] = useState(false);

  async function enregistrerNumero(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnregistrementNumero(true);
    try {
      await modifierNumeroBonCommande(bon.id, numeroSaisi);
      setEditionNumero(false);
      router.refresh();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setEnregistrementNumero(false);
    }
  }

  async function enregistrerDate(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnregistrementDate(true);
    try {
      await modifierDateBonCommande(bon.id, dateSaisie);
      setEditionDate(false);
      router.refresh();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setEnregistrementDate(false);
    }
  }

  const totalEdition = calculerTotalHTBonCommande(
    lignesEdition.map((l) => ({ quantite: Number(l.quantite) || 0, prixUnitaire: Number(l.prixUnitaire) || 0 }))
  );

  function ouvrirEdition() {
    setLignesEdition(bon.lignes.map(versEdition));
    setNotesEdition(bon.notes ?? "");
    setErreur(null);
    setFormFacture(false);
    setEdition(true);
  }

  async function enregistrerEdition(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnregistrement(true);
    try {
      await modifierBonCommande(bon.id, {
        lignes: lignesEditionVersSaisie(lignesEdition),
        notes: notesEdition,
      });
      setEdition(false);
      router.refresh();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setEnregistrement(false);
    }
  }

  const pourcentageNombre = Number(pourcentage);
  const apercuFacture =
    pourcentage.trim() !== "" && estPourcentageValide(pourcentageNombre)
      ? calculerMontantFactureDepuisBonCommande(bon.lignes, pourcentageNombre)
      : null;

  async function envoyer() {
    if (!bon.sousTraitantEmail) return;
    const deja = bon.envoyeLe ? " (déjà envoyé une fois)" : "";
    if (!window.confirm(`Envoyer le bon de commande ${bon.numero} à ${bon.sousTraitantEmail} ?${deja}`)) return;
    setErreur(null);
    setEnCours("envoi");
    try {
      await envoyerBonCommandeParEmail(bon.id);
      router.refresh();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setEnCours(null);
    }
  }

  async function supprimer() {
    if (!window.confirm(`Supprimer définitivement le bon de commande ${bon.numero} ?`)) return;
    setErreur(null);
    setEnCours("suppression");
    try {
      await supprimerBonCommande(bon.id);
      router.refresh();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Une erreur est survenue.");
      setEnCours(null);
    }
  }

  async function creerFacture(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setCreation(true);
    try {
      const { id } = await convertirBonCommandeEnFacture(bon.id, {
        pourcentage: pourcentageNombre,
        clientNom,
        clientAdresse: clientAdresse || undefined,
        tauxTVA: Number(tauxTVA),
      });
      router.push(`/finance/factures/${id}`);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Une erreur est survenue.");
      setCreation(false);
    }
  }

  return (
    <li className="border border-border rounded-lg bg-surface p-4 flex flex-col gap-3">
      <div
        role="button"
        tabIndex={0}
        aria-expanded={detailOuvert}
        onClick={basculerDetail}
        onKeyDown={(e) => {
          if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            setDetailOuvert((v) => !v);
          }
        }}
        className="flex flex-wrap items-start justify-between gap-3 cursor-pointer"
      >
        <div className="min-w-0">
          {editionNumero ? (
            <form onSubmit={enregistrerNumero} className="flex flex-wrap items-center gap-1.5">
              <input
                required
                value={numeroSaisi}
                onChange={(e) => setNumeroSaisi(e.target.value)}
                className="border border-border rounded-md px-2 py-0.5 text-sm font-semibold bg-background"
              />
              <button type="submit" disabled={enregistrementNumero} className="text-xs font-medium underline disabled:opacity-50">
                {enregistrementNumero ? "…" : "OK"}
              </button>
              <button
                type="button"
                onClick={() => setEditionNumero(false)}
                disabled={enregistrementNumero}
                className="text-xs underline text-muted"
              >
                Annuler
              </button>
            </form>
          ) : (
            <p className="font-semibold">
              {bon.numero} <span className="text-muted font-normal">· {bon.sousTraitantNom}</span>
              {estAdminPrincipal && (
                <button
                  type="button"
                  onClick={() => {
                    setNumeroSaisi(bon.numero);
                    setErreur(null);
                    setEditionNumero(true);
                  }}
                  className="ml-2 text-xs font-normal text-muted underline"
                >
                  Modifier le numéro
                </button>
              )}
            </p>
          )}
          <p className="text-sm text-muted">{bon.intitule}</p>
          <p className="text-xs text-muted mt-0.5 flex flex-wrap gap-x-3">
            {editionDate ? (
              <form onSubmit={enregistrerDate} className="inline-flex items-center gap-1.5">
                <input
                  type="date"
                  required
                  value={dateSaisie}
                  onChange={(e) => setDateSaisie(e.target.value)}
                  className="border border-border rounded-md px-2 py-0.5 text-xs bg-background"
                />
                <button type="submit" disabled={enregistrementDate} className="font-medium underline disabled:opacity-50">
                  {enregistrementDate ? "…" : "OK"}
                </button>
                <button type="button" onClick={() => setEditionDate(false)} disabled={enregistrementDate} className="underline">
                  Annuler
                </button>
              </form>
            ) : (
              <span>
                {format(bon.dateBon, "d MMM yyyy", { locale: fr })}
                {estAdminPrincipal && (
                  <button
                    type="button"
                    onClick={() => {
                      setDateSaisie(bon.dateBon.toISOString().slice(0, 10));
                      setErreur(null);
                      setEditionDate(true);
                    }}
                    className="ml-1.5 underline"
                  >
                    Modifier la date
                  </button>
                )}
              </span>
            )}
            {bon.chantier && (
              <Link href={`/chantiers/${bon.chantier.id}`} className="underline">
                Chantier {bon.chantier.nom}
              </Link>
            )}
            {bon.devis && (
              <Link href={`/devis/${bon.devis.id}`} className="underline">
                Devis {bon.devis.numero}
              </Link>
            )}
          </p>
          {!edition && (
            <p className="text-xs text-muted mt-1" aria-hidden>
              {detailOuvert ? "▾ Masquer le détail" : `▸ Voir le détail (${bon.lignes.length} ligne${bon.lignes.length > 1 ? "s" : ""})`}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold tabular-nums">{formaterMontantPrecis(bon.totalHT)} HT</p>
          <div className="flex flex-wrap justify-end gap-1.5 mt-1">
            {bon.envoyeLe ? (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Envoyé le {format(bon.envoyeLe, "d MMM yyyy", { locale: fr })}
              </span>
            ) : (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-background text-muted border border-border">
                Non envoyé
              </span>
            )}
            {bon.facture && (
              <Link
                href={`/finance/factures/${bon.facture.id}`}
                className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200"
              >
                Facture {bon.facture.numero}
              </Link>
            )}
          </div>
        </div>
      </div>

      {!edition && detailOuvert && (
        <div className="border border-border rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <tbody>
              {bon.lignes.map((l, i) => (
                <tr key={i} className="border-b border-border last:border-b-0">
                  <td className="px-3 py-1.5">
                    <span className="font-medium">{l.designation}</span>
                    {l.detail && <span className="text-muted whitespace-pre-wrap"> — {l.detail}</span>}
                  </td>
                  <td className="px-3 py-1.5 text-muted text-right whitespace-nowrap tabular-nums">
                    {l.quantite} {l.unite ?? ""} × {formaterMontantPrecis(l.prixUnitaire)}
                  </td>
                  <td className="px-3 py-1.5 text-right tabular-nums whitespace-nowrap">
                    {formaterMontantPrecis(l.quantite * l.prixUnitaire)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {bon.notes && (
            <p className="px-3 py-1.5 text-xs text-muted whitespace-pre-wrap border-t border-border">{bon.notes}</p>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <a
          href={`/api/bons-commande/${bon.id}/pdf`}
          className="rounded-md border border-border text-sm font-medium px-3 py-1.5 hover:bg-background transition-colors"
        >
          Télécharger le PDF
        </a>
        <button
          type="button"
          onClick={envoyer}
          disabled={!bon.sousTraitantEmail || enCours !== null}
          title={bon.sousTraitantEmail ? `Envoyer à ${bon.sousTraitantEmail}` : "Ajoutez l'e-mail du sous-traitant dans sa fiche"}
          className="rounded-md bg-foreground text-background text-sm font-medium px-3 py-1.5 hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          {enCours === "envoi" ? "Envoi…" : bon.envoyeLe ? "Renvoyer par e-mail" : "Envoyer par e-mail"}
        </button>
        {!bon.facture && !edition && (
          <button
            type="button"
            onClick={ouvrirEdition}
            className="rounded-md border border-border text-sm font-medium px-3 py-1.5 hover:bg-background transition-colors"
          >
            Modifier le détail
          </button>
        )}
        {peutFacturer && !bon.facture && !edition && (
          <button
            type="button"
            onClick={() => setFormFacture((v) => !v)}
            className="rounded-md border border-border text-sm font-medium px-3 py-1.5 hover:bg-background transition-colors"
          >
            Transformer en facture
          </button>
        )}
        <button
          type="button"
          onClick={supprimer}
          disabled={enCours !== null}
          className="ml-auto text-xs text-muted hover:text-red-600 disabled:opacity-40"
        >
          {enCours === "suppression" ? "Suppression…" : "Supprimer"}
        </button>
      </div>
      {!bon.sousTraitantEmail && (
        <p className="text-xs text-muted">
          Pas d&apos;e-mail pour ce sous-traitant : ajoutez-le dans sa fiche (onglet Sous-traitants) pour pouvoir lui envoyer le bon.
        </p>
      )}

      {edition && !bon.facture && (
        <form onSubmit={enregistrerEdition} className="border-t border-border pt-3 flex flex-col gap-3">
          <p className="text-sm text-muted">
            Détaillez ce que couvre le bon de commande : chaque ligne apparaît sur le PDF envoyé au sous-traitant.
          </p>
          <LignesBonCommandeEditeur lignes={lignesEdition} onChange={setLignesEdition} />
          <label className="flex flex-col gap-1 text-sm font-medium">
            Conditions particulières (optionnel)
            <textarea
              value={notesEdition}
              onChange={(e) => setNotesEdition(e.target.value)}
              rows={2}
              className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-background resize-y"
            />
          </label>
          <p className="text-sm text-muted">
            Total HT du bon de commande:{" "}
            <strong className="text-foreground">{formaterMontantPrecis(totalEdition)}</strong>
          </p>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={enregistrement}
              className="rounded-md bg-foreground text-background text-sm font-medium px-4 py-2 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {enregistrement ? "Enregistrement…" : "Enregistrer"}
            </button>
            <button
              type="button"
              onClick={() => setEdition(false)}
              disabled={enregistrement}
              className="text-sm text-muted hover:underline disabled:opacity-50"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      {formFacture && !bon.facture && (
        <form onSubmit={creerFacture} className="border-t border-border pt-3 flex flex-col gap-3 max-w-2xl">
          <p className="text-sm text-muted">
            Chaque prix unitaire du bon de commande est majoré du pourcentage saisi ; le montant du bon devient le coût de
            réalisation de la facture.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm font-medium">
              Augmentation du prix unitaire (%)
              <input
                required
                type="number"
                min={0}
                step="any"
                value={pourcentage}
                onChange={(e) => setPourcentage(e.target.value)}
                placeholder="Ex : 20"
                className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-background"
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
                className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-background"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">
              Nom du client
              <input
                required
                value={clientNom}
                onChange={(e) => setClientNom(e.target.value)}
                placeholder="Ex : M. et Mme Dupont"
                className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-background"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">
              Adresse du client
              <input
                value={clientAdresse}
                onChange={(e) => setClientAdresse(e.target.value)}
                placeholder="Ex : 12 rue des Lilas, 75012 Paris"
                className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-background"
              />
            </label>
          </div>
          {apercuFacture != null && (
            <p className="text-sm text-muted">
              Montant de la facture : <strong className="text-foreground">{formaterMontantPrecis(apercuFacture)} HT</strong>{" "}
              (bon de commande : {formaterMontantPrecis(bon.totalHT)} HT)
            </p>
          )}
          <button
            type="submit"
            disabled={creation}
            className="self-start rounded-md bg-foreground text-background text-sm font-medium px-4 py-2 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {creation ? "Création…" : "Créer la facture"}
          </button>
        </form>
      )}

      {erreur && <p className="text-sm text-red-600">{erreur}</p>}
    </li>
  );
}

export default function BonsCommandeListe({
  bons,
  peutFacturer,
  estAdminPrincipal,
  choix,
}: {
  bons: BonResume[];
  peutFacturer: boolean;
  estAdminPrincipal: boolean;
  choix: ChoixNouveauBon;
}) {
  const [creation, setCreation] = useState(false);
  return (
    <div className="flex flex-col gap-4">
      {creation ? (
        <NouveauBonCommandeForm {...choix} onClose={() => setCreation(false)} />
      ) : (
        <button
          type="button"
          onClick={() => setCreation(true)}
          className="self-start rounded-md bg-foreground text-background text-sm font-medium px-4 py-2 hover:opacity-90 transition-opacity"
        >
          + Nouveau bon de commande
        </button>
      )}
      {bons.length === 0 ? (
        <p className="text-sm text-muted">
          Aucun bon de commande pour le moment. Créez-en un ci-dessus, ou saisissez un acompte de sous-traitant sur un
          chantier (onglet Finances › Sous-traitant) : le bon de commande est créé automatiquement.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {bons.map((bon) => (
            <LigneBon key={bon.id} bon={bon} peutFacturer={peutFacturer} estAdminPrincipal={estAdminPrincipal} />
          ))}
        </ul>
      )}
    </div>
  );
}
