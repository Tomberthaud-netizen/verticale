import { NextResponse } from "next/server";
import { getDevis } from "@/lib/queries";
import { aAcces, getPersonneConnectee } from "@/lib/authContext";
import { genererPdfDevisBuffer } from "@/lib/pdfDevis";
import type { Entreprise } from "@/constants/entreprises";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const personne = await getPersonneConnectee();
  if (!personne) {
    return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  }

  const { id } = await params;
  const devis = await getDevis(id);
  if (!devis) {
    return NextResponse.json({ error: "Devis introuvable." }, { status: 404 });
  }
  if (!aAcces(personne, "DEVIS", devis.entreprise as Entreprise)) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const buffer = await genererPdfDevisBuffer(devis);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${devis.numero}.pdf"`,
    },
  });
}
