"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { creerDevisDepuisChiffrage } from "@/app/chiffrageActions";
import { ENTREPRISES } from "@/constants/entreprises";

/** Crée un devis pré-rempli à partir des lignes enregistrées du chiffrage. */
export default function DevisChiffragePanel({
  projetId,
  nomProjet,
  adresseProjet,
  chantier,
  nbLignes,
}: {
  projetId: string;
  nomProjet: string;
  adresseProjet: string | null;
  chantier: { nom: string; entreprise: string } | null;
  nbLignes: number;
}) {
  const router = useRouter();
  const [entreprise, setEntreprise] = useState<string>(chantier?.entreprise ?? ENTREPRISES[0]);
  const [intitule, setIntitule] = useState(nomProjet);
  const [clientNom, setClientNom] = useState("");
  const [clientAdresse, setClientAdresse] = useState(adresseProjet ?? "");
  const [tauxTVA, setTauxTVA] = useState("20");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function creer(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      const { id } = await creerDevisDepuisChiffrage(projetId, {
        entreprise,
        intitule,
        clientNom,
        clientAdresse,
        tauxTVA: Number(tauxTVA.replace(",", ".")),
      });
      router.push(`/devis/${id}`);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Une erreur est survenue.");
      setEnCours(false);
    }
  }

  if (nbLignes === 0) {
    return <p className="text-sm text-muted">Calculez d&apos;abord le chiffrage : le devis reprendra ses lignes.</p>;
  }

  return (
    <form onSubmit={creer} className="flex flex-col gap-3 max-w-2xl">
      <p className="text-sm text-muted">
        Le devis reprend les {nbLignes} lignes <strong>enregistrées</strong> du chiffrage (désignation, détail, unité, quantité,
        prix). Vous pourrez le modifier ensuite depuis l&apos;onglet Devis.
        {chantier && ` Il sera rattaché au chantier « ${chantier.nom} » (${chantier.entreprise}).`}
      </p>
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Au nom de
          <select
            value={entreprise}
            onChange={(e) => setEntreprise(e.target.value)}
            disabled={!!chantier}
            className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-background disabled:opacity-60"
          >
            {ENTREPRISES.map((ent) => (
              <option key={ent} value={ent}>
                {ent}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Intitulé du devis
          <input
            required
            value={intitule}
            onChange={(e) => setIntitule(e.target.value)}
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
          Taux de TVA (%)
          <input
            required
            value={tauxTVA}
            onChange={(e) => setTauxTVA(e.target.value)}
            inputMode="decimal"
            className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-background"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium sm:col-span-2">
          Adresse du client / du chantier
          <input
            value={clientAdresse}
            onChange={(e) => setClientAdresse(e.target.value)}
            className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-background"
          />
        </label>
      </div>
      {erreur && <p className="text-sm text-red-600">{erreur}</p>}
      <button
        type="submit"
        disabled={enCours}
        className="self-start rounded-md bg-foreground text-background text-sm font-medium px-4 py-2 hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {enCours ? "Création…" : "Créer le devis"}
      </button>
    </form>
  );
}
