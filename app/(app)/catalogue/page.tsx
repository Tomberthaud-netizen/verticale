import Link from "next/link";
import { requireAcces } from "@/lib/authContext";
import {
  getCataloguePrix,
  getDureesTypesTravaux,
  getLotsDuCatalogue,
  getNombreHorsBtp,
  getPrixDevisReels,
} from "@/lib/queries";
import PrixReferenceRow from "@/components/PrixReferenceRow";
import LigneDevisReelleRow from "@/components/LigneDevisReelleRow";
import SousOnglets from "@/components/SousOnglets";
import DureeTypeTravauxRow from "@/components/DureeTypeTravauxRow";
import AjouterDureeTypeTravauxForm from "@/components/AjouterDureeTypeTravauxForm";

export default async function CataloguePage({ searchParams }: PageProps<"/catalogue">) {
  await requireAcces("CATALOGUE");
  const params = await searchParams;
  const recherche = typeof params.q === "string" ? params.q : "";
  const lot = typeof params.lot === "string" ? params.lot : "";
  const horsBtp = params.horsBtp === "1";
  const page = typeof params.page === "string" ? Math.max(1, Number(params.page) || 1) : 1;
  const pageReel = typeof params.pageReel === "string" ? Math.max(1, Number(params.pageReel) || 1) : 1;

  const [{ items, total, taillePage }, lots, prixDevisReels, dureesTypesTravaux, nombreHorsBtp] = await Promise.all([
    getCataloguePrix({ recherche: recherche || undefined, lot: lot || undefined, page, horsBtp }),
    getLotsDuCatalogue(),
    getPrixDevisReels(pageReel),
    getDureesTypesTravaux(),
    getNombreHorsBtp(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / taillePage));
  const totalPagesReel = Math.max(1, Math.ceil(prixDevisReels.total / prixDevisReels.taillePage));

  function lienPage(p: number) {
    const sp = new URLSearchParams();
    if (recherche) sp.set("q", recherche);
    if (lot) sp.set("lot", lot);
    if (horsBtp) sp.set("horsBtp", "1");
    sp.set("page", String(p));
    return `/catalogue?${sp.toString()}`;
  }

  function lienPageReel(p: number) {
    const sp = new URLSearchParams();
    if (recherche) sp.set("q", recherche);
    if (lot) sp.set("lot", lot);
    if (page > 1) sp.set("page", String(page));
    sp.set("pageReel", String(p));
    return `/catalogue?${sp.toString()}`;
  }

  const travauxOnglet = (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-end">
        <a
          href="/api/catalogue/export"
          className="shrink-0 rounded-md border border-border text-sm font-medium px-3 py-1.5 hover:bg-surface transition-colors"
        >
          Exporter en Excel
        </a>
      </div>

      <p className="text-sm text-muted">
        {total} prix unitaires HT extraits des devis de sous-traitants historiques ({lots.length} corps de métier).
      </p>

      <form className="flex flex-wrap items-center gap-3" action="/catalogue">
        <input
          type="text"
          name="q"
          defaultValue={recherche}
          placeholder="Rechercher une désignation…"
          className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface flex-1 min-w-[200px]"
        />
        <select
          name="lot"
          defaultValue={lot}
          className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface"
        >
          <option value="">Tous les corps de métier</option>
          {lots.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-md border border-border text-sm font-medium px-4 py-2 hover:bg-background transition-colors"
        >
          Filtrer
        </button>
        <label className="flex items-center gap-2 text-sm font-normal text-red-700 ml-1">
          <input type="checkbox" name="horsBtp" value="1" defaultChecked={horsBtp} className="accent-red-700" />
          Hors BTP uniquement ({nombreHorsBtp})
        </label>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left text-muted border-b border-border">
              <th className="py-2 pr-2 font-medium">Désignation</th>
              <th className="py-2 pr-2 font-medium">Lot</th>
              <th className="py-2 pr-2 font-medium">Unité</th>
              <th className="py-2 pr-2 font-medium text-right">Prix unitaire HT</th>
              <th className="py-2 pr-2 font-medium">Fiabilité</th>
              <th className="py-2 pr-0 font-medium" />
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <PrixReferenceRow key={p.id} item={p} />
            ))}
          </tbody>
        </table>
        {items.length === 0 && <p className="text-sm text-muted mt-3">Aucun résultat.</p>}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-2 text-sm">
          {page > 1 && (
            <Link href={lienPage(page - 1)} className="underline">
              ← Précédent
            </Link>
          )}
          <span className="text-muted">
            Page {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link href={lienPage(page + 1)} className="underline">
              Suivant →
            </Link>
          )}
        </div>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">
          Prix issus de vos devis réels ({prixDevisReels.total})
        </h2>
        {prixDevisReels.items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left text-muted border-b border-border">
                  <th className="py-2 pr-2 font-medium">Désignation</th>
                  <th className="py-2 pr-2 font-medium">Unité</th>
                  <th className="py-2 pr-2 font-medium text-right">Prix unitaire HT</th>
                  <th className="py-2 pr-0 font-medium">Devis</th>
                </tr>
              </thead>
              <tbody>
                {prixDevisReels.items.map((l) => (
                  <LigneDevisReelleRow key={l.id} item={l} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted">
            Aucun prix pour le moment — chaque nouvelle ligne de devis viendra alimenter cette liste automatiquement.
          </p>
        )}
        {totalPagesReel > 1 && (
          <div className="flex items-center gap-2 text-sm">
            {pageReel > 1 && (
              <Link href={lienPageReel(pageReel - 1)} className="underline">
                ← Précédent
              </Link>
            )}
            <span className="text-muted">
              Page {pageReel} / {totalPagesReel}
            </span>
            {pageReel < totalPagesReel && (
              <Link href={lienPageReel(pageReel + 1)} className="underline">
                Suivant →
              </Link>
            )}
          </div>
        )}
      </section>
    </div>
  );

  const dureeOnglet = (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted">
        Durée moyenne (en jours ouvrés par m²) pour chaque type de travaux. Utilisée pour proposer
        automatiquement une durée de phase dans la fiche chantier, à partir de la surface renseignée.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left text-muted border-b border-border">
              <th className="py-2 pr-2 font-medium">Type de travaux</th>
              <th className="py-2 pr-2 font-medium">Durée moyenne</th>
              <th className="py-2 pr-0 font-medium" />
            </tr>
          </thead>
          <tbody>
            {dureesTypesTravaux.map((d) => (
              <DureeTypeTravauxRow key={d.id} item={d} />
            ))}
          </tbody>
        </table>
      </div>
      <AjouterDureeTypeTravauxForm />
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Catalogue</h1>
      <SousOnglets
        onglets={[
          { id: "travaux", label: "Travaux", content: travauxOnglet },
          { id: "duree", label: "Durée", content: dureeOnglet },
        ]}
      />
    </div>
  );
}
