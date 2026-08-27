import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { requireAcces } from "@/lib/authContext";
import { getSousTraitant } from "@/lib/queries";
import SupprimerSousTraitantButton from "@/components/SupprimerSousTraitantButton";
import RetourButton from "@/components/RetourButton";
import type { Entreprise } from "@/constants/entreprises";

export default async function SousTraitantDetailPage({ params }: PageProps<"/sous-traitants/[id]">) {
  const { id } = await params;
  const sousTraitant = await getSousTraitant(id);
  if (!sousTraitant) notFound();
  await requireAcces("SOUS_TRAITANTS", sousTraitant.entreprise as Entreprise);

  const dernierChantier = sousTraitant.chantiers[0] ?? null;

  return (
    <div className="flex flex-col gap-6">
      <RetourButton />
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">{sousTraitant.nom}</h1>
          <p className="text-sm text-muted mt-1">
            {sousTraitant.typesTravaux.length > 0
              ? sousTraitant.typesTravaux.map((t) => t.type).join(" · ")
              : "Type de travaux non précisé"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/sous-traitants/${sousTraitant.id}/modifier`}
            className="shrink-0 rounded-md border border-border text-sm font-medium px-3 py-1.5 hover:bg-surface transition-colors"
          >
            Modifier
          </Link>
          <SupprimerSousTraitantButton sousTraitantId={sousTraitant.id} nom={sousTraitant.nom} />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <section className="text-sm flex flex-col gap-1">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-1">Contact</h2>
          <p>{[sousTraitant.contactPrenom, sousTraitant.contactNom].filter(Boolean).join(" ") || "—"}</p>
          {sousTraitant.telephone && <p className="text-muted">{sousTraitant.telephone}</p>}
          {sousTraitant.email && <p className="text-muted">{sousTraitant.email}</p>}
        </section>

        <section className="text-sm flex flex-col gap-1">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-1">Adresse</h2>
          <p>{sousTraitant.adresse || "—"}</p>
          <p className="text-muted">
            {[sousTraitant.codePostal, sousTraitant.ville].filter(Boolean).join(" ")}
            {sousTraitant.pays && <> · {sousTraitant.pays}</>}
          </p>
          {sousTraitant.siret && <p className="text-muted">SIRET {sousTraitant.siret}</p>}
        </section>

        <section className="text-sm flex flex-col gap-1">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-1">Dernier chantier avec nous</h2>
          {dernierChantier ? (
            <Link href={`/chantiers/${dernierChantier.id}`} className="underline">
              {dernierChantier.nom} — {format(dernierChantier.dateDebut, "d MMMM yyyy", { locale: fr })}
            </Link>
          ) : (
            <p className="text-muted">Aucun chantier pour le moment.</p>
          )}
        </section>

        {sousTraitant.notes && (
          <section className="text-sm flex flex-col gap-1">
            <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-1">Notes</h2>
            <p className="whitespace-pre-wrap text-muted">{sousTraitant.notes}</p>
          </section>
        )}
      </div>

      {sousTraitant.chantiers.length > 1 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">Historique des chantiers</h2>
          <ul className="flex flex-col gap-1.5">
            {sousTraitant.chantiers.map((c) => (
              <li key={c.id} className="flex justify-between items-center border border-border rounded-md px-3 py-2 bg-surface text-sm">
                <Link href={`/chantiers/${c.id}`} className="underline">
                  {c.nom}
                </Link>
                <span className="text-muted">{format(c.dateDebut, "d MMMM yyyy", { locale: fr })}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
