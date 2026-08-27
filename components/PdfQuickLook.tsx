"use client";

import { useEffect, useState } from "react";

interface PdfQuickLookProps {
  href: string;
  fileName: string;
  label?: string;
}

/** Aperçu du PDF dans une fenêtre superposée (façon "Coup d'œil" macOS), sans quitter la page. */
export default function PdfQuickLook({ href, fileName, label = "Télécharger le PDF" }: PdfQuickLookProps) {
  const [ouvert, setOuvert] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  useEffect(() => {
    if (!ouvert) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOuvert(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ouvert]);

  async function ouvrir() {
    setOuvert(true);
    if (blobUrl) return;
    setErreur(null);
    setChargement(true);
    try {
      const reponse = await fetch(href);
      if (!reponse.ok) throw new Error("Impossible de charger le PDF.");
      const blob = await reponse.blob();
      setBlobUrl(URL.createObjectURL(blob));
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setChargement(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={ouvrir}
        className="print:hidden shrink-0 rounded-md border border-border text-sm font-medium px-3 py-1.5 hover:bg-surface transition-colors"
      >
        {label}
      </button>
      {ouvert && (
        <div
          className="print:hidden fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6"
          onClick={() => setOuvert(false)}
        >
          <div
            className="bg-surface rounded-xl shadow-2xl w-full max-w-3xl h-[85vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border shrink-0">
              <span className="text-sm font-medium text-muted">Aperçu du PDF</span>
              <div className="flex items-center gap-4">
                {blobUrl && (
                  <a href={blobUrl} download={fileName} className="text-sm underline underline-offset-2">
                    Télécharger
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setOuvert(false)}
                  className="text-muted hover:text-foreground text-xl leading-none"
                  aria-label="Fermer l'aperçu"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="flex-1 min-h-0">
              {chargement && <p className="p-6 text-sm text-muted">Chargement…</p>}
              {erreur && <p className="p-6 text-sm text-red-600">{erreur}</p>}
              {blobUrl && !chargement && !erreur && (
                <iframe src={blobUrl} className="w-full h-full" title="Aperçu du PDF" />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
