"use client";

import { useState } from "react";

export default function GoogleAgendaButton({
  feedPath,
  label,
}: {
  feedPath: string;
  label: string;
}) {
  const [copie, setCopie] = useState(false);

  function urlAbsolue() {
    return `${window.location.origin}${feedPath}`;
  }

  async function copierLien() {
    try {
      await navigator.clipboard.writeText(urlAbsolue());
      setCopie(true);
      setTimeout(() => setCopie(false), 4000);
    } catch {
      // presse-papiers indisponible, tant pis
    }
  }

  function ouvrirParametresGoogleAgenda() {
    window.open("https://calendar.google.com/calendar/r/settings/addbyurl", "_blank", "noopener,noreferrer");
  }

  return (
    <div className="print:hidden flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <a
          href={feedPath}
          download
          className="rounded-md bg-foreground text-background text-sm font-medium px-3 py-1.5 hover:opacity-90 transition-opacity"
        >
          Télécharger le fichier .ics
        </a>
        <button
          type="button"
          onClick={copierLien}
          className="rounded-md border border-border text-sm font-medium px-3 py-1.5 hover:bg-background transition-colors"
        >
          {copie ? "Lien copié !" : `Copier le lien — ${label}`}
        </button>
        <button
          type="button"
          onClick={ouvrirParametresGoogleAgenda}
          className="text-xs text-muted underline underline-offset-2"
        >
          Ouvrir Google Agenda
        </button>
      </div>
      <p className="text-xs text-muted max-w-lg">
        Google Agenda n&apos;autorise pas l&apos;ajout automatique d&apos;un agenda externe en un clic : cliquez sur
        « Copier le lien », puis « Ouvrir Google Agenda » et collez-le dans le champ « URL de l&apos;agenda », avant
        de valider « Ajouter un agenda ». Les événements se mettront ensuite à jour automatiquement.
      </p>
    </div>
  );
}
