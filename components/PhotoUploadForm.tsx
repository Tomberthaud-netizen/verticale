import { ajouterPhoto } from "@/app/actions";

export default function PhotoUploadForm({ chantierId }: { chantierId: string }) {
  const action = ajouterPhoto.bind(null, chantierId);

  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <label className="flex flex-col gap-1 text-xs font-medium text-muted">
        Ajouter une photo
        <input
          type="file"
          name="photo"
          accept="image/png,image/jpeg,image/webp,image/gif"
          required
          className="text-sm border border-border rounded-md px-2 py-1.5 bg-surface"
        />
      </label>
      <button
        type="submit"
        className="rounded-md bg-foreground text-background text-sm font-medium px-3 py-1.5 hover:opacity-90"
      >
        Envoyer
      </button>
    </form>
  );
}
