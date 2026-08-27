"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { creerSousTraitant, modifierSousTraitant } from "@/app/sousTraitantsActions";
import { LOTS } from "@/constants/lots";
import SaisieTypesMultiples from "@/components/SaisieTypesMultiples";

export interface SousTraitantExistant {
  id: string;
  nom: string;
  typesTravaux: { type: string }[];
  siret: string | null;
  contactNom: string | null;
  contactPrenom: string | null;
  telephone: string | null;
  email: string | null;
  adresse: string | null;
  codePostal: string | null;
  ville: string | null;
  pays: string | null;
  notes: string | null;
}

export default function SousTraitantForm({
  sousTraitantExistant,
  typesExistants = [],
}: {
  sousTraitantExistant?: SousTraitantExistant;
  typesExistants?: string[];
}) {
  const router = useRouter();
  const [nom, setNom] = useState(sousTraitantExistant?.nom ?? "");
  const [typesTravaux, setTypesTravaux] = useState<string[]>(
    sousTraitantExistant?.typesTravaux.map((t) => t.type) ?? []
  );
  const typesLots = typesTravaux.filter((t) => (LOTS as readonly string[]).includes(t));
  const typesPersonnalises = typesTravaux.filter((t) => !(LOTS as readonly string[]).includes(t));
  const [siret, setSiret] = useState(sousTraitantExistant?.siret ?? "");
  const [contactNom, setContactNom] = useState(sousTraitantExistant?.contactNom ?? "");
  const [contactPrenom, setContactPrenom] = useState(sousTraitantExistant?.contactPrenom ?? "");
  const [telephone, setTelephone] = useState(sousTraitantExistant?.telephone ?? "");
  const [email, setEmail] = useState(sousTraitantExistant?.email ?? "");
  const [adresse, setAdresse] = useState(sousTraitantExistant?.adresse ?? "");
  const [codePostal, setCodePostal] = useState(sousTraitantExistant?.codePostal ?? "");
  const [ville, setVille] = useState(sousTraitantExistant?.ville ?? "");
  const [pays, setPays] = useState(sousTraitantExistant?.pays ?? "France");
  const [notes, setNotes] = useState(sousTraitantExistant?.notes ?? "");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  function toggleType(type: string) {
    setTypesTravaux((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      const payload = {
        nom,
        typesTravaux,
        siret: siret || undefined,
        contactNom: contactNom || undefined,
        contactPrenom: contactPrenom || undefined,
        telephone: telephone || undefined,
        email: email || undefined,
        adresse: adresse || undefined,
        codePostal: codePostal || undefined,
        ville: ville || undefined,
        pays: pays || undefined,
        notes: notes || undefined,
      };
      if (sousTraitantExistant) {
        await modifierSousTraitant(sousTraitantExistant.id, payload);
        router.push(`/sous-traitants/${sousTraitantExistant.id}`);
      } else {
        const { id } = await creerSousTraitant(payload);
        router.push(`/sous-traitants/${id}`);
      }
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Une erreur est survenue.");
      setEnCours(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-2xl">
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
        <label className="flex flex-col gap-1 text-sm font-medium">
          SIRET
          <input
            value={siret}
            onChange={(e) => setSiret(e.target.value)}
            placeholder="14 chiffres"
            className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface"
          />
        </label>
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
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Types de travaux (plusieurs possibles)</span>
        <div className="flex flex-wrap gap-2">
          {LOTS.map((lot) => (
            <label
              key={lot}
              className={`text-sm px-3 py-1.5 rounded-full border cursor-pointer transition-colors ${
                typesTravaux.includes(lot)
                  ? "bg-foreground text-background border-foreground"
                  : "bg-surface border-border hover:border-foreground/30"
              }`}
            >
              <input
                type="checkbox"
                checked={typesTravaux.includes(lot)}
                onChange={() => toggleType(lot)}
                className="sr-only"
              />
              {lot}
            </label>
          ))}
        </div>
        <SaisieTypesMultiples
          label="Autre type de travaux (si non proposé ci-dessus)"
          valeurs={typesPersonnalises}
          onChange={(nouveaux) => setTypesTravaux([...typesLots, ...nouveaux])}
          suggestions={typesExistants.filter((t) => !(LOTS as readonly string[]).includes(t))}
          placeholder="Ex : Désamiantage…"
        />
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

      {erreur && <p className="text-sm text-red-600">{erreur}</p>}

      <button
        type="submit"
        disabled={enCours}
        className="self-start rounded-md bg-foreground text-background text-sm font-medium px-5 py-2.5 hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {enCours ? "Enregistrement…" : sousTraitantExistant ? "Enregistrer les modifications" : "Créer le sous-traitant"}
      </button>
    </form>
  );
}
