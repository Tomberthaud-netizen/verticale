import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { aAcces, getPersonneConnectee } from "@/lib/authContext";
import type { Entreprise } from "@/constants/entreprises";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const personne = await getPersonneConnectee();
  if (!personne) {
    return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  }

  const { id } = await params;
  const photo = await prisma.photo.findUnique({
    where: { id },
    include: { chantier: { select: { entreprise: true } } },
  });
  if (!photo) {
    return NextResponse.json({ error: "Photo introuvable." }, { status: 404 });
  }
  if (!aAcces(personne, "VUE_ENSEMBLE", photo.chantier.entreprise as Entreprise)) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  return new NextResponse(new Uint8Array(photo.donnees), {
    headers: {
      "Content-Type": photo.typeMime,
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
