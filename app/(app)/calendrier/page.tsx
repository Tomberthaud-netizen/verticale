import { getChantiers, getDevisPlanifiesSansChantier } from "@/lib/queries";
import { calculerChantier } from "@/lib/chantier";
import { calculerEtatChantier, calculerFinPeriode } from "@/lib/dates";
import { construireEchelleJoursOuvres, construireSegments } from "@/lib/gantt";
import { PHASE_COLORS, RETARD_COLOR, DEVIS_PROJETE_COLOR } from "@/constants/colors";
import { requireAcces } from "@/lib/authContext";
import CalendrierGlobal from "@/components/Gantt/CalendrierGlobal";
import PrintButton from "@/components/PrintButton";
import GoogleAgendaButton from "@/components/GoogleAgendaButton";

export default async function CalendrierPage() {
  await requireAcces("CALENDRIER");
  const [chantiers, devisPlanifies] = await Promise.all([getChantiers(), getDevisPlanifiesSansChantier()]);

  if (chantiers.length === 0 && devisPlanifies.length === 0) {
    return <p className="text-sm text-muted">Aucun chantier pour le moment.</p>;
  }

  const chantiersCalcules = chantiers.map(calculerChantier);

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
          segments: [
            {
              id: `devis-${d.id}`,
              debut: dateDebut,
              fin: dateFin,
              bg: DEVIS_PROJETE_COLOR.bg,
              border: DEVIS_PROJETE_COLOR.border,
              label: DEVIS_PROJETE_COLOR.label,
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
      row: { id: c.id, label: c.nom, href: `/chantiers/${c.id}`, segments: construireSegments(c) },
    })),
    ...devisRows.map(({ id, nom, etat, entreprise, row }) => ({ id, nom, etat, entreprise, row })),
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-semibold">Calendrier Global</h1>
        <PrintButton />
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
      </div>
      <GoogleAgendaButton feedPath="/api/ics" label="Connecter tous les chantiers à Google Agenda" />
      <CalendrierGlobal echelle={echelle} chantiers={rows} />
    </div>
  );
}
