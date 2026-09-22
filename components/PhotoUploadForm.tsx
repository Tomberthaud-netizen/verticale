"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ajouterPhoto } from "@/app/actions";
import { MAX_PHOTOS_PAR_ENVOI } from "@/constants/photos";

export default function PhotoUploadForm({ chantierId }: { chantierId: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  // isPending reste vrai jusqu'à ce que la fiche rechargée (avec les nouvelles photos) soit
  // effectivement affichée — pas seulement jusqu'à ce que l'envoi au serveur soit terminé.
  const [actualisationEnCours, startTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);
  const enCours = envoiEnCours || actualisationEnCours;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fichiers = inputRef.current?.files;
    if (!fichiers || fichiers.length === 0) return;
    if (fichiers.length > MAX_PHOTOS_PAR_ENVOI) {
      setErreur(`Vous pouvez ajouter au maximum ${MAX_PHOTOS_PAR_ENVOI} photos à la fois.`);
      return;
    }

    setErreur(null);
    setEnvoiEnCours(true);
    try {
      const formData = new FormData();
      for (const fichier of Array.from(fichiers)) formData.append("photo", fichier);
      await ajouterPhoto(chantierId, formData);
      if (inputRef.current) inputRef.current.value = "";
      startTransition(() => router.refresh());
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setEnvoiEnCours(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2">
      <label className="flex flex-col gap-1 text-xs font-medium text-muted">
        Ajouter des photos ({MAX_PHOTOS_PAR_ENVOI} maximum à la fois)
        <input
          ref={inputRef}
          type="file"
          name="photo"
          accept="image/png,image/jpeg,image/webp,image/gif"
          multiple
          required
          disabled={enCours}
          className="text-sm border border-border rounded-md px-2 py-1.5 bg-surface disabled:opacity-50"
        />
      </label>
      <button
        type="submit"
        disabled={enCours}
        className="rounded-md bg-foreground text-background text-sm font-medium px-3 py-1.5 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-wait"
      >
        {enCours ? "Envoi en cours…" : "Envoyer"}
      </button>
      {erreur && <p className="w-full text-xs text-red-600">{erreur}</p>}
    </form>
  );
}
