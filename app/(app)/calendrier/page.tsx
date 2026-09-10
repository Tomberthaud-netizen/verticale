import { getChantiers, getDevisPlanifiesSansChantier } from "@/lib/queries";
import { calculerChantier, estChantierComplet } from "@/lib/chantier";
import { calculerEtatChantier, calculerFinPeriode } from "@/lib/dates";
import { construireEchelleJoursOuvres, construireSegments, resumerChantier } from "@/lib/gantt";
import { PHASE_COLORS, RETARD_COLOR, DEVIS_PROJETE_COLOR } from "@/constants/colors";
import { requireAcces } from "@/lib/authContext";
import type { Entreprise } from "@/constants/entreprises";
import CalendrierGlobal from "@/components/Gantt/CalendrierGlobal";
import CarteChantiersChargeur from "@/components/Gantt/CarteChantiersChargeur";
import CalendrierGlobalImpression from "@/components/Gantt/CalendrierGlobalImpression";
import AgendaSyncButtons from "@/components/AgendaSyncButtons";

export default async function CalendrierPage() {
  await requireAcces("CALENDRIER");
  const [chantiers, devisPlanifies] = await Promise.all([getChantiers(), getDevisPlanifiesSansChantier()]);

  // Un chantier provisoire (importé, pas encore complété) n'a pas de date de démarrage : il
  // reste absent du calendrier tant qu'il n'a pas été complété (voir estChantierComplet).
  const chantiersCalcules = chantiers.filter(estChantierComplet).map(calculerChantier);

  if (chantiersCalcules.length === 0 && devisPlanifies.length === 0) {
    return <p className="text-sm text-muted">Aucun chantier pour le moment.</p>;
  }

  const devisRows = devisPlanifies
    .filter((d) => d.dateDebutPrevisionnelle && d.dureeJoursOuvres)
    .map((d) => {
      const dateDebut = d.dateDebutPrevisionnelle!;
      const dateFin = calculerFinPeriode(dateDebut, d.dureeJoursOuvres!);
      return {
        id: `devis-${d.id}`,
        nom: d.intitule,
        etat: calculerEtatChantier(dateDebut, dateFin),
        entreprise: d.entreprise,
        dateDebut,
        dateFinCalculee: dateFin,
        row: {
          id: `devis-${d.id}`,
          label: `${d.intitule} (${d.numero})`,
          href: `/devis/${d.id}`,
          sousLibelle: `Prévisionnel · ${d.dureeJoursOuvres} j`,
          attenue: true,
          segments: [
            {
              id: `devis-${d.id}`,
              debut: dateDebut,
              fin: dateFin,
              bg: DEVIS_PROJETE_COLOR.bg,
              border: DEVIS_PROJETE_COLOR.border,
              label: DEVIS_PROJETE_COLOR.label,
              estime: true,
            },
          ],
        },
      };
    });

  const toutesLesDates = [
    ...chantiersCalcules.map((c) => c.dateDebut),
    ...chantiersCalcules.map((c) => c.dateFinCalculee),
    ...devisRows.map((d) => d.dateDebut),
    ...devisRows.map((d) => d.dateFinCalculee),
  ];
  const debutGlobal = toutesLesDates.reduce((min, d) => (d < min ? d : min), toutesLesDates[0]);
  const finGlobale = toutesLesDates.reduce((max, d) => (d > max ? d : max), toutesLesDates[0]);
  const echelle = construireEchelleJoursOuvres(debutGlobal, finGlobale);

  const rows = [
    ...chantiersCalcules.map((c) => ({
      id: c.id,
      nom: c.nom,
      etat: c.etat,
      entreprise: c.entreprise,
      row: {
        id: c.id,
        label: c.nom,
        href: `/chantiers/${c.id}`,
        sousLibelle: resumerChantier(c),
        segments: construireSegments(c),
      },
    })),
    ...devisRows.map(({ id, nom, etat, entreprise, row }) => ({ id, nom, etat, entreprise, row })),
  ];

  const chantiersCarte = chantiersCalcules
    .filter((c) => c.latitude !== null && c.longitude !== null && !c.retireCarte)
    .map((c) => ({
      id: c.id,
      nom: c.nom,
      latitude: c.latitude!,
      longitude: c.longitude!,
      etat: c.etat,
      entreprise: c.entreprise as Entreprise,
    }));

  return (
    <CalendrierGlobalImpression
      titre={<h1 className="text-2xl font-semibold">Calendrier Global</h1>}
      legende={
        <div className="flex items-center gap-3 text-xs text-muted flex-wrap">
          {Object.values(PHASE_COLORS).map((p) => (
            <span key={p.label} className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.bg }} />
              {p.label}
            </span>
          ))}
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: RETARD_COLOR.bg }} />
            {RETARD_COLOR.label}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: DEVIS_PROJETE_COLOR.bg }} />
            {DEVIS_PROJETE_COLOR.label}
          </span>
        </div>
      }
      carte={chantiersCarte.length > 0 ? <CarteChantiersChargeur chantiers={chantiersCarte} /> : null}
      agendaSync={<AgendaSyncButtons feedPath="/api/ics" label="tous les chantiers" />}
      calendrier={<CalendrierGlobal echelle={echelle} chantiers={rows} />}
    />
  );
}
