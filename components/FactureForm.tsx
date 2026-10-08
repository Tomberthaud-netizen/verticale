"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { creerFacture } from "@/app/financeActions";
import { calculerMontantTVA, calculerTotalTTC } from "@/lib/devis";
import { formaterMontant } from "@/lib/finances";

interface DevisOption {
  id: string;
  numero: string;
  intitule: string;
  entreprise: string;
  clientNom: string | null;
  clientAdresse: string | null;
}

export default function FactureForm({
  devisDisponibles,
  chantiers,
  entrepriseActive,
}: {
  devisDisponibles: DevisOption[];
  chantiers: { id: string; nom: string }[];
  entrepriseActive: string;
}) {
  const router = useRouter();
  const [devisId, setDevisId] = useState("");
  const [chantierId, setChantierId] = useState("");
  const [clientNom, setClientNom] = useState("");
  const [clientAdresse, setClientAdresse] = useState("");
  const [montantHT, setMontantHT] = useState("");
  const [coutRealisationHT, setCoutRealisationHT] = useState("");
  const [tauxTVA, setTauxTVA] = useState("20");
  const [dateFacture, setDateFacture] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [dateEcheance, setDateEcheance] = useState("");
  const [notes, setNotes] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  function handleChoixDevis(id: string) {
    setDevisId(id);
    const devis = devisDisponibles.find((d) => d.id === id);
    if (devis) {
      if (devis.clientNom) setClientNom(devis.clientNom);
      if (devis.clientAdresse) setClientAdresse(devis.clientAdresse);
    }
  }

  const montantHTNum = Number(montantHT) || 0;
  const tauxTVANum = Number(tauxTVA) || 0;
  const montantTVA = calculerMontantTVA(montantHTNum, tauxTVANum);
  const montantTTC = calculerTotalTTC(montantHTNum, montantTVA);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      const { id } = await creerFacture({
        devisId: devisId || undefined,
        chantierId: chantierId || undefined,
        clientNom: clientNom || undefined,
        clientAdresse: clientAdresse || undefined,
        montantHT: montantHTNum,
        coutRealisationHT: coutRealisationHT.trim() === "" ? undefined : Number(coutRealisationHT),
        tauxTVA: tauxTVANum,
        dateFacture,
        dateEcheance: dateEcheance || undefined,
        notes: notes || undefined,
      });
      router.push(`/finance/factures/${id}`);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Une erreur est survenue.");
      setEnCours(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-2xl">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1 text-sm font-medium">
          Entreprise
          <div className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-background text-muted">
            {entrepriseActive}
          </div>
        </div>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Devis lié (optionnel)
          <select
            value={devisId}
            onChange={(e) => handleChoixDevis(e.target.value)}
            className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface"
          >
            <option value="">Aucun</option>
            {devisDisponibles.map((d) => (
              <option key={d.id} value={d.id}>
                {d.numero} — {d.intitule}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Chantier lié (optionnel)
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
        <label className="flex flex-col gap-1 text-sm font-medium">
          Client (nom)
          <input
            value={clientNom}
            onChange={(e) => setClientNom(e.target.value)}
            className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium sm:col-span-2">
          Client (adresse)
          <input
            value={clientAdresse}
            onChange={(e) => setClientAdresse(e.target.value)}
            className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Montant vendu HT
          <input
            required
            type="number"
            min={0}
            step="0.01"
            value={montantHT}
            onChange={(e) => setMontantHT(e.target.value)}
            className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Coût de réalisation HT (optionnel)
          <input
            type="number"
            min={0}
            step="0.01"
            value={coutRealisationHT}
            onChange={(e) => setCoutRealisationHT(e.target.value)}
            placeholder="Ex : matériaux déjà avancés"
            className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface"
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
        <label className="flex flex-col gap-1 text-sm font-medium">
          Date de facture
          <input
            required
            type="date"
            value={dateFacture}
            onChange={(e) => setDateFacture(e.target.value)}
            className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Date d&apos;échéance (optionnel)
          <input
            type="date"
            value={dateEcheance}
            onChange={(e) => setDateEcheance(e.target.value)}
            className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Notes
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface resize-y"
        />
      </label>

      <div className="flex flex-wrap gap-4">
        <div className="bg-surface border border-border rounded-lg p-4 flex-1 min-w-[140px]">
          <p className="text-sm text-muted font-medium">TVA</p>
          <p className="text-xl font-semibold mt-1">{formaterMontant(montantTVA)}</p>
        </div>
        <div className="bg-surface border border-border rounded-lg p-4 flex-1 min-w-[140px]">
          <p className="text-sm text-muted font-medium">Total TTC</p>
          <p className="text-xl font-semibold mt-1">{formaterMontant(montantTTC)}</p>
        </div>
      </div>

      {erreur && <p className="text-sm text-red-600">{erreur}</p>}

      <button
        type="submit"
        disabled={enCours}
        className="self-start rounded-md bg-foreground text-background text-sm font-medium px-5 py-2.5 hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {enCours ? "Enregistrement…" : "Créer la facture"}
      </button>
    </form>
  );
}
