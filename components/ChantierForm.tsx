"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { createChantier } from "@/app/actions";
import { calculerDateFinPhases, type PhaseType } from "@/lib/dates";
import { PHASE_COLORS } from "@/constants/colors";

const PHASE_TYPES: PhaseType[] = ["DEMOLITION", "RENOVATION", "AMENAGEMENT", "DECORATION", "PERSONNALISEE"];

interface PhaseDraft {
  key: string;
  type: PhaseType;
  nom: string;
  nombreJoursOuvres: number;
}

interface DureeTypeTravauxItem {
  id: string;
  type: string;
  joursParM2: number | null;
}

let nextKey = 1;

/** Durée suggérée (jours ouvrés, arrondis au supérieur) pour une phase, à partir du catalogue de durées et de la surface. */
function suggestionDureePhase(
  phase: PhaseDraft,
  surfaceM2Nombre: number,
  durees: DureeTypeTravauxItem[]
): number | null {
  if (!surfaceM2Nombre || surfaceM2Nombre <= 0) return null;
  const libelle = (phase.type === "PERSONNALISEE" ? phase.nom : PHASE_COLORS[phase.type].label).trim().toLowerCase();
  if (!libelle) return null;
  const duree = durees.find((d) => d.type.trim().toLowerCase() === libelle);
  if (!duree || duree.joursParM2 == null) return null;
  return Math.max(1, Math.ceil(duree.joursParM2 * surfaceM2Nombre));
}

export default function ChantierForm({
  sousTraitants = [],
  dureesTypesTravaux = [],
  modelesRenovation = [],
  entrepriseActive,
}: {
  sousTraitants?: { id: string; nom: string }[];
  dureesTypesTravaux?: DureeTypeTravauxItem[];
  modelesRenovation?: { id: string; nom: string }[];
  entrepriseActive: string;
}) {
  const router = useRouter();
  const [nom, setNom] = useState("");
  const [equipe, setEquipe] = useState("");
  const [adresse, setAdresse] = useState("");
  const [surfaceM2, setSurfaceM2] = useState("");
  const [sousTraitantId, setSousTraitantId] = useState("");
  const [dateDebut, setDateDebut] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [phases, setPhases] = useState<PhaseDraft[]>([
    { key: String(nextKey++), type: "DEMOLITION", nom: "", nombreJoursOuvres: 5 },
  ]);
  const [creerDevis, setCreerDevis] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const dateFinPrevisionnelle = useMemo(() => {
    if (!dateDebut || phases.length === 0) return null;
    try {
      return calculerDateFinPhases(
        new Date(dateDebut),
        phases.map((p, i) => ({ id: p.key, type: p.type, nombreJoursOuvres: p.nombreJoursOuvres, ordre: i + 1 }))
      );
    } catch {
      return null;
    }
  }, [dateDebut, phases]);

  function ajouterPhase() {
    setPhases((prev) => [
      ...prev,
      { key: String(nextKey++), type: "DEMOLITION", nom: "", nombreJoursOuvres: 5 },
    ]);
  }

  function supprimerPhase(key: string) {
    setPhases((prev) => prev.filter((p) => p.key !== key));
  }

  function modifierPhase(key: string, patch: Partial<PhaseDraft>) {
    setPhases((prev) => prev.map((p) => (p.key === key ? { ...p, ...patch } : p)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    if (phases.length === 0) {
      setErreur("Ajoutez au moins une phase.");
      return;
    }
    if (phases.some((p) => p.type === "PERSONNALISEE" && !p.nom.trim())) {
      setErreur("Donnez un nom à chaque phase personnalisée.");
      return;
    }
    const surfaceM2Nombre = Number(surfaceM2);
    if (!surfaceM2Nombre || surfaceM2Nombre <= 0) {
      setErreur("Renseignez une surface (m²) positive.");
      return;
    }
    setEnCours(true);
    try {
      const { id } = await createChantier({
        nom,
        equipe,
        adresse,
        surfaceM2: surfaceM2Nombre,
        dateDebut,
        sousTraitantId: sousTraitantId || null,
        phases: phases.map((p) => ({
          type: p.type,
          nom: p.type === "PERSONNALISEE" ? p.nom.trim() : undefined,
          nombreJoursOuvres: p.nombreJoursOuvres,
        })),
      });
      router.push(creerDevis ? `/devis/nouveau?chantierId=${id}` : `/chantiers/${id}`);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Une erreur est survenue.");
      setEnCours(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-2xl">
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Nom du chantier
          <input
            required
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface"
            placeholder="Ex : Rénovation 12 rue des Lilas"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Modèle de rénovation
          {modelesRenovation.length > 0 ? (
            <select
              required
              value={equipe}
              onChange={(e) => setEquipe(e.target.value)}
              className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface"
            >
              <option value="" disabled>
                Sélectionner un modèle
              </option>
              {modelesRenovation.map((m) => (
                <option key={m.id} value={m.nom}>
                  {m.nom}
                </option>
              ))}
            </select>
          ) : (
            <>
              <input
                required
                value={equipe}
                onChange={(e) => setEquipe(e.target.value)}
                className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface"
                placeholder="Ex : Rénovation complète"
              />
              <span className="text-xs text-muted font-normal">
                Aucun modèle configuré — Administration › Modèles de rénovation.
              </span>
            </>
          )}
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium sm:col-span-2">
          Adresse exacte du chantier
          <input
            required
            value={adresse}
            onChange={(e) => setAdresse(e.target.value)}
            className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface"
            placeholder="Ex : 12 rue des Lilas, 91000 Évry"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Surface (m²)
          <input
            required
            type="number"
            min={0.01}
            step="0.01"
            value={surfaceM2}
            onChange={(e) => setSurfaceM2(e.target.value)}
            className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface"
            placeholder="Ex : 85"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Sous-traitant affecté (optionnel)
          <select
            value={sousTraitantId}
            onChange={(e) => setSousTraitantId(e.target.value)}
            className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface"
          >
            <option value="">Aucun</option>
            {sousTraitants.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nom}
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-col gap-1 text-sm font-medium">
          Entreprise
          <div className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-background text-muted">
            {entrepriseActive}
          </div>
        </div>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Date de démarrage
          <input
            required
            type="date"
            value={dateDebut}
            onChange={(e) => setDateDebut(e.target.value)}
            className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface"
          />
        </label>
        <div className="flex flex-col gap-1 text-sm font-medium">
          Date de fin calculée
          <div className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-background text-muted">
            {dateFinPrevisionnelle ? format(dateFinPrevisionnelle, "d MMMM yyyy", { locale: fr }) : "—"}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Phases</h3>
          <button
            type="button"
            onClick={ajouterPhase}
            className="text-sm font-medium text-foreground underline underline-offset-2"
          >
            + Ajouter une phase
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {phases.map((phase, i) => {
            const suggestion = suggestionDureePhase(phase, Number(surfaceM2), dureesTypesTravaux);
            return (
              <div key={phase.key} className="flex flex-col gap-1.5 border border-border rounded-md p-3 bg-surface">
                <div className="flex items-center gap-3">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: PHASE_COLORS[phase.type].bg }}
                  />
                  <span className="text-sm text-muted w-6 shrink-0">{i + 1}.</span>
                  <select
                    value={phase.type}
                    onChange={(e) => modifierPhase(phase.key, { type: e.target.value as PhaseType })}
                    className="border border-border rounded-md px-2 py-1.5 text-sm bg-surface"
                  >
                    {PHASE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {PHASE_COLORS[t].label}
                      </option>
                    ))}
                  </select>
                  {phase.type === "PERSONNALISEE" && (
                    <input
                      type="text"
                      required
                      value={phase.nom}
                      onChange={(e) => modifierPhase(phase.key, { nom: e.target.value })}
                      placeholder="Nom de la phase"
                      className="border border-border rounded-md px-2 py-1.5 text-sm w-36 bg-surface"
                    />
                  )}
                  <input
                    type="number"
                    min={1}
                    required
                    value={phase.nombreJoursOuvres}
                    onChange={(e) =>
                      modifierPhase(phase.key, { nombreJoursOuvres: Number(e.target.value) })
                    }
                    className="border border-border rounded-md px-2 py-1.5 text-sm w-24 bg-surface"
                  />
                  <span className="text-sm text-muted">jours ouvrés</span>
                  <button
                    type="button"
                    onClick={() => supprimerPhase(phase.key)}
                    disabled={phases.length === 1}
                    className="ml-auto text-sm text-muted hover:text-red-600 disabled:opacity-30 disabled:hover:text-muted"
                  >
                    Retirer
                  </button>
                </div>
                {suggestion != null && suggestion !== phase.nombreJoursOuvres && (
                  <div className="flex items-center gap-2 pl-9 text-xs text-muted">
                    <span>💡 Suggestion (catalogue Durée) : {suggestion} jours ouvrés</span>
                    <button
                      type="button"
                      onClick={() => modifierPhase(phase.key, { nombreJoursOuvres: suggestion })}
                      className="font-medium text-foreground underline underline-offset-2"
                    >
                      Appliquer
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          checked={creerDevis}
          onChange={(e) => setCreerDevis(e.target.checked)}
          className="rounded border-border"
        />
        Créer aussi un devis pour ce chantier
      </label>

      {erreur && <p className="text-sm text-red-600">{erreur}</p>}

      <button
        type="submit"
        disabled={enCours}
        className="self-start rounded-md bg-foreground text-background text-sm font-medium px-5 py-2.5 hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {enCours ? "Création…" : creerDevis ? "Créer le chantier et continuer vers le devis" : "Créer le chantier"}
      </button>
    </form>
  );
}
