"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { creerFournisseur, modifierFournisseur, rechercherEntrepriseParSiret } from "@/app/fournisseursActions";
import SaisieTypesMultiples from "@/components/SaisieTypesMultiples";

export interface FournisseurExistant {
  id: string;
  nom: string;
  typesProduit: { type: string }[];
  siret: string | null;
  contactNom: string | null;
  contactPrenom: string | null;
  telephone: string | null;
  email: string | null;
  conditionPaiement: string | null;
  adresse: string | null;
  codePostal: string | null;
  ville: string | null;
  pays: string | null;
  siteWeb: string | null;
  actif: boolean;
  notes: string | null;
}

export default function FournisseurForm({
  fournisseurExistant,
  typesExistants = [],
}: {
  fournisseurExistant?: FournisseurExistant;
  typesExistants?: string[];
}) {
  const router = useRouter();
  const [nom, setNom] = useState(fournisseurExistant?.nom ?? "");
  const [typesProduit, setTypesProduit] = useState<string[]>(
    fournisseurExistant?.typesProduit.map((t) => t.type) ?? []
  );
  const [siret, setSiret] = useState(fournisseurExistant?.siret ?? "");
  const [contactNom, setContactNom] = useState(fournisseurExistant?.contactNom ?? "");
  const [contactPrenom, setContactPrenom] = useState(fournisseurExistant?.contactPrenom ?? "");
  const [telephone, setTelephone] = useState(fournisseurExistant?.telephone ?? "");
  const [email, setEmail] = useState(fournisseurExistant?.email ?? "");
  const [conditionPaiement, setConditionPaiement] = useState(fournisseurExistant?.conditionPaiement ?? "");
  const [adresse, setAdresse] = useState(fournisseurExistant?.adresse ?? "");
  const [codePostal, setCodePostal] = useState(fournisseurExistant?.codePostal ?? "");
  const [ville, setVille] = useState(fournisseurExistant?.ville ?? "");
  const [pays, setPays] = useState(fournisseurExistant?.pays ?? "France");
  const [siteWeb, setSiteWeb] = useState(fournisseurExistant?.siteWeb ?? "");
  const [actif, setActif] = useState(fournisseurExistant?.actif ?? true);
  const [notes, setNotes] = useState(fournisseurExistant?.notes ?? "");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [rechercheEnCours, setRechercheEnCours] = useState(false);
  const [erreurRecherche, setErreurRecherche] = useState<string | null>(null);

  async function handleRechercheSiret() {
    setErreurRecherche(null);
    setRechercheEnCours(true);
    try {
      const infos = await rechercherEntrepriseParSiret(siret);
      setNom(infos.nom || nom);
      if (infos.adresse) setAdresse(infos.adresse);
      if (infos.codePostal) setCodePostal(infos.codePostal);
      if (infos.ville) setVille(infos.ville);
      setSiret(infos.siret);
    } catch (err) {
      setErreurRecherche(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setRechercheEnCours(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      const payload = {
        nom,
        typesProduit,
        siret: siret || undefined,
        contactNom: contactNom || undefined,
        contactPrenom: contactPrenom || undefined,
        telephone: telephone || undefined,
        email: email || undefined,
        conditionPaiement: conditionPaiement || undefined,
        adresse: adresse || undefined,
        codePostal: codePostal || undefined,
        ville: ville || undefined,
        pays: pays || undefined,
        siteWeb: siteWeb || undefined,
        notes: notes || undefined,
        actif,
      };
      if (fournisseurExistant) {
        await modifierFournisseur(fournisseurExistant.id, payload);
        router.push(`/fournisseurs/${fournisseurExistant.id}`);
      } else {
        const { id } = await creerFournisseur(payload);
        router.push(`/fournisseurs/${id}`);
      }
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Une erreur est survenue.");
      setEnCours(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-2xl">
      <div className="flex items-end gap-3">
        <label className="flex flex-col gap-1 text-sm font-medium flex-1">
          SIRET
          <input
            value={siret}
            onChange={(e) => setSiret(e.target.value)}
            placeholder="14 chiffres"
            className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface"
          />
        </label>
        <button
          type="button"
          onClick={handleRechercheSiret}
          disabled={rechercheEnCours || siret.replace(/\D/g, "").length !== 14}
          className="rounded-md border border-border text-sm font-medium px-4 py-2 hover:bg-surface transition-colors disabled:opacity-50"
        >
          {rechercheEnCours ? "Recherche…" : "Rechercher"}
        </button>
      </div>
      {erreurRecherche && <p className="text-sm text-red-600 -mt-3">{erreurRecherche}</p>}
      <p className="text-xs text-muted -mt-4">
        Saisissez le SIRET et cliquez sur « Rechercher » pour pré-remplir automatiquement le nom et l&apos;adresse
        (via l&apos;annuaire public des entreprises françaises).
      </p>

      <div className="grid sm:grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Nom de l&apos;entreprise
          <input
            required
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface"
          />
        </label>
        <div className="sm:col-span-2">
          <SaisieTypesMultiples
            label="Types de produit (plusieurs possibles)"
            valeurs={typesProduit}
            onChange={setTypesProduit}
            suggestions={typesExistants}
            placeholder="Ex : Plomberie, Elec…"
          />
        </div>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Prénom du contact
          <input
            value={contactPrenom}
            onChange={(e) => setContactPrenom(e.target.value)}
            className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Nom du contact
          <input
            value={contactNom}
            onChange={(e) => setContactNom(e.target.value)}
            className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Téléphone
          <input
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
            className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          E-mail
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Condition de paiement
          <input
            value={conditionPaiement}
            onChange={(e) => setConditionPaiement(e.target.value)}
            placeholder="Ex : 30 jours fin de mois"
            className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium sm:col-span-2">
          Adresse
          <input
            value={adresse}
            onChange={(e) => setAdresse(e.target.value)}
            className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Code postal
          <input
            value={codePostal}
            onChange={(e) => setCodePostal(e.target.value)}
            className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Ville
          <input
            value={ville}
            onChange={(e) => setVille(e.target.value)}
            className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Pays
          <input
            value={pays}
            onChange={(e) => setPays(e.target.value)}
            className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Site web
          <input
            value={siteWeb}
            onChange={(e) => setSiteWeb(e.target.value)}
            placeholder="https://..."
            className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Notes
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface resize-y"
        />
      </label>

      <label className="flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          checked={actif}
          onChange={(e) => setActif(e.target.checked)}
          className="rounded border-border"
        />
        Fournisseur actif
      </label>

      {erreur && <p className="text-sm text-red-600">{erreur}</p>}

      <button
        type="submit"
        disabled={enCours}
        className="self-start rounded-md bg-foreground text-background text-sm font-medium px-5 py-2.5 hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {enCours ? "Enregistrement…" : fournisseurExistant ? "Enregistrer les modifications" : "Créer le fournisseur"}
      </button>
    </form>
  );
}
