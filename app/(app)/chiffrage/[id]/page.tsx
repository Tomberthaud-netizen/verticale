import { notFound } from "next/navigation";
import { requireAcces } from "@/lib/authContext";
import { getChantiersPourChiffrage, getProjetChiffrage } from "@/lib/queries";
import RetourButton from "@/components/RetourButton";
import ProjetInfosPanel from "@/components/chiffrage/ProjetInfosPanel";
import PlanPanel from "@/components/chiffrage/PlanPanel";
import PiecesPanel from "@/components/chiffrage/PiecesPanel";
import LignesChiffragePanel from "@/components/chiffrage/LignesChiffragePanel";
import DevisChiffragePanel from "@/components/chiffrage/DevisChiffragePanel";

function Section({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">{titre}</h2>
      {children}
    </section>
  );
}

export default async function ProjetChiffragePage({ params }: PageProps<"/chiffrage/[id]">) {
  await requireAcces("CHIFFRAGE");
  const { id } = await params;
  const [projet, chantiers] = await Promise.all([getProjetChiffrage(id), getChantiersPourChiffrage()]);
  if (!projet) notFound();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <RetourButton />
        <h1 className="text-2xl font-semibold">{projet.nom}</h1>
      </div>

      <ProjetInfosPanel projet={projet} chantiers={chantiers} />

      <Section titre="1. Plan">
        <PlanPanel
          projetId={projet.id}
          plan={projet.plan}
          pieces={projet.pieces.map((p) => ({ id: p.id, nom: p.nom, contour: p.contour }))}
        />
      </Section>

      <Section titre="2. Pièces">
        <PiecesPanel
          projetId={projet.id}
          pieces={projet.pieces.map((p) => ({
            id: p.id,
            nom: p.nom,
            typePiece: p.typePiece,
            surfaceM2: p.surfaceM2,
            perimetreM: p.perimetreM,
            hauteurM: p.hauteurM,
            tracee: p.contour !== null,
          }))}
        />
      </Section>

      <Section titre="3. Chiffrage détaillé">
        {/* La clé force le tableau à se réinitialiser quand les lignes sont recalculées. */}
        <LignesChiffragePanel
          key={projet.lignes.map((l) => l.id).join(",") || "vide"}
          projetId={projet.id}
          nbPieces={projet.pieces.length}
          lignes={projet.lignes}
        />
      </Section>

      <Section titre="4. Transformer en devis">
        <DevisChiffragePanel
          projetId={projet.id}
          nomProjet={projet.nom}
          adresseProjet={projet.adresse}
          chantier={projet.chantier ? { nom: projet.chantier.nom, entreprise: projet.chantier.entreprise } : null}
          nbLignes={projet.lignes.length}
        />
      </Section>
    </div>
  );
}
