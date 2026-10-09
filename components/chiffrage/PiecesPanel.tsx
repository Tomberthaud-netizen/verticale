"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ajouterPieceChiffrage, modifierPieceChiffrage, supprimerPieceChiffrage } from "@/app/chiffrageActions";
import {
  HAUTEUR_PAR_DEFAUT_M,
  TYPES_PIECE,
  formaterNombre,
  libelleTypePiece,
  perimetreDepuisDimensions,
  surfaceDepuisDimensions,
} from "@/lib/chiffrage";

export interface PieceResume {
  id: string;
  nom: string;
  typePiece: string;
  surfaceM2: number;
  perimetreM: number;
  hauteurM: number;
  tracee: boolean;
}

const CHAMP = "border border-border rounded-md px-2 py-1.5 text-sm bg-background min-w-0";

function nombre(valeur: string): number {
  return Number(valeur.replace(",", "."));
}

function LignePiece({ piece }: { piece: PieceResume }) {
  const router = useRouter();
  const [edition, setEdition] = useState(false);
  const [nom, setNom] = useState(piece.nom);
  const [typePiece, setTypePiece] = useState(piece.typePiece);
  const [surface, setSurface] = useState(String(piece.surfaceM2));
  const [perimetre, setPerimetre] = useState(String(piece.perimetreM));
  const [hauteur, setHauteur] = useState(String(piece.hauteurM));
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      await modifierPieceChiffrage(piece.id, {
        nom,
        typePiece,
        surfaceM2: nombre(surface),
        perimetreM: nombre(perimetre),
        hauteurM: nombre(hauteur),
      });
      setEdition(false);
      router.refresh();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setEnCours(false);
    }
  }

  async function supprimer() {
    if (!window.confirm(`Supprimer la pièce « ${piece.nom} » ?`)) return;
    setErreur(null);
    setEnCours(true);
    try {
      await supprimerPieceChiffrage(piece.id);
      router.refresh();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Une erreur est survenue.");
      setEnCours(false);
    }
  }

  if (edition) {
    return (
      <li className="px-3 py-2 border-b border-border last:border-b-0">
        <form onSubmit={enregistrer} className="flex flex-wrap items-end gap-2">
          <input required value={nom} onChange={(e) => setNom(e.target.value)} className={`${CHAMP} w-36`} aria-label="Nom" />
          <select value={typePiece} onChange={(e) => setTypePiece(e.target.value)} className={CHAMP} aria-label="Type">
            {TYPES_PIECE.map((t) => (
              <option key={t.cle} value={t.cle}>
                {t.libelle}
              </option>
            ))}
          </select>
          <label className="text-xs text-muted flex flex-col gap-0.5">
            Surface (m²)
            <input required value={surface} onChange={(e) => setSurface(e.target.value)} inputMode="decimal" className={`${CHAMP} w-24`} />
          </label>
          <label className="text-xs text-muted flex flex-col gap-0.5">
            Périmètre (m)
            <input required value={perimetre} onChange={(e) => setPerimetre(e.target.value)} inputMode="decimal" className={`${CHAMP} w-24`} />
          </label>
          <label className="text-xs text-muted flex flex-col gap-0.5">
            Hauteur (m)
            <input required value={hauteur} onChange={(e) => setHauteur(e.target.value)} inputMode="decimal" className={`${CHAMP} w-20`} />
          </label>
          <button type="submit" disabled={enCours} className="rounded-md bg-foreground text-background text-sm font-medium px-3 py-1.5 disabled:opacity-50">
            Enregistrer
          </button>
          <button type="button" onClick={() => setEdition(false)} className="text-sm text-muted underline py-1.5">
            Annuler
          </button>
        </form>
        {erreur && <p className="text-sm text-red-600 mt-1">{erreur}</p>}
      </li>
    );
  }

  return (
    <li className="px-3 py-2 border-b border-border last:border-b-0 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
      <span className="font-medium min-w-32">
        {piece.nom}
        {piece.tracee && <span className="ml-1.5 text-xs font-normal text-muted">(tracée)</span>}
      </span>
      <span className="text-muted">{libelleTypePiece(piece.typePiece)}</span>
      <span className="tabular-nums">{formaterNombre(piece.surfaceM2)} m²</span>
      <span className="tabular-nums text-muted">périmètre {formaterNombre(piece.perimetreM)} m</span>
      <span className="tabular-nums text-muted">h {formaterNombre(piece.hauteurM)} m</span>
      <span className="ml-auto flex gap-3">
        <button type="button" onClick={() => setEdition(true)} className="text-xs underline">
          Modifier
        </button>
        <button type="button" onClick={supprimer} disabled={enCours} className="text-xs text-muted hover:text-red-600 disabled:opacity-40">
          Supprimer
        </button>
      </span>
      {erreur && <p className="text-sm text-red-600 w-full">{erreur}</p>}
    </li>
  );
}

/** Liste des pièces du projet + ajout par dimensions (L × l) ou par surface/périmètre directs. */
export default function PiecesPanel({ projetId, pieces }: { projetId: string; pieces: PieceResume[] }) {
  const router = useRouter();
  const [nom, setNom] = useState("");
  const [typePiece, setTypePiece] = useState("SALON");
  const [mode, setMode] = useState<"dimensions" | "directe">("dimensions");
  const [longueur, setLongueur] = useState("");
  const [largeur, setLargeur] = useState("");
  const [surface, setSurface] = useState("");
  const [perimetre, setPerimetre] = useState("");
  const [hauteur, setHauteur] = useState(String(HAUTEUR_PAR_DEFAUT_M));
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const longueurN = nombre(longueur);
  const largeurN = nombre(largeur);
  const apercu =
    mode === "dimensions" && longueurN > 0 && largeurN > 0
      ? `${formaterNombre(surfaceDepuisDimensions(longueurN, largeurN))} m² · périmètre ${formaterNombre(perimetreDepuisDimensions(longueurN, largeurN))} m`
      : null;

  async function ajouter(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      await ajouterPieceChiffrage(projetId, {
        nom,
        typePiece,
        surfaceM2: mode === "dimensions" ? surfaceDepuisDimensions(longueurN, largeurN) : nombre(surface),
        perimetreM: mode === "dimensions" ? perimetreDepuisDimensions(longueurN, largeurN) : nombre(perimetre),
        hauteurM: nombre(hauteur),
      });
      setNom("");
      setLongueur("");
      setLargeur("");
      setSurface("");
      setPerimetre("");
      router.refresh();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {pieces.length > 0 && (
        <ul className="border border-border rounded-md overflow-hidden bg-surface">
          {pieces.map((p) => (
            <LignePiece key={`${p.id}-${p.surfaceM2}-${p.perimetreM}-${p.hauteurM}-${p.nom}-${p.typePiece}`} piece={p} />
          ))}
        </ul>
      )}
      <form onSubmit={ajouter} className="border border-dashed border-border rounded-md p-3 flex flex-col gap-2">
        <p className="text-sm font-semibold">Ajouter une pièce</p>
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-xs text-muted flex flex-col gap-0.5">
            Nom
            <input required value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex : Chambre 1" className={`${CHAMP} w-40`} />
          </label>
          <label className="text-xs text-muted flex flex-col gap-0.5">
            Type
            <select value={typePiece} onChange={(e) => setTypePiece(e.target.value)} className={CHAMP}>
              {TYPES_PIECE.map((t) => (
                <option key={t.cle} value={t.cle}>
                  {t.libelle}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-muted flex flex-col gap-0.5">
            Saisie
            <select value={mode} onChange={(e) => setMode(e.target.value as "dimensions" | "directe")} className={CHAMP}>
              <option value="dimensions">Longueur × largeur</option>
              <option value="directe">Surface et périmètre</option>
            </select>
          </label>
          {mode === "dimensions" ? (
            <>
              <label className="text-xs text-muted flex flex-col gap-0.5">
                Longueur (m)
                <input required value={longueur} onChange={(e) => setLongueur(e.target.value)} inputMode="decimal" className={`${CHAMP} w-24`} />
              </label>
              <label className="text-xs text-muted flex flex-col gap-0.5">
                Largeur (m)
                <input required value={largeur} onChange={(e) => setLargeur(e.target.value)} inputMode="decimal" className={`${CHAMP} w-24`} />
              </label>
            </>
          ) : (
            <>
              <label className="text-xs text-muted flex flex-col gap-0.5">
                Surface (m²)
                <input required value={surface} onChange={(e) => setSurface(e.target.value)} inputMode="decimal" className={`${CHAMP} w-24`} />
              </label>
              <label className="text-xs text-muted flex flex-col gap-0.5">
                Périmètre (m)
                <input required value={perimetre} onChange={(e) => setPerimetre(e.target.value)} inputMode="decimal" className={`${CHAMP} w-24`} />
              </label>
            </>
          )}
          <label className="text-xs text-muted flex flex-col gap-0.5">
            Hauteur (m)
            <input required value={hauteur} onChange={(e) => setHauteur(e.target.value)} inputMode="decimal" className={`${CHAMP} w-20`} />
          </label>
          <button type="submit" disabled={enCours} className="rounded-md bg-foreground text-background text-sm font-medium px-3 py-1.5 disabled:opacity-50">
            {enCours ? "Ajout…" : "Ajouter"}
          </button>
        </div>
        {apercu && <p className="text-xs text-muted">{apercu}</p>}
        {erreur && <p className="text-sm text-red-600">{erreur}</p>}
      </form>
    </div>
  );
}
