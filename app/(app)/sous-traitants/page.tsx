import Link from "next/link";
import { requireAcces } from "@/lib/authContext";
import { getEntrepriseActive } from "@/lib/entrepriseActive";
import { getSousTraitantSuggestions, getSousTraitants, getTypesTravauxExistants } from "@/lib/queries";
import SearchAutocompleteInput from "@/components/SearchAutocompleteInput";

export default async function SousTraitantsPage({ searchParams }: PageProps<"/sous-traitants">) {
  await requireAcces("SOUS_TRAITANTS");
  const params = await searchParams;
  const nom = typeof params.nom === "string" ? params.nom : "";
  const contact = typeof params.contact === "string" ? params.contact : "";
  const type = typeof params.type === "string" ? params.type : "";
  const entreprise = await getEntrepriseActive();
  const [sousTraitants, suggestionsNomsContacts, typesExistants] = await Promise.all([
    getSousTraitants(entreprise, { nom: nom || undefined, contact: contact || undefined, type: type || undefined }),
    getSousTraitantSuggestions(entreprise),
    getTypesTravauxExistants(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Sous-traitants</h1>
        <Link
          href="/sous-traitants/nouveau"
          className="shrink-0 rounded-md bg-foreground text-background text-sm font-medium px-4 py-2 hover:opacity-90 transition-opacity"
        >
          + Nouveau sous-traitant
        </Link>
      </div>

      <form className="flex flex-wrap gap-3" action="/sous-traitants">
        <SearchAutocompleteInput
          name="nom"
          defaultValue={nom}
          placeholder="Nom d'entreprise…"
          suggestions={suggestionsNomsContacts.noms}
        />
        <SearchAutocompleteInput
          name="contact"
          defaultValue={contact}
          placeholder="Nom du contact…"
          suggestions={suggestionsNomsContacts.contacts}
        />
        <SearchAutocompleteInput
          name="type"
          defaultValue={type}
          placeholder="Type de travaux…"
          suggestions={typesExistants}
        />
        <button
          type="submit"
          className="rounded-md border border-border text-sm font-medium px-4 py-2 hover:bg-background transition-colors"
        >
          Filtrer
        </button>
      </form>

      {sousTraitants.length === 0 && (
        <p className="text-muted text-sm">
          {nom || contact || type ? (
            "Aucun sous-traitant ne correspond à cette recherche."
          ) : (
            <>
              Aucun sous-traitant pour le moment.{" "}
              <Link href="/sous-traitants/nouveau" className="underline">
                Créez le premier
              </Link>
              .
            </>
          )}
        </p>
      )}

      <div className="flex flex-col gap-3">
        {sousTraitants.map((s) => (
          <Link
            key={s.id}
            href={`/sous-traitants/${s.id}`}
            className="bg-surface border border-border rounded-lg p-4 flex flex-col md:flex-row md:items-center gap-3 hover:border-foreground/30 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold">{s.nom}</span>
                {s.typesTravaux.map((t) => (
                  <span
                    key={t.id}
                    className="text-xs font-medium px-2 py-0.5 rounded-full bg-background border border-border text-muted"
                  >
                    {t.type}
                  </span>
                ))}
              </div>
              <p className="text-sm text-muted mt-0.5">
                {[s.contactPrenom, s.contactNom].filter(Boolean).join(" ") || "Aucun contact"}
                {s.telephone && <> · {s.telephone}</>}
              </p>
            </div>
            <div className="text-sm text-muted shrink-0">
              {s.chantiers[0] ? <>Dernier chantier : {s.chantiers[0].nom}</> : "Aucun chantier avec nous"}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
