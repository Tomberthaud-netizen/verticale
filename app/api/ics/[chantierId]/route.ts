import { getChantier } from "@/lib/queries";
import { calculerChantier, estChantierComplet } from "@/lib/chantier";
import { construireCalendrierICS } from "@/lib/ics";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ chantierId: string }> }
) {
  const { chantierId } = await params;
  const chantier = await getChantier(chantierId);
  if (!chantier) {
    return new Response("Chantier introuvable", { status: 404 });
  }

  // Un chantier provisoire (importé, pas encore complété) n'a pas de date de démarrage :
  // aucun événement calculable, on renvoie un calendrier vide plutôt que 404 (le chantier
  // existe bien, sa page peut avoir été partagée avant complétion).
  const ics = construireCalendrierICS(estChantierComplet(chantier) ? [calculerChantier(chantier)] : []);
  const nomFichier = chantier.nom.replace(/[^a-z0-9]+/gi, "-").toLowerCase();

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="${nomFichier || "chantier"}.ics"`,
    },
  });
}
