"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { modifierAdresseChantier } from "@/app/actions";
import AdressePopup from "@/components/AdressePopup";

/** Icône réglages/roue crantée classique (type Réglages iOS), utilisée pour le bouton "Modifier". */
function IconeReglages({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 13a7.97 7.97 0 0 0 0-2l2.1-1.6-2-3.4-2.5 1a8 8 0 0 0-1.7-1L14.9 3h-4l-.4 2.6a8 8 0 0 0-1.7 1l-2.5-1-2 3.4L6.4 11a7.97 7.97 0 0 0 0 2l-2.1 1.6 2 3.4 2.5-1a8 8 0 0 0 1.7 1l.4 2.6h4l.4-2.6a8 8 0 0 0 1.7-1l2.5 1 2-3.4-2.1-1.6Z" />
    </svg>
  );
}

interface AdresseChantierPanelProps {
  chantierId: string;
  adresse: string;
  etage: string | null;
  porte: string | null;
  codes: string | null;
  emplacementCles: string | null;
}

export default function AdresseChantierPanel({
  chantierId,
  adresse,
  etage,
  porte,
  codes,
  emplacementCles,
}: AdresseChantierPanelProps) {
  const router = useRouter();
  // Édition forcée tant qu'aucune adresse n'a jamais été enregistrée : rien à verrouiller.
  const [edition, setEdition] = useState(!adresse);
  const [valeurAdresse, setValeurAdresse] = useState(adresse);
  const [valeurEtage, setValeurEtage] = useState(etage ?? "");
  const [valeurPorte, setValeurPorte] = useState(porte ?? "");
  const [valeurCodes, setValeurCodes] = useState(codes ?? "");
  const [valeurCles, setValeurCles] = useState(emplacementCles ?? "");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  function annuler() {
    setValeurAdresse(adresse);
    setValeurEtage(etage ?? "");
    setValeurPorte(porte ?? "");
    setValeurCodes(codes ?? "");
    setValeurCles(emplacementCles ?? "");
    setErreur(null);
    setEdition(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      await modifierAdresseChantier(chantierId, {
        adresse: valeurAdresse,
        etage: valeurEtage,
        porte: valeurPorte,
        codes: valeurCodes,
        emplacementCles: valeurCles,
      });
      setEdition(false);
      router.refresh();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setEnCours(false);
    }
  }

  if (!edition) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">Adresse du chantier</h2>
          <button
            type="button"
            onClick={() => setEdition(true)}
            aria-label="Modifier"
            title="Modifier"
            className="shrink-0 p-1.5 rounded-md text-muted hover:text-foreground hover:bg-surface transition-colors"
          >
            <IconeReglages className="w-5 h-5" />
          </button>
        </div>
        <AdressePopup adresse={adresse} />
        <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div>
            <dt className="text-xs font-medium text-muted">Étage</dt>
            <dd>{etage || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted">Porte</dt>
            <dd>{porte || "—"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium text-muted">Codes d&apos;accès</dt>
            <dd className="whitespace-pre-wrap">{codes || "—"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium text-muted">Emplacement des clés</dt>
            <dd className="whitespace-pre-wrap">{emplacementCles || "—"}</dd>
          </div>
        </dl>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">Adresse du chantier</h2>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Adresse exacte
        <input
          required
          value={valeurAdresse}
          onChange={(e) => setValeurAdresse(e.target.value)}
          placeholder="Ex : 12 rue des Lilas, 91000 Évry"
          className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface"
        />
      </label>
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Étage
          <input
            value={valeurEtage}
            onChange={(e) => setValeurEtage(e.target.value)}
            placeholder="Ex : 3e étage"
            className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Porte
          <input
            value={valeurPorte}
            onChange={(e) => setValeurPorte(e.target.value)}
            placeholder="Ex : Porte droite"
            className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface"
          />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Codes d&apos;accès
        <textarea
          value={valeurCodes}
          onChange={(e) => setValeurCodes(e.target.value)}
          rows={2}
          placeholder="Ex : Digicode 1234A, interphone 12"
          className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Emplacement des clés
        <textarea
          value={valeurCles}
          onChange={(e) => setValeurCles(e.target.value)}
          rows={2}
          placeholder="Ex : Boîte à clés près du compteur, code 5678"
          className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface"
        />
      </label>
      {erreur && <p className="text-sm text-red-600">{erreur}</p>}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={enCours}
          className="self-start rounded-md bg-foreground text-background text-sm font-medium px-5 py-2.5 hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {enCours ? "Enregistrement…" : "Enregistrer"}
        </button>
        {adresse && (
          <button
            type="button"
            onClick={annuler}
            disabled={enCours}
            className="text-sm text-muted hover:underline disabled:opacity-50"
          >
            Annuler
          </button>
        )}
      </div>
    </form>
  );
}
