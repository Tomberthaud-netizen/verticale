"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ajouterPieceChiffrage,
  definirEchellePlan,
  definirPlanChiffrage,
  supprimerPlanChiffrage,
} from "@/app/chiffrageActions";
import {
  HAUTEUR_PAR_DEFAUT_M,
  TYPES_PIECE,
  echelleDepuisPoints,
  formaterNombre,
  mesurerContour,
  type Point,
} from "@/lib/chiffrage";

export interface PlanResume {
  id: string;
  nomFichier: string;
  typeMime: string;
  echellePxParM: number | null;
}

export interface PieceSurPlan {
  id: string;
  nom: string;
  contour: string | null;
}

type Mode = "repos" | "echelle" | "trace";

function lireContour(json: string | null): Point[] | null {
  if (!json) return null;
  try {
    const pts = JSON.parse(json) as Point[];
    return Array.isArray(pts) && pts.length >= 3 ? pts : null;
  } catch {
    return null;
  }
}

function PlanTrace({ projetId, plan, pieces }: { projetId: string; plan: PlanResume; pieces: PieceSurPlan[] }) {
  const router = useRouter();
  const zoneRef = useRef<SVGSVGElement>(null);
  const [taille, setTaille] = useState<{ w: number; h: number } | null>(null);
  const [mode, setMode] = useState<Mode>("repos");
  const [points, setPoints] = useState<Point[]>([]);
  const [distance, setDistance] = useState("");
  const [nom, setNom] = useState("");
  const [typePiece, setTypePiece] = useState("SALON");
  const [hauteur, setHauteur] = useState(String(HAUTEUR_PAR_DEFAUT_M));
  const [termine, setTermine] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const echelle = plan.echellePxParM;
  const mesure = mode === "trace" && echelle ? mesurerContour(points, echelle) : null;

  function demarrer(m: Mode) {
    setMode(m);
    setPoints([]);
    setTermine(false);
    setErreur(null);
    setDistance("");
  }

  function cliquer(e: React.MouseEvent<SVGSVGElement>) {
    if (!taille || mode === "repos" || termine) return;
    const r = e.currentTarget.getBoundingClientRect();
    const p: Point = [((e.clientX - r.left) / r.width) * taille.w, ((e.clientY - r.top) / r.height) * taille.h];
    setPoints((prev) => (mode === "echelle" ? [...prev.slice(-1), p].slice(-2) : [...prev, p]));
  }

  async function validerEchelle() {
    setErreur(null);
    if (points.length !== 2) return setErreur("Cliquez sur deux points dont vous connaissez la distance réelle.");
    const pxParM = echelleDepuisPoints(points[0], points[1], Number(distance.replace(",", ".")));
    if (!pxParM) return setErreur("Indiquez la distance réelle entre les deux points (en mètres).");
    setEnCours(true);
    try {
      await definirEchellePlan(projetId, pxParM);
      demarrer("repos");
      router.refresh();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setEnCours(false);
    }
  }

  async function ajouterPiece(e: React.FormEvent) {
    e.preventDefault();
    if (!mesure) return;
    setErreur(null);
    setEnCours(true);
    try {
      await ajouterPieceChiffrage(projetId, {
        nom,
        typePiece,
        surfaceM2: mesure.surfaceM2,
        perimetreM: mesure.perimetreM,
        hauteurM: Number(hauteur.replace(",", ".")),
        contour: points,
      });
      setNom("");
      demarrer("repos");
      router.refresh();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setEnCours(false);
    }
  }

  const w = taille?.w ?? 1;
  const rayon = w / 140;
  const police = w / 55;
  const polygone = (pts: Point[]) => pts.map((p) => p.join(",")).join(" ");

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <button
          type="button"
          onClick={() => demarrer(mode === "echelle" ? "repos" : "echelle")}
          className={`rounded-md border px-3 py-1.5 font-medium transition-colors ${
            mode === "echelle" ? "bg-foreground text-background border-foreground" : "border-border hover:bg-background"
          }`}
        >
          {echelle ? "Recalibrer l'échelle" : "1. Étalonner l'échelle"}
        </button>
        <button
          type="button"
          onClick={() => demarrer(mode === "trace" ? "repos" : "trace")}
          disabled={!echelle}
          title={echelle ? undefined : "Étalonnez d'abord l'échelle du plan"}
          className={`rounded-md border px-3 py-1.5 font-medium transition-colors disabled:opacity-40 ${
            mode === "trace" ? "bg-foreground text-background border-foreground" : "border-border hover:bg-background"
          }`}
        >
          2. Tracer le contour d&apos;une pièce
        </button>
        <span className="text-xs text-muted">
          {echelle ? `Échelle : 1 m = ${formaterNombre(echelle)} px` : "Échelle non définie"}
        </span>
      </div>

      {mode === "echelle" && (
        <div className="text-sm flex flex-col gap-2 border border-border rounded-md p-3 bg-background">
          <p>
            Cliquez sur <strong>deux points</strong> du plan dont vous connaissez la distance réelle (une cote, une largeur de
            porte…), puis saisissez cette distance.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted">{points.length}/2 points</span>
            <input
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              inputMode="decimal"
              placeholder="Distance réelle (m)"
              className="border border-border rounded-md px-2 py-1.5 text-sm bg-surface w-44"
            />
            <button
              type="button"
              onClick={validerEchelle}
              disabled={enCours || points.length !== 2}
              className="rounded-md bg-foreground text-background font-medium px-3 py-1.5 disabled:opacity-40"
            >
              Valider l&apos;échelle
            </button>
          </div>
        </div>
      )}

      {mode === "trace" && (
        <div className="text-sm flex flex-col gap-2 border border-border rounded-md p-3 bg-background">
          {!termine ? (
            <>
              <p>
                Cliquez sur chaque <strong>angle</strong> de la pièce, dans l&apos;ordre. Terminez quand le contour est complet.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-muted">
                  {points.length} point{points.length > 1 ? "s" : ""}
                  {mesure ? ` · ${formaterNombre(mesure.surfaceM2)} m² · périmètre ${formaterNombre(mesure.perimetreM)} m` : ""}
                </span>
                <button
                  type="button"
                  onClick={() => setPoints((p) => p.slice(0, -1))}
                  disabled={points.length === 0}
                  className="rounded-md border border-border px-2.5 py-1 disabled:opacity-40"
                >
                  Retirer le dernier point
                </button>
                <button
                  type="button"
                  onClick={() => setTermine(true)}
                  disabled={points.length < 3}
                  className="rounded-md bg-foreground text-background font-medium px-3 py-1 disabled:opacity-40"
                >
                  Terminer le contour
                </button>
              </div>
            </>
          ) : (
            <form onSubmit={ajouterPiece} className="flex flex-col gap-2">
              <p className="text-muted">
                Contour terminé : {mesure ? `${formaterNombre(mesure.surfaceM2)} m², périmètre ${formaterNombre(mesure.perimetreM)} m` : ""}
              </p>
              <div className="flex flex-wrap items-end gap-2">
                <label className="flex flex-col gap-1 font-medium">
                  Nom de la pièce
                  <input
                    required
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    placeholder="Ex : Salon"
                    className="border border-border rounded-md px-2 py-1.5 font-normal bg-surface"
                  />
                </label>
                <label className="flex flex-col gap-1 font-medium">
                  Type
                  <select
                    value={typePiece}
                    onChange={(e) => setTypePiece(e.target.value)}
                    className="border border-border rounded-md px-2 py-1.5 font-normal bg-surface"
                  >
                    {TYPES_PIECE.map((t) => (
                      <option key={t.cle} value={t.cle}>
                        {t.libelle}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 font-medium">
                  Hauteur (m)
                  <input
                    value={hauteur}
                    onChange={(e) => setHauteur(e.target.value)}
                    inputMode="decimal"
                    className="border border-border rounded-md px-2 py-1.5 font-normal bg-surface w-24"
                  />
                </label>
                <button
                  type="submit"
                  disabled={enCours}
                  className="rounded-md bg-foreground text-background font-medium px-3 py-1.5 disabled:opacity-50"
                >
                  {enCours ? "Ajout…" : "Ajouter la pièce"}
                </button>
                <button type="button" onClick={() => setTermine(false)} className="text-muted underline py-1.5">
                  Corriger le contour
                </button>
              </div>
            </form>
          )}
        </div>
      )}
      {erreur && <p className="text-sm text-red-600">{erreur}</p>}

      <div className="relative border border-border rounded-md overflow-hidden bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/chiffrage/${projetId}/plan?v=${plan.id}`}
          alt={`Plan ${plan.nomFichier}`}
          className="block w-full h-auto select-none"
          draggable={false}
          onLoad={(e) => setTaille({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
        />
        {taille && (
          <svg
            ref={zoneRef}
            viewBox={`0 0 ${taille.w} ${taille.h}`}
            className={`absolute inset-0 w-full h-full ${mode === "repos" ? "" : "cursor-crosshair"}`}
            onClick={cliquer}
          >
            {pieces.map((p) => {
              const pts = lireContour(p.contour);
              if (!pts) return null;
              const cx = pts.reduce((s, q) => s + q[0], 0) / pts.length;
              const cy = pts.reduce((s, q) => s + q[1], 0) / pts.length;
              return (
                <g key={p.id}>
                  <polygon points={polygone(pts)} fill="rgba(59,130,246,0.18)" stroke="#2563eb" strokeWidth={2} vectorEffect="non-scaling-stroke" />
                  <text x={cx} y={cy} textAnchor="middle" fontSize={police} fontWeight={600} fill="#1e3a8a">
                    {p.nom}
                  </text>
                </g>
              );
            })}
            {mode === "trace" && points.length >= 2 && (
              <polyline
                points={polygone(termine ? [...points, points[0]] : points)}
                fill={termine ? "rgba(16,185,129,0.2)" : "none"}
                stroke="#059669"
                strokeWidth={2}
                vectorEffect="non-scaling-stroke"
              />
            )}
            {mode === "echelle" && points.length === 2 && (
              <line x1={points[0][0]} y1={points[0][1]} x2={points[1][0]} y2={points[1][1]} stroke="#dc2626" strokeWidth={2} vectorEffect="non-scaling-stroke" />
            )}
            {mode !== "repos" &&
              points.map((p, i) => (
                <circle key={i} cx={p[0]} cy={p[1]} r={rayon} fill={mode === "echelle" ? "#dc2626" : "#059669"} />
              ))}
          </svg>
        )}
      </div>
    </div>
  );
}

/** Plan du projet : envoi du fichier, et (pour une image) étalonnage de l'échelle + tracé des pièces. */
export default function PlanPanel({
  projetId,
  plan,
  pieces,
}: {
  projetId: string;
  plan: PlanResume | null;
  pieces: PieceSurPlan[];
}) {
  const router = useRouter();
  const [enCours, setEnCours] = useState<"envoi" | "suppression" | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  async function envoyer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formulaire = e.currentTarget;
    setErreur(null);
    setEnCours("envoi");
    try {
      await definirPlanChiffrage(projetId, new FormData(formulaire));
      formulaire.reset();
      router.refresh();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setEnCours(null);
    }
  }

  async function retirer() {
    if (!window.confirm("Retirer le plan ? Les pièces déjà créées sont conservées.")) return;
    setErreur(null);
    setEnCours("suppression");
    try {
      await supprimerPlanChiffrage(projetId);
      router.refresh();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setEnCours(null);
    }
  }

  const estImage = plan?.typeMime.startsWith("image/");

  return (
    <div className="flex flex-col gap-3">
      <form onSubmit={envoyer} className="flex flex-wrap items-center gap-3">
        <input
          type="file"
          name="plan"
          required
          accept="image/png,image/jpeg,image/webp,application/pdf"
          className="text-sm"
        />
        <button
          type="submit"
          disabled={enCours !== null}
          className="rounded-md bg-foreground text-background text-sm font-medium px-3 py-1.5 hover:opacity-90 disabled:opacity-50"
        >
          {enCours === "envoi" ? "Envoi…" : plan ? "Remplacer le plan" : "Envoyer le plan"}
        </button>
        {plan && (
          <button
            type="button"
            onClick={retirer}
            disabled={enCours !== null}
            className="text-xs text-muted hover:text-red-600 disabled:opacity-40"
          >
            Retirer le plan
          </button>
        )}
      </form>
      {erreur && <p className="text-sm text-red-600">{erreur}</p>}
      {!plan && <p className="text-sm text-muted">Image (JPEG, PNG, WEBP) ou PDF, 15 Mo maximum.</p>}
      {plan && estImage && <PlanTrace key={plan.id} projetId={projetId} plan={plan} pieces={pieces} />}
      {plan && !estImage && (
        <>
          <p className="text-sm text-muted">
            Le tracé de contour fonctionne avec une image (JPEG, PNG, WEBP) : exportez votre plan en image pour tracer les
            pièces dessus, ou saisissez leurs dimensions ci-dessous.
          </p>
          <iframe
            src={`/api/chiffrage/${projetId}/plan?v=${plan.id}`}
            title={`Plan ${plan.nomFichier}`}
            className="w-full h-[560px] border border-border rounded-md bg-white"
          />
        </>
      )}
    </div>
  );
}
