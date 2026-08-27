"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { envoyerDevisParEmail } from "@/app/actions";

export default function EnvoyerParMailButton({
  devisId,
  clientEmail,
}: {
  devisId: string;
  clientEmail: string | null;
}) {
  const router = useRouter();
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoye, setEnvoye] = useState(false);

  async function envoyer() {
    setErreur(null);
    setEnCours(true);
    try {
      await envoyerDevisParEmail(devisId);
      setEnvoye(true);
      router.refresh();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1 ml-auto">
      <button
        type="button"
        onClick={envoyer}
        disabled={!clientEmail || enCours}
        title={!clientEmail ? "Renseignez l'email du client dans la fiche devis pour activer l'envoi." : undefined}
        className="rounded-md bg-accent text-background text-sm font-medium px-5 py-2.5 hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {enCours ? "Envoi…" : "Envoyer par mail"}
      </button>
      {!clientEmail && (
        <p className="text-xs text-muted">Renseignez l&apos;email du client pour activer l&apos;envoi.</p>
      )}
      {erreur && <p className="text-xs text-red-600">{erreur}</p>}
      {envoye && !erreur && <p className="text-xs text-emerald-600">Devis envoyé par e-mail.</p>}
    </div>
  );
}
