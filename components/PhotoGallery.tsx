import Image from "next/image";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { supprimerPhoto } from "@/app/actions";
import type { PhotoResume } from "@/lib/chantier";

export default function PhotoGallery({ chantierId, photos }: { chantierId: string; photos: PhotoResume[] }) {
  if (photos.length === 0) {
    return <p className="text-sm text-muted">Aucune photo pour ce chantier.</p>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {photos.map((photo) => (
        <div key={photo.id} className="border border-border rounded-md overflow-hidden bg-surface">
          <div className="relative aspect-square bg-background">
            <Image
              src={`/api/photos/${photo.id}`}
              alt={photo.nomFichier}
              fill
              sizes="200px"
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="px-2 py-1.5 flex items-center justify-between gap-2">
            <span className="text-xs text-muted">
              {format(photo.dateAjout, "d MMM yyyy", { locale: fr })}
            </span>
            <form action={supprimerPhoto.bind(null, chantierId, photo.id)}>
              <button type="submit" className="text-xs text-muted hover:text-red-600 print:hidden">
                Retirer
              </button>
            </form>
          </div>
        </div>
      ))}
    </div>
  );
}
