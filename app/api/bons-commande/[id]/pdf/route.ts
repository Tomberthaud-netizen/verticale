import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { aAcces, getPersonneConnectee } from "@/lib/authContext";
import { genererPdfBonCommandeBuffer } from "@/lib/pdfBonCommande";
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
  if (!aAcces(personne, "DEVIS", bon.entreprise as Entreprise)) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const st = bon.sousTraitant;
  const buffer = await genererPdfBonCommandeBuffer({
    numero: bon.numero,
    devisNumero: bon.devisNumero,
    intitule: bon.intitule,
    entreprise: bon.entreprise,
    adresse: bon.adresse,
    dateBon: bon.dateBon,
    notes: bon.notes,
    sousTraitant: {
      nom: st.nom,
      contact: [st.contactPrenom, st.contactNom].filter(Boolean).join(" ") || null,
      adresse: [st.adresse, [st.codePostal, st.ville].filter(Boolean).join(" ")].filter(Boolean).join(", ") || null,
      telephone: st.telephone,
      email: st.email,
      siret: st.siret,
    },
    lignes: bon.lignes.map((l) => ({
      designation: l.designation,
      detail: l.detail,
      unite: l.unite,
      quantite: l.quantite,
      prixUnitaire: l.prixUnitaire,
    })),
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${bon.numero}.pdf"`,
    },
  });
}
