import Link from "next/link";
import { ACCES_LABELS } from "@/constants/acces";
import SupprimerPersonneButton from "@/components/SupprimerPersonneButton";
import type { PersonneConnectee } from "@/lib/authContext";
import type { AccesOnglet } from "@prisma/client";

interface PersonneAvecAcces {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
  estAdmin: boolean;
  acces: { id: string; onglet: AccesOnglet; entreprise: string | null }[];
}

export default function PersonnesPanel({
  moi,
  personnes,
}: {
  moi: PersonneConnectee;
  personnes: PersonneAvecAcces[];
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">Personnes ayant accès au site et droits associés.</p>
        {moi.estAdmin && (
          <Link
            href="/personnes/nouveau"
            className="shrink-0 rounded-md bg-accent text-background text-sm font-medium px-4 py-2 hover:opacity-90 transition-opacity"
          >
            + Nouvelle personne
          </Link>
        )}
      </div>

      {!moi.estAdmin && (
        <p className="text-sm text-muted">
          Vous n&apos;êtes pas administrateur : vous pouvez consulter les personnes mais pas modifier leurs profils.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {personnes.map((personne) => (
          <div
            key={personne.id}
            className="bg-surface border border-border rounded-lg p-4 flex flex-col md:flex-row md:items-center gap-3"
          >
            <div className="flex-1 min-w-0">
              <p className="font-semibold flex items-center gap-2">
                {personne.prenom} {personne.nom}
                {personne.estAdmin && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    Administrateur
                  </span>
                )}
              </p>
              <p className="text-sm text-muted mt-0.5">
                {personne.email}
                {personne.telephone && <> · {personne.telephone}</>}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {personne.acces.length > 0 ? (
                  personne.acces.map((a) => (
                    <span
                      key={a.id}
                      className="text-xs font-medium px-2 py-0.5 rounded-full bg-background border border-border text-muted"
                    >
                      {ACCES_LABELS[a.onglet]}
                      {a.entreprise ? ` (${a.entreprise})` : ""}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-muted">Aucun accès</span>
                )}
              </div>
            </div>
            {moi.estAdmin && (
              <div className="flex items-center gap-3 shrink-0">
                <Link href={`/personnes/${personne.id}/modifier`} className="text-sm text-muted hover:text-foreground">
                  Modifier
                </Link>
                <SupprimerPersonneButton
                  personneId={personne.id}
                  nomComplet={`${personne.prenom} ${personne.nom}`}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
