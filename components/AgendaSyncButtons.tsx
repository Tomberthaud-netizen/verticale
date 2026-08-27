"use client";

import { useState } from "react";

export default function AgendaSyncButtons({
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

  function ouvrirGoogleAgenda() {
    window.open("https://calendar.google.com/calendar/r/settings/addbyurl", "_blank", "noopener,noreferrer");
  }

  function ouvrirOutlook() {
    window.open("https://outlook.office.com/calendar/addcalendar", "_blank", "noopener,noreferrer");
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
          onClick={ouvrirGoogleAgenda}
          className="text-xs text-muted underline underline-offset-2"
        >
          Ouvrir Google Agenda
        </button>
        <button
          type="button"
          onClick={ouvrirOutlook}
          className="text-xs text-muted underline underline-offset-2"
        >
          Ouvrir Outlook / Teams
        </button>
      </div>
      <p className="text-xs text-muted max-w-lg">
        Ni Google Agenda ni Outlook n&apos;autorisent l&apos;ajout automatique d&apos;un agenda externe en un clic :
        cliquez sur « Copier le lien », puis « Ouvrir Google Agenda » ou « Ouvrir Outlook / Teams » et collez-le
        dans le champ prévu (« URL de l&apos;agenda » côté Google, « S&apos;abonner sur le web » côté Outlook), avant
        de valider. Les événements se mettront ensuite à jour automatiquement.
      </p>
    </div>
  );
}
