"use client";

import { useState, useSyncExternalStore } from "react";

function ecouterAucunChangement() {
  return () => {};
}

function estHoteLocal(): boolean {
  const h = window.location.hostname;
  return h === "localhost" || h === "127.0.0.1" || h.endsWith(".local");
}

function estHoteLocalCoteServeur(): boolean {
  return false;
}

export default function GoogleAgendaButton({
  feedPath,
  label,
}: {
  feedPath: string;
  label: string;
}) {
  const [copie, setCopie] = useState(false);
  const estLocal = useSyncExternalStore(ecouterAucunChangement, estHoteLocal, estHoteLocalCoteServeur);

  function urlAbsolue() {
    return `${window.location.origin}${feedPath}`;
  }

  async function copierLien() {
    try {
      await navigator.clipboard.writeText(urlAbsolue());
      setCopie(true);
      setTimeout(() => setCopie(false), 2000);
    } catch {
      // presse-papiers indisponible, tant pis
    }
  }

  function ouvrirDansGoogleAgenda() {
    const url = `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(urlAbsolue())}`;
    window.open(url, "_blank", "noopener,noreferrer");
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
          onClick={ouvrirDansGoogleAgenda}
          disabled={estLocal}
          title={estLocal ? "Indisponible en local : le site doit être accessible en ligne" : undefined}
          className="rounded-md border border-border text-sm font-medium px-3 py-1.5 hover:bg-background transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        >
          {label}
        </button>
        <button
          type="button"
          onClick={copierLien}
          className="text-xs text-muted underline underline-offset-2"
        >
          {copie ? "Lien copié !" : "Copier le lien d'abonnement"}
        </button>
      </div>
      {estLocal ? (
        <p className="text-xs text-amber-700 max-w-md">
          Le site tourne actuellement en local sur ton ordinateur : Google Agenda ne peut pas encore
          s&apos;y abonner automatiquement. Utilise dès maintenant « Télécharger le fichier .ics », puis
          dans Google Agenda : <strong>Paramètres → Importer et exporter → Importer</strong>, et
          sélectionne le fichier téléchargé.
        </p>
      ) : (
        <p className="text-xs text-muted max-w-md">
          Le téléchargement + import fonctionne immédiatement. Le bouton « {label} » abonne Google
          Agenda au lien : les événements se mettront à jour automatiquement au fil des changements.
        </p>
      )}
    </div>
  );
}
