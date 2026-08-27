import { ENTREPRISES } from "@/constants/entreprises";
import InformationsSocieteForm from "./InformationsSocieteForm";
import LogoUploadForm from "./LogoUploadForm";

interface EntrepriseRow {
  code: string;
  nom: string;
  tagline: string | null;
  adresse: string | null;
  codePostal: string | null;
  ville: string | null;
  telephone: string | null;
  email: string | null;
  siret: string | null;
  tvaIntracom: string | null;
  logoPath: string | null;
}

export default function InformationsSocietePanel({ entreprises }: { entreprises: EntrepriseRow[] }) {
  return (
    <div className="flex flex-col gap-8">
      {ENTREPRISES.map((code) => {
        const info = entreprises.find((e) => e.code === code) ?? null;
        return (
          <section key={code} className="flex flex-col gap-4 border border-border rounded-lg p-4 bg-surface">
            <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">{code}</h2>
            <LogoUploadForm code={code} logoPath={info?.logoPath ?? null} />
            <InformationsSocieteForm code={code} info={info} />
          </section>
        );
      })}
    </div>
  );
}
