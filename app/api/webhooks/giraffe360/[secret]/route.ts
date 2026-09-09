import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { choisirImagePlan, extraireInfosPlan, getGiraffe360Project } from "@/lib/giraffe360";
import { creerChantierProvisoireEnBase } from "@/lib/chantierProvisoireImport";

/**
 * Reçoit les notifications Giraffe360 (voir POST /api/v2/webhooks/ enregistré sur leur compte,
 * événement "project-ready") : dès qu'un bien scanné est prêt, crée un chantier provisoire ici
 * avec l'adresse du projet + une estimation IA de la surface/du nombre de pièces lue sur le plan
 * d'étage. L'URL contient un secret (GIRAFFE360_WEBHOOK_SECRET) en guise d'authentification —
 * Giraffe360 ne propose pas de signature de webhook, whitelisté dans proxy.ts (pas de session).
 */
export async function POST(request: Request, { params }: { params: Promise<{ secret: string }> }) {
  const { secret } = await params;
  const attendu = process.env.GIRAFFE360_WEBHOOK_SECRET;
  if (!attendu || secret !== attendu) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  let payload: { webhook_type?: string; data?: { project_id?: string } };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }

  if (payload.webhook_type !== "project-ready" || !payload.data?.project_id) {
    // Autres événements possibles (project-matched, lead-created) : pas pertinents ici.
    return NextResponse.json({ ok: true, ignore: true });
  }

  try {
    const project = await getGiraffe360Project(payload.data.project_id);
    const nom = project.address?.trim() || project.name;
    const plan = choisirImagePlan(project);
    const infos = plan ? await extraireInfosPlan(plan) : { surfaceM2: null, nombrePieces: null };

    await creerChantierProvisoireEnBase(
      {
        nom,
        surfaceM2: infos.surfaceM2,
        nombrePieces: infos.nombrePieces,
        giraffe360ProjectId: project.id,
      },
      "VERTICALE"
    );
    revalidatePath("/");
    revalidatePath("/chantiers");
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Webhook Giraffe360 :", err);
    return NextResponse.json({ error: "Erreur lors du traitement." }, { status: 500 });
  }
}
