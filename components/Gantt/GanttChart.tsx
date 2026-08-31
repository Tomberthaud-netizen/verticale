"use client";

import { useLayoutEffect, useRef, useState, useEffect, useCallback } from "react";
import { format, isSameMonth, getISOWeek } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";
import { positionnerPoint, positionnerSegment, type GanttRepere, type GanttSegment } from "@/lib/gantt";

const COL_WIDTH = 28;
const ROW_HEIGHT = 44;
const ROW_HEIGHT_2_LIGNES = 54;
const LABEL_WIDTH = 190;
const TIER_HEIGHT = 15;
const ECART_MIN_PX = 85;
const SEMAINE_ROW_HEIGHT = 16;

// Largeur de colonne en dessous de laquelle les numéros de jour ne sont plus lisibles :
// on masque alors cette ligne et on garde uniquement la grille mois/semaines.
const SEUIL_AFFICHAGE_JOURS = 13;
// On ne réduit jamais une colonne en dessous de cette largeur : le texte, lui, ne rétrécit
// jamais (contrairement à une simple mise à l'échelle CSS). Descendre bas ici (plutôt que de
// laisser le filet de sécurité réduire tout le rendu, texte compris) est ce qui permet aux
// projets longs de rester lisibles sur une seule page.
const COL_WIDTH_MIN_IMPRESSION = 3;

// Budget disponible (en px CSS) sur une page A3 paysage imprimable (marges de 10mm déjà déduites).
export const LARGEUR_IMPRESSION_CIBLE = 1470;
export const HAUTEUR_IMPRESSION_CIBLE = 1000;

const COULEURS_REPERE: Record<GanttRepere["type"], string> = {
  alerte: "#b45309",
  dateImportante: "#4338ca",
};

// Zooms disponibles quand `naviguable` : nombre de jours ouvrés visés à l'écran à la fois.
// "Tout" (colonne null) garde le comportement historique : largeur de colonne fixe, tout le
// projet affiché d'un coup (défilement navigateur natif si trop large).
const ZOOMS: { value: string; label: string; joursVisibles: number | null }[] = [
  { value: "TOUT", label: "Tout", joursVisibles: null },
  { value: "MOIS", label: "Mois", joursVisibles: 23 },
  { value: "3MOIS", label: "3 mois", joursVisibles: 66 },
  { value: "6MOIS", label: "6 mois", joursVisibles: 130 },
  { value: "1AN", label: "1 an", joursVisibles: 260 },
];
const COL_WIDTH_MIN_ZOOM = 4;

// Référence stable : un tableau littéral en valeur par défaut serait recréé à chaque rendu
// et invaliderait sans fin le useLayoutEffect ci-dessous (boucle de rendu infinie).
const AUCUN_REPERE: GanttRepere[] = [];

export interface GanttRow {
  id: string;
  label: string;
  href?: string;
  segments: GanttSegment[];
  /** Deuxième ligne sous le nom (ex. "10 j · +2 j de retard"), pour les vues récapitulatives. */
  sousLibelle?: string;
  /** Chantier prévisionnel (devis planifié, pas encore confirmé) : rendu atténué. */
  attenue?: boolean;
}

interface GanttChartProps {
  echelle: Date[];
  rows: GanttRow[];
  showRowLabels?: boolean;
  today?: Date;
  reperes?: GanttRepere[];
  titre?: string;
  /** À fournir quand plusieurs GanttChart se partagent la même page imprimée (ex. Calendrier
   * Global multi-entreprises) : chacun ne doit alors viser qu'une partie de la hauteur disponible. */
  hauteurImpressionCible?: number;
  /** Affiche la barre de zoom/navigation (Mois/3 mois/6 mois/1 an, précédent/suivant, Concentrer). */
  naviguable?: boolean;
}

export default function GanttChart({
  echelle,
  rows,
  showRowLabels = false,
  today,
  reperes = AUCUN_REPERE,
  titre,
  hauteurImpressionCible = HAUTEUR_IMPRESSION_CIBLE,
  naviguable = false,
}: GanttChartProps) {
  const contenuRef = useRef<HTMLDivElement>(null);
  const [echelleSecours, setEchelleSecours] = useState(1);
  const [tailleSecours, setTailleSecours] = useState<{ largeur: number; hauteur: number } | null>(null);

  // Largeur de colonne dédiée à l'impression : on réduit la grille (jours plus fins) plutôt que
  // le texte, qui reste toujours à sa taille normale et donc lisible.
  const largeurColonnesDisponible = LARGEUR_IMPRESSION_CIBLE - (showRowLabels ? LABEL_WIDTH : 0);
  const colWidthImpression =
    echelle.length > 0
      ? Math.min(COL_WIDTH, Math.max(COL_WIDTH_MIN_IMPRESSION, largeurColonnesDisponible / echelle.length))
      : COL_WIDTH;
  const masquerJoursImpression = colWidthImpression < SEUIL_AFFICHAGE_JOURS;

  // Filet de sécurité : si même la colonne minimale ne suffit pas à tenir sur une page
  // (projet extrêmement long), on réduit légèrement l'ensemble en dernier recours.
  useLayoutEffect(() => {
    const el = contenuRef.current;
    if (!el) return;
    const largeurNaturelle = el.scrollWidth;
    const hauteurNaturelle = el.scrollHeight;
    if (largeurNaturelle === 0 || hauteurNaturelle === 0) return;
    const scale = Math.min(
      1,
      LARGEUR_IMPRESSION_CIBLE / largeurNaturelle,
      hauteurImpressionCible / hauteurNaturelle
    );
    setEchelleSecours(scale);
    setTailleSecours({ largeur: largeurNaturelle * scale, hauteur: hauteurNaturelle * scale });
  }, [echelle, rows, reperes, showRowLabels, colWidthImpression, masquerJoursImpression, hauteurImpressionCible]);

  return (
    <div className="relative border border-border rounded-lg bg-surface print:border-0 print:rounded-none">
      <div className="print:hidden">
        <GanttNaviguable
          echelle={echelle}
          rows={rows}
          showRowLabels={showRowLabels}
          today={today}
          reperes={reperes}
          naviguable={naviguable}
        />
      </div>

      {/*
        Toujours mise en page (jamais display:none) pour rester mesurable via scrollWidth/scrollHeight,
        mais invisible et sans emprise sur l'écran ; devient la version réellement visible à l'impression.
      */}
      <div className="absolute invisible h-0 overflow-hidden print:static print:visible print:h-auto print:overflow-visible">
        {titre && (
          <p className="text-xs font-medium text-muted mb-1.5 pb-1 border-b border-border">{titre}</p>
        )}
        <div
          style={
            tailleSecours
              ? { width: tailleSecours.largeur, height: tailleSecours.hauteur, overflow: "hidden" }
              : undefined
          }
        >
          <div
            ref={contenuRef}
            style={{ transform: `scale(${echelleSecours})`, transformOrigin: "top left", width: "max-content" }}
          >
            <GanttGrille
              echelle={echelle}
              rows={rows}
              showRowLabels={showRowLabels}
              today={today}
              reperes={reperes}
              colWidth={colWidthImpression}
              masquerJours={masquerJoursImpression}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Enrobe GanttGrille avec, si `naviguable`, la barre de zoom et la navigation horizontale. */
function GanttNaviguable({
  echelle,
  rows,
  showRowLabels,
  today,
  reperes,
  naviguable,
}: {
  echelle: Date[];
  rows: GanttRow[];
  showRowLabels?: boolean;
  today?: Date;
  reperes: GanttRepere[];
  naviguable: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState("TOUT");
  const [largeurConteneur, setLargeurConteneur] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !naviguable) return;
    const observer = new ResizeObserver(([entry]) => setLargeurConteneur(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, [naviguable]);

  const zoomActif = ZOOMS.find((z) => z.value === zoom) ?? ZOOMS[0];
  const colWidth =
    naviguable && zoomActif.joursVisibles && largeurConteneur > 0
      ? Math.max(COL_WIDTH_MIN_ZOOM, largeurConteneur / zoomActif.joursVisibles)
      : COL_WIDTH;

  const todayIndex = today ? echelle.findIndex((j) => j.toDateString() === today.toDateString()) : -1;

  const centrerSur = useCallback(
    (index: number, largeur: number) => {
      const el = scrollRef.current;
      if (!el) return;
      const cible = Math.max(0, index * largeur - el.clientWidth / 2);
      el.scrollTo({ left: cible, behavior: "smooth" });
    },
    []
  );

  // Au changement de zoom : en mode fenêtré, recentre sur aujourd'hui ; en mode "Tout", revient
  // au tout début (sans quoi la position de défilement d'un zoom précédent, en pixels, pointerait
  // vers une tranche de dates sans rapport une fois la largeur de colonne redevenue fixe).
  useEffect(() => {
    if (!naviguable) return;
    if (!zoomActif.joursVisibles) {
      scrollRef.current?.scrollTo({ left: 0 });
      return;
    }
    if (largeurConteneur === 0) return;
    centrerSur(todayIndex >= 0 ? todayIndex : 0, colWidth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, largeurConteneur]);

  function paginer(sens: 1 | -1) {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: sens * el.clientWidth * 0.9, behavior: "smooth" });
  }

  function concentrer() {
    centrerSur(todayIndex >= 0 ? todayIndex : 0, colWidth);
  }

  const indexDebutVisible = colWidth > 0 ? Math.max(0, Math.floor(scrollLeft / colWidth)) : 0;
  const joursParEcran = colWidth > 0 && largeurConteneur > 0 ? Math.max(1, Math.floor(largeurConteneur / colWidth)) : 1;
  const indexFinVisible = Math.min(echelle.length - 1, indexDebutVisible + joursParEcran - 1);
  const libellePeriode =
    naviguable && zoomActif.joursVisibles && echelle.length > 0
      ? `${format(echelle[Math.min(indexDebutVisible, echelle.length - 1)], "d MMM yyyy", { locale: fr })} – ${format(
          echelle[Math.max(indexFinVisible, 0)],
          "d MMM yyyy",
          { locale: fr }
        )}`
      : null;

  return (
    <div className="flex flex-col gap-2">
      {naviguable && (
        <div className="flex flex-wrap items-center gap-2 px-3 pt-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => paginer(-1)}
              disabled={!zoomActif.joursVisibles}
              aria-label="Période précédente"
              className="p-1.5 rounded-md border border-border text-muted hover:text-foreground hover:bg-background disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => paginer(1)}
              disabled={!zoomActif.joursVisibles}
              aria-label="Période suivante"
              className="p-1.5 rounded-md border border-border text-muted hover:text-foreground hover:bg-background disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ›
            </button>
          </div>
          {libellePeriode && <span className="text-sm font-medium">{libellePeriode}</span>}
          <div className="flex items-center gap-1 ml-auto">
            {ZOOMS.map((z) => (
              <button
                key={z.value}
                type="button"
                onClick={() => setZoom(z.value)}
                className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-colors ${
                  zoom === z.value
                    ? "bg-foreground text-background border-foreground"
                    : "border-border text-muted hover:text-foreground"
                }`}
              >
                {z.label}
              </button>
            ))}
            {zoomActif.joursVisibles && (
              <button
                type="button"
                onClick={concentrer}
                className="text-xs font-medium px-2.5 py-1 rounded-full border border-border text-muted hover:text-foreground hover:bg-background"
              >
                Concentrer
              </button>
            )}
          </div>
        </div>
      )}
      <div
        ref={scrollRef}
        onScroll={naviguable ? (e) => setScrollLeft(e.currentTarget.scrollLeft) : undefined}
        className="overflow-x-auto"
      >
        <GanttGrille
          echelle={echelle}
          rows={rows}
          showRowLabels={showRowLabels}
          today={today}
          reperes={reperes}
          colWidth={colWidth}
        />
      </div>
    </div>
  );
}

interface GanttGrilleProps {
  echelle: Date[];
  rows: GanttRow[];
  showRowLabels?: boolean;
  today?: Date;
  reperes: GanttRepere[];
  colWidth: number;
  masquerJours?: boolean;
}

function GanttGrille({
  echelle,
  rows,
  showRowLabels,
  today,
  reperes,
  colWidth,
  masquerJours = false,
}: GanttGrilleProps) {
  const width = echelle.length * colWidth;
  const ecartMinColonnes = Math.max(1, Math.ceil(ECART_MIN_PX / colWidth));
  const rowHeight = rows.some((r) => r.sousLibelle) ? ROW_HEIGHT_2_LIGNES : ROW_HEIGHT;

  const moisGroups: { label: string; start: number; span: number }[] = [];
  echelle.forEach((jour, i) => {
    const last = moisGroups[moisGroups.length - 1];
    if (last && isSameMonth(jour, echelle[last.start])) {
      last.span += 1;
    } else {
      moisGroups.push({ label: format(jour, "MMMM yyyy", { locale: fr }), start: i, span: 1 });
    }
  });

  const semaineGroups: { label: string; start: number; span: number }[] = [];
  echelle.forEach((jour, i) => {
    const semaine = getISOWeek(jour);
    const last = semaineGroups[semaineGroups.length - 1];
    if (last && getISOWeek(echelle[last.start]) === semaine && isSameMonth(jour, echelle[last.start])) {
      last.span += 1;
    } else {
      semaineGroups.push({ label: `S${semaine}`, start: i, span: 1 });
    }
  });

  const todayIndex = today
    ? echelle.findIndex((j) => j.toDateString() === today.toDateString())
    : -1;

  const bornesEchelle =
    echelle.length > 0 ? { debut: echelle[0].getTime(), fin: echelle[echelle.length - 1].getTime() } : null;

  const reperesPositionnes = reperes
    .filter((r) => bornesEchelle && r.date.getTime() >= bornesEchelle.debut && r.date.getTime() <= bornesEchelle.fin)
    .map((r) => ({ ...r, index: positionnerPoint(echelle, r.date) }))
    .filter((r) => r.index >= 0)
    .sort((a, b) => a.index - b.index);

  const tiers: number[] = [];
  const dernierIndexParTier: number[] = [];
  reperesPositionnes.forEach((r) => {
    let tier = 0;
    while (
      dernierIndexParTier[tier] !== undefined &&
      r.index - dernierIndexParTier[tier] < ecartMinColonnes
    ) {
      tier++;
    }
    dernierIndexParTier[tier] = r.index;
    tiers.push(tier);
  });
  const nbTiers = tiers.length > 0 ? Math.max(...tiers) + 1 : 0;
  const hauteurZoneReperes = nbTiers > 0 ? nbTiers * TIER_HEIGHT + 4 : 0;

  return (
    <div style={{ width: width + (showRowLabels ? LABEL_WIDTH : 0) }}>
      <div className="flex">
        {showRowLabels && (
          <div
            style={{ width: LABEL_WIDTH }}
            className="shrink-0 sticky left-0 z-20 bg-surface border-b border-border"
          />
        )}
        <div style={{ width }}>
          <div className="flex border-b border-border text-xs font-medium text-muted">
            {moisGroups.map((g) => (
              <div
                key={g.start}
                style={{ width: g.span * colWidth }}
                className="border-r border-border px-2 py-1 truncate capitalize"
              >
                {g.label}
              </div>
            ))}
          </div>
          {!masquerJours && (
            <div
              className="flex border-b border-border text-[9px] text-muted"
              style={{ height: SEMAINE_ROW_HEIGHT }}
            >
              {semaineGroups.map((g) => (
                <div
                  key={g.start}
                  style={{ width: g.span * colWidth }}
                  className="border-r border-border px-1 truncate leading-none flex items-center"
                >
                  {g.span * colWidth > 14 ? g.label : ""}
                </div>
              ))}
            </div>
          )}
          {!masquerJours && (
            <div className="flex border-b border-border text-[10px] text-muted">
              {echelle.map((jour, i) => (
                <div
                  key={i}
                  style={{ width: colWidth }}
                  className={`shrink-0 text-center py-1 ${
                    jour.getDay() === 1 ? "border-l border-border" : ""
                  }`}
                >
                  {colWidth > 10 ? jour.getDate() : ""}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="relative">
        {hauteurZoneReperes > 0 && (
          <div className="flex border-b border-border">
            {showRowLabels && (
              <div style={{ width: LABEL_WIDTH }} className="shrink-0 sticky left-0 z-20 bg-surface" />
            )}
            <div className="relative" style={{ width, height: hauteurZoneReperes }}>
              {reperesPositionnes.map((r, i) => {
                const positionPx = r.index * colWidth;
                // Près du bord droit, une étiquette ancrée à gauche déborderait de la grille
                // (et fausserait la mesure de mise à l'échelle) : on l'ancre alors à droite.
                const presDuBord = width - positionPx < 130;
                return (
                  <div
                    key={r.id}
                    title={`${r.label} — ${format(r.date, "d MMM yyyy", { locale: fr })}`}
                    className="absolute whitespace-nowrap text-[9px] leading-none font-semibold"
                    style={
                      presDuBord
                        ? { right: width - positionPx - 2, top: tiers[i] * TIER_HEIGHT + 2, color: COULEURS_REPERE[r.type] }
                        : { left: positionPx + 2, top: tiers[i] * TIER_HEIGHT + 2, color: COULEURS_REPERE[r.type] }
                    }
                  >
                    {presDuBord
                      ? `${format(r.date, "d MMM", { locale: fr })} · ${r.label} ▾`
                      : `▾ ${r.label} · ${format(r.date, "d MMM", { locale: fr })}`}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div>
          {rows.map((row) => (
            <div
              key={row.id}
              className={`flex border-b border-border last:border-b-0 ${row.attenue ? "bg-background/40" : ""}`}
              style={{ height: rowHeight }}
            >
              {showRowLabels && (
                <div
                  style={{ width: LABEL_WIDTH }}
                  className={`shrink-0 sticky left-0 z-10 bg-surface flex flex-col justify-center px-3 border-r ${
                    row.attenue ? "border-dashed border-border/70" : "border-border"
                  }`}
                >
                  {row.href ? (
                    <Link
                      href={row.href}
                      className={`hover:underline truncate text-sm font-medium ${row.attenue ? "italic text-muted" : ""}`}
                    >
                      {row.label}
                    </Link>
                  ) : (
                    <span className={`truncate text-sm font-medium ${row.attenue ? "italic text-muted" : ""}`}>
                      {row.label}
                    </span>
                  )}
                  {row.sousLibelle && (
                    <span className="truncate text-[11px] text-muted">{row.sousLibelle}</span>
                  )}
                </div>
              )}
              <div className="relative" style={{ width }}>
                {echelle.map((jour, i) =>
                  jour.getDay() === 1 ? (
                    <div
                      key={i}
                      className="absolute top-0 bottom-0 border-l border-border"
                      style={{ left: i * colWidth }}
                    />
                  ) : null
                )}
                {todayIndex >= 0 && (
                  <div
                    className="absolute top-0 bottom-0 border-l-2 border-red-500 z-10"
                    style={{ left: todayIndex * colWidth }}
                  />
                )}
                {row.segments.map((seg) => {
                  const pos = positionnerSegment(echelle, seg.debut, seg.fin);
                  if (!pos) return null;
                  const left = pos.startIndex * colWidth;
                  const segWidth = (pos.endIndex - pos.startIndex + 1) * colWidth;
                  const largeurVisible = Math.max(segWidth - 2, 4);
                  return (
                    <div
                      key={seg.id}
                      title={`${seg.label} — ${format(seg.debut, "d MMM yyyy", { locale: fr })} au ${format(
                        seg.fin,
                        "d MMM yyyy",
                        { locale: fr }
                      )}`}
                      className="absolute top-1.5 bottom-1.5 rounded-full flex items-center px-2 overflow-hidden"
                      style={{
                        left,
                        width: largeurVisible,
                        backgroundColor: seg.estime ? `${seg.bg}33` : seg.bg,
                        border: `1.5px ${seg.estime ? "dashed" : "solid"} ${seg.border}`,
                      }}
                    >
                      {largeurVisible > 20 && (
                        <span
                          className="text-[11px] truncate font-medium"
                          style={{ color: seg.estime ? seg.border : "#ffffff" }}
                        >
                          {seg.label}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {todayIndex >= 0 && (
          <div className="absolute z-20 pointer-events-none" style={{ left: (showRowLabels ? LABEL_WIDTH : 0) + todayIndex * colWidth, top: -2 }}>
            <span className="absolute -translate-x-1/2 -translate-y-full whitespace-nowrap text-[10px] font-semibold text-white bg-red-500 rounded-full px-2 py-0.5">
              Aujourd&apos;hui · {format(today!, "d/MM/yyyy")}
            </span>
          </div>
        )}

        {reperesPositionnes.length > 0 && (
          <div
            className="absolute top-0 bottom-0 right-0 pointer-events-none"
            style={{ left: showRowLabels ? LABEL_WIDTH : 0 }}
          >
            {reperesPositionnes.map((r) => (
              <div
                key={r.id}
                className="absolute top-0 bottom-0 border-l border-dashed opacity-60"
                style={{ left: r.index * colWidth, borderColor: COULEURS_REPERE[r.type] }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
