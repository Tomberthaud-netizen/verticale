import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { aAcces, getPersonneConnectee } from "@/lib/authContext";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const personne = await getPersonneConnectee();
  if (!personne) return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  if (!aAcces(personne, "CHIFFRAGE")) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });

  const { id } = await params;
  const plan = await prisma.planChiffrage.findUnique({ where: { projetId: id } });
  if (!plan) return NextResponse.json({ error: "Plan introuvable." }, { status: 404 });

  return new NextResponse(new Uint8Array(plan.donnees), {
    headers: {
      "Content-Type": plan.typeMime,
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(plan.nomFichier)}`,
      // Le plan peut être remplacé : pas de cache longue durée comme pour les photos.
      "Cache-Control": "private, no-cache",
    },
  });
}
