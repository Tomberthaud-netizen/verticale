import Link from "next/link";
import { requireAcces } from "@/lib/authContext";
import { getEntrepriseActive } from "@/lib/entrepriseActive";
import { getFournisseurNoms, getFournisseurs, getTypesProduitExistants } from "@/lib/queries";
import { normaliserUrlExterne } from "@/lib/url";
import SearchAutocompleteInput from "@/components/SearchAutocompleteInput";

export default async function FournisseursPage({ searchParams }: PageProps<"/fournisseurs">) {
  await requireAcces("FOURNISSEURS");
  const params = await searchParams;
  const nom = typeof params.nom === "string" ? params.nom : "";
  const type = typeof params.type === "string" ? params.type : "";
  const entreprise = await getEntrepriseActive();
  const [fournisseurs, nomsExistants, typesExistants] = await Promise.all([
    getFournisseurs(entreprise, { nom: nom || undefined, type: type || undefined }),
    getFournisseurNoms(entreprise),
    getTypesProduitExistants(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Fournisseurs</h1>
        <Link
          href="/fournisseurs/nouveau"
          className="shrink-0 rounded-md bg-foreground text-background text-sm font-medium px-4 py-2 hover:opacity-90 transition-opacity"
        >
          + Nouveau fournisseur
        </Link>
      </div>

      <form className="flex flex-wrap gap-3" action="/fournisseurs">
        <SearchAutocompleteInput
          name="nom"
          defaultValue={nom}
          placeholder="Rechercher par nom de fournisseur…"
          suggestions={nomsExistants}
          wrapperClassName="flex-1 min-w-[200px]"
        />
        <SearchAutocompleteInput
          name="type"
          defaultValue={type}
          placeholder="Type de produit…"
          suggestions={typesExistants}
        />
        <button
          type="submit"
          className="rounded-md border border-border text-sm font-medium px-4 py-2 hover:bg-background transition-colors"
        >
          Filtrer
        </button>
      </form>

      {fournisseurs.length === 0 && (
        <p className="text-muted text-sm">
          {nom || type ? (
            "Aucun fournisseur ne correspond à cette recherche."
          ) : (
            <>
              Aucun fournisseur pour le moment.{" "}
              <Link href="/fournisseurs/nouveau" className="underline">
                Créez le premier
              </Link>
              .
            </>
          )}
        </p>
      )}

      <div className="flex flex-col gap-3">
        {fournisseurs.map((f) => (
          <div
            key={f.id}
            className="bg-surface border border-border rounded-lg p-4 flex flex-col md:flex-row md:items-center gap-3 hover:border-foreground/30 transition-colors"
          >
            <Link href={`/fournisseurs/${f.id}`} className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold">{f.nom}</span>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                    f.actif
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-background text-muted border-border"
                  }`}
                >
                  {f.actif ? "Actif" : "Inactif"}
                </span>
                {f.typesProduit.map((t) => (
                  <span
                    key={t.id}
                    className="text-xs font-medium px-2 py-0.5 rounded-full bg-background border border-border text-muted"
                  >
                    {t.type}
                  </span>
                ))}
              </div>
              <p className="text-sm text-muted mt-0.5">
                {[f.contactPrenom, f.contactNom].filter(Boolean).join(" ") || "Aucun contact"}
                {f.telephone && <> · {f.telephone}</>}
                {f.ville && <> · {f.ville}</>}
              </p>
            </Link>
            {f.siteWeb && (
              <a
                href={normaliserUrlExterne(f.siteWeb)}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-sm text-accent hover:underline"
              >
                Site web ↗
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
