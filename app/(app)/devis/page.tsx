import Link from "next/link";
import { getDevisListe } from "@/lib/queries";
import { requireAcces } from "@/lib/authContext";
import { getEntrepriseActive } from "@/lib/entrepriseActive";
import DevisCard from "@/components/DevisCard";

export default async function DevisPage({ searchParams }: PageProps<"/devis">) {
  await requireAcces("DEVIS");
  const params = await searchParams;
  const intitule = typeof params.intitule === "string" ? params.intitule : "";
  const client = typeof params.client === "string" ? params.client : "";
  const devisListe = await getDevisListe(await getEntrepriseActive(), {
    intitule: intitule || undefined,
    clientNom: client || undefined,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Devis</h1>
        <div className="flex items-center gap-3">
          <Link href="/devis/portefeuille" className="text-sm text-muted hover:underline">
            Portefeuille
          </Link>
          <Link href="/devis/indice-bt" className="text-sm text-muted hover:underline">
            Indice BT01
          </Link>
          <Link
            href="/devis/nouveau"
            className="shrink-0 rounded-md bg-foreground text-background text-sm font-medium px-4 py-2 hover:opacity-90 transition-opacity"
          >
            + Nouveau devis
          </Link>
        </div>
      </div>

      <form className="flex flex-wrap gap-3" action="/devis">
        <input
          type="text"
          name="intitule"
          defaultValue={intitule}
          placeholder="Rechercher par nom du devis…"
          className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface flex-1 min-w-[200px]"
        />
        <input
          type="text"
          name="client"
          defaultValue={client}
          placeholder="Nom du client…"
          className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface flex-1 min-w-[160px]"
        />
        <button
          type="submit"
          className="rounded-md border border-border text-sm font-medium px-4 py-2 hover:bg-background transition-colors"
        >
          Filtrer
        </button>
      </form>

      {devisListe.length === 0 && (
        <p className="text-muted text-sm">
          {intitule || client ? (
            "Aucun devis ne correspond à cette recherche."
          ) : (
            <>
              Aucun devis pour le moment.{" "}
              <Link href="/devis/nouveau" className="underline">
                Créez le premier devis
              </Link>
              .
            </>
          )}
        </p>
      )}

      <div className="flex flex-col gap-3">
        {devisListe.map((devis) => (
          <DevisCard key={devis.id} devis={devis} />
        ))}
      </div>
    </div>
  );
}
