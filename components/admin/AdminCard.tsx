import Link from "next/link";

export default function AdminCard({
  titre,
  description,
  lienHref,
  lienLabel,
}: {
  titre: string;
  description: string;
  lienHref: string;
  lienLabel: string;
}) {
  return (
    <div className="bg-surface border border-border rounded-lg p-5 flex flex-col gap-4">
      <div>
        <h2 className="font-semibold">{titre}</h2>
        <p className="text-sm text-muted mt-1">{description}</p>
      </div>
      <Link
        href={lienHref}
        className="self-start rounded-md bg-accent text-background text-sm font-medium px-4 py-2 hover:opacity-90 transition-opacity"
      >
        {lienLabel}
      </Link>
    </div>
  );
}
