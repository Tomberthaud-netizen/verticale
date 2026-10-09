import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { requireAcces } from "@/lib/authContext";
import { getChantiersPourChiffrage, getProjetsChiffrage } from "@/lib/queries";
import { calculerTotalHTChiffrage } from "@/lib/chiffrage";
import { formaterMontant } from "@/lib/finances";
import NouveauProjetChiffrageForm from "@/components/chiffrage/NouveauProjetChiffrageForm";

export default async function ChiffragePage() {
  await requireAcces("CHIFFRAGE");
  const [projets, chantiers] = await Promise.all([getProjetsChiffrage(), getChantiersPourChiffrage()]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Chiffrage</h1>
          <p className="text-sm text-muted mt-1">
            Créez un projet, saisissez ses pièces (ou tracez-les sur le plan) : le site calcule le chiffrage détaillé
            à partir de votre barème.
          </p>
        </div>
        <Link
          href="/chiffrage/bareme"
          className="shrink-0 rounded-md border border-border text-sm font-medium px-4 py-2 hover:bg-background transition-colors"
        >
          Barème de prix
        </Link>
      </div>

      <NouveauProjetChiffrageForm chantiers={chantiers.map((c) => ({ id: c.id, nom: c.nom, adresse: c.adresse, entreprise: c.entreprise }))} />

      {projets.length === 0 ? (
        <p className="text-sm text-muted">Aucun projet de chiffrage pour le moment.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {projets.map((p) => {
            const total = calculerTotalHTChiffrage(p.lignes);
            return (
              <li key={p.id}>
                <Link
                  href={`/chiffrage/${p.id}`}
                  className="block border border-border rounded-lg bg-surface p-4 hover:border-foreground/40 transition-colors"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold">{p.nom}</p>
                      <p className="text-xs text-muted mt-0.5 flex flex-wrap gap-x-3">
                        {p.adresse && <span>{p.adresse}</span>}
                        {p.chantier && <span>Chantier {p.chantier.nom}</span>}
                        <span>
                          {p._count.pieces} pièce{p._count.pieces > 1 ? "s" : ""}
                        </span>
                        <span>Modifié le {format(p.updatedAt, "d MMM yyyy", { locale: fr })}</span>
                      </p>
                    </div>
                    <p className="text-lg font-semibold tabular-nums">
                      {p.lignes.length > 0 ? `${formaterMontant(total)} HT` : <span className="text-sm font-normal text-muted">Pas encore chiffré</span>}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
