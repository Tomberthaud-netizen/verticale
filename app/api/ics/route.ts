import { getChantiers } from "@/lib/queries";
import { calculerChantier } from "@/lib/chantier";
import { construireCalendrierICS } from "@/lib/ics";

export const dynamic = "force-dynamic";

export async function GET() {
  const chantiers = await getChantiers();
  const ics = construireCalendrierICS(chantiers.map(calculerChantier));

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="verticale-chantiers.ics"',
    },
  });
}
