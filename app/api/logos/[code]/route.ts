import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPersonneConnectee } from "@/lib/authContext";
import { ENTREPRISES } from "@/constants/entreprises";

export async function GET(_request: Request, { params }: { params: Promise<{ code: string }> }) {
  const personne = await getPersonneConnectee();
  if (!personne) {
    return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  }

  const { code } = await params;
  if (!(ENTREPRISES as readonly string[]).includes(code)) {
    return NextResponse.json({ error: "Entreprise inconnue." }, { status: 404 });
  }

  const entreprise = await prisma.entreprise.findUnique({
    where: { code },
    select: { logoDonnees: true, logoTypeMime: true },
  });
  if (!entreprise?.logoDonnees || !entreprise.logoTypeMime) {
    return NextResponse.json({ error: "Logo introuvable." }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(entreprise.logoDonnees), {
    headers: {
      "Content-Type": entreprise.logoTypeMime,
      // Pas "immutable" contrairement à /api/photos/[id] : l'URL est stable par entreprise
      // (/api/logos/VERTICALE) et son contenu change à chaque nouvel envoi de logo.
      "Cache-Control": "private, max-age=300",
    },
  });
}
