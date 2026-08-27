"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { modifierInformationsSociete } from "@/app/administrationActions";
import type { Entreprise } from "@/constants/entreprises";

interface InfoExistante {
  nom: string;
  tagline: string | null;
  adresse: string | null;
  codePostal: string | null;
  ville: string | null;
  telephone: string | null;
  email: string | null;
  siret: string | null;
  tvaIntracom: string | null;
}

export default function InformationsSocieteForm({
  code,
  info,
}: {
  code: Entreprise;
  info: InfoExistante | null;
}) {
  const router = useRouter();
  const [nom, setNom] = useState(info?.nom ?? code);
  const [tagline, setTagline] = useState(info?.tagline ?? "");
  const [adresse, setAdresse] = useState(info?.adresse ?? "");
  const [codePostal, setCodePostal] = useState(info?.codePostal ?? "");
  const [ville, setVille] = useState(info?.ville ?? "");
  const [telephone, setTelephone] = useState(info?.telephone ?? "");
  const [email, setEmail] = useState(info?.email ?? "");
  const [siret, setSiret] = useState(info?.siret ?? "");
  const [tvaIntracom, setTvaIntracom] = useState(info?.tvaIntracom ?? "");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      await modifierInformationsSociete(code, {
        nom,
        tagline: tagline || undefined,
        adresse: adresse || undefined,
        codePostal: codePostal || undefined,
        ville: ville || undefined,
        telephone: telephone || undefined,
        email: email || undefined,
        siret: siret || undefined,
        tvaIntracom: tvaIntracom || undefined,
      });
      router.refresh();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-3">
      <label className="flex flex-col gap-1 text-sm font-medium">
        Nom / raison sociale
        <input
          required
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Sous-titre (optionnel)
        <input
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          placeholder="Ex : Vos espaces immobiliers"
          className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium sm:col-span-2">
        Adresse
        <input
          value={adresse}
          onChange={(e) => setAdresse(e.target.value)}
          placeholder="Ex : 12 rue des Lilas"
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
        SIRET
        <input
          value={siret}
          onChange={(e) => setSiret(e.target.value)}
          className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        TVA intracommunautaire
        <input
          value={tvaIntracom}
          onChange={(e) => setTvaIntracom(e.target.value)}
          className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface"
        />
      </label>
      {erreur && <p className="text-sm text-red-600 sm:col-span-2">{erreur}</p>}
      <button
        type="submit"
        disabled={enCours}
        className="self-start rounded-md bg-accent text-background text-sm font-medium px-4 py-2 hover:opacity-90 transition-opacity disabled:opacity-50 sm:col-span-2"
      >
        {enCours ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}
