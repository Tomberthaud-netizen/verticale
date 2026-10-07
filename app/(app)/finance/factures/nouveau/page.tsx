import { requireAcces } from "@/lib/authContext";
import { getEntrepriseActive } from "@/lib/entrepriseActive";
import { getChantiersPourFacture, getDevisPourFacture } from "@/lib/queries";
import { prisma } from "@/lib/prisma";
import { preparerValeursFactureAcompte } from "@/lib/factures";
import FactureForm from "@/components/FactureForm";

export default async function NouvelleFacturePage({ searchParams }: PageProps<"/finance/factures/nouveau">) {
  await requireAcces("FINANCE");
  const entrepriseActive = await getEntrepriseActive();
  const { brouillon } = await searchParams;
  const brouillonId = typeof brouillon === "string" ? brouillon : undefined;
  // Brouillon préparé à la saisie d'un acompte : on pré-remplit le formulaire avec ce qu'on sait déjà.
  const facturePreparee = brouillonId
    ? await prisma.facturePreparee.findFirst({
        where: { id: brouillonId, entreprise: entrepriseActive },
        include: {
          devis: { select: { id: true, clientNom: true, clientAdresse: true, tauxTVA: true } },
          chantier: { select: { id: true, adresse: true } },
        },
      })
    : null;
  const valeursInitiales = facturePreparee
    ? preparerValeursFactureAcompte({
        devis: facturePreparee.devis,
        chantierId: facturePreparee.chantier?.id ?? null,
        chantierAdresse: facturePreparee.chantier?.adresse ?? null,
        montantHT: facturePreparee.montantHT,
        notes: facturePreparee.notes,
      })
    : undefined;
  const [devisDisponibles, chantiers] = await Promise.all([
    getDevisPourFacture(entrepriseActive),
    getChantiersPourFacture(entrepriseActive),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Nouvelle facture</h1>
      {facturePreparee && (
        <p className="text-sm text-muted max-w-2xl">
          Facture préparée à partir d&apos;un acompte : les informations du chantier et de l&apos;acompte sont déjà
          renseignées, il ne reste qu&apos;à compléter et vérifier.
        </p>
      )}
      <FactureForm
        devisDisponibles={devisDisponibles}
        chantiers={chantiers}
        entrepriseActive={entrepriseActive}
        valeursInitiales={valeursInitiales}
        facturePrepareeId={facturePreparee?.id}
      />
    </div>
  );
}
