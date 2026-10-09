"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { creerBonCommandeLibre } from "@/app/bonsCommandeActions";
import { calculerTotalHTBonCommande } from "@/lib/bonCommande";
import { formaterMontantPrecis } from "@/lib/finances";
import LignesBonCommandeEditeur, { ligneVide, lignesEditionVersSaisie } from "@/components/LignesBonCommandeEditeur";

export interface ChoixNouveauBon {
  sousTraitants: { id: string; nom: string }[];
  chantiers: { id: string; nom: string; adresse: string }[];
}

/** Formulaire de création d'un bon de commande à la main, au nom de l'entreprise active. */
export default function NouveauBonCommandeForm({
  sousTraitants,
  chantiers,
  onClose,
}: ChoixNouveauBon & { onClose: () => void }) {
  const router = useRouter();
  const [sousTraitantId, setSousTraitantId] = useState("");
  const [chantierId, setChantierId] = useState("");
  const [intitule, setIntitule] = useState("");
  const [adresse, setAdresse] = useState("");
  const [lignes, setLignes] = useState(() => [ligneVide()]);
  const [notes, setNotes] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const total = calculerTotalHTBonCommande(
    lignes.map((l) => ({ quantite: Number(l.quantite) || 0, prixUnitaire: Number(l.prixUnitaire) || 0 }))
  );

  // Choisir un chantier pré-remplit l'objet et l'adresse tant qu'ils sont vides.
  function choisirChantier(id: string) {
    setChantierId(id);
    const chantier = chantiers.find((c) => c.id === id);
    if (!chantier) return;
    if (!intitule.trim()) setIntitule(chantier.nom);
    if (!adresse.trim()) setAdresse(chantier.adresse);
  }

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      await creerBonCommandeLibre({
        sousTraitantId,
        chantierId: chantierId || null,
        intitule,
        adresse,
        lignes: lignesEditionVersSaisie(lignes),
        notes,
      });
      onClose();
      router.refresh();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <form onSubmit={soumettre} className="border border-border rounded-lg bg-surface p-4 flex flex-col gap-3">
      <h2 className="font-semibold">Nouveau bon de commande</h2>
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Sous-traitant
          <select
            required
            value={sousTraitantId}
            onChange={(e) => setSousTraitantId(e.target.value)}
            className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-background"
          >
            <option value="">— Choisir —</option>
            {sousTraitants.map((st) => (
              <option key={st.id} value={st.id}>
                {st.nom}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Chantier (optionnel)
          <select
            value={chantierId}
            onChange={(e) => choisirChantier(e.target.value)}
            className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-background"
          >
            <option value="">— Aucun —</option>
            {chantiers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Objet du bon de commande
          <input
            value={intitule}
            onChange={(e) => setIntitule(e.target.value)}
            required={!chantierId}
            placeholder="Ex : Travaux de plomberie — 12 rue des Lilas"
            className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-background"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Adresse du chantier (optionnel)
          <input
            value={adresse}
            onChange={(e) => setAdresse(e.target.value)}
            className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-background"
          />
        </label>
      </div>

      <LignesBonCommandeEditeur lignes={lignes} onChange={setLignes} />

      <label className="flex flex-col gap-1 text-sm font-medium">
        Conditions particulières (optionnel)
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-background resize-y"
        />
      </label>
      <p className="text-sm text-muted">
        Total HT du bon de commande: <strong className="text-foreground">{formaterMontantPrecis(total)}</strong>
      </p>
      {erreur && <p className="text-sm text-red-600">{erreur}</p>}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={enCours}
          className="rounded-md bg-foreground text-background text-sm font-medium px-4 py-2 hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {enCours ? "Création…" : "Créer le bon de commande"}
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={enCours}
          className="text-sm text-muted hover:underline disabled:opacity-50"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
