import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { aAcces, getPersonneConnectee } from "@/lib/authContext";
import { construireDonneesPdfBonCommande, genererPdfBonCommandeBuffer } from "@/lib/pdfBonCommande";
import type { Entreprise } from "@/constants/entreprises";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const personne = await getPersonneConnectee();
  if (!personne) {
    return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  }

  const { id } = await params;
  const bon = await prisma.bonCommande.findUnique({
    where: { id },
    include: { sousTraitant: true, lignes: { orderBy: { ordre: "asc" } } },
  });
  if (!bon) {
    return NextResponse.json({ error: "Bon de commande introuvable." }, { status: 404 });
  }
  // Un bon de commande se gère depuis la fiche d'un devis (onglet Devis) ou depuis l'onglet
  // "Bons de commande" (sous Chantiers) : l'un ou l'autre accès suffit.
  const entreprise = bon.entreprise as Entreprise;
  if (!aAcces(personne, "DEVIS", entreprise) && !aAcces(personne, "CHANTIERS", entreprise)) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const buffer = await genererPdfBonCommandeBuffer(construireDonneesPdfBonCommande(bon));
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${bon.numero}.pdf"`,
    },
  });
}
