import Image from "next/image";
import { uploaderLogo } from "@/app/administrationActions";
import type { Entreprise } from "@/constants/entreprises";

export default function LogoUploadForm({ code, logoPath }: { code: Entreprise; logoPath: string | null }) {
  const action = uploaderLogo.bind(null, code);
  return (
    <div className="flex items-center gap-4">
      <div className="w-20 h-20 rounded-md border border-border bg-background flex items-center justify-center overflow-hidden shrink-0">
        {logoPath ? (
          <Image src={logoPath} alt={`Logo ${code}`} width={80} height={80} className="w-full h-full object-contain" />
        ) : (
          <span className="text-xs text-muted">Aucun logo</span>
        )}
      </div>
      <form action={action} className="flex items-center gap-2">
        <input
          type="file"
          name="logo"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          required
          className="text-xs file:mr-3 file:rounded-md file:border file:border-border file:bg-surface file:px-3 file:py-1.5 file:text-sm file:font-medium file:cursor-pointer"
        />
        <button
          type="submit"
          className="rounded-md border border-border text-sm font-medium px-3 py-1.5 hover:bg-surface transition-colors shrink-0"
        >
          Envoyer
        </button>
      </form>
    </div>
  );
}
