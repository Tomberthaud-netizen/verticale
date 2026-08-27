import { getChantier } from "@/lib/queries";
import { calculerChantier } from "@/lib/chantier";
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

  const ics = construireCalendrierICS([calculerChantier(chantier)]);
  const nomFichier = chantier.nom.replace(/[^a-z0-9]+/gi, "-").toLowerCase();

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="${nomFichier || "chantier"}.ics"`,
    },
  });
}
