"use client";

import { useEffect, useState } from "react";

export default function AdressePopup({ adresse }: { adresse: string }) {
  const [ouvert, setOuvert] = useState(false);

  useEffect(() => {
    if (!ouvert) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOuvert(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ouvert]);

  const lienGoogleMaps = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(adresse)}`;
  const lienCarteIncorporee = `https://www.google.com/maps?q=${encodeURIComponent(adresse)}&output=embed`;

  return (
    <>
      <button
        type="button"
        onClick={() => setOuvert(true)}
        className="text-left underline decoration-border underline-offset-2 hover:decoration-foreground transition-colors"
      >
        {adresse}
      </button>
      {ouvert && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6"
          onClick={() => setOuvert(false)}
        >
          <div
            className="bg-surface rounded-xl shadow-2xl w-full max-w-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border">
              <h2 className="text-sm font-medium text-muted">Adresse</h2>
              <button
                type="button"
                onClick={() => setOuvert(false)}
                className="text-muted hover:text-foreground text-xl leading-none"
                aria-label="Fermer"
              >
                ×
              </button>
            </div>
            <iframe
              src={lienCarteIncorporee}
              className="w-full h-64 border-0 block"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={`Carte — ${adresse}`}
            />
            <div className="p-5 flex flex-col gap-4">
              <p className="text-base font-medium">{adresse}</p>
              <a
                href={lienGoogleMaps}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-foreground text-background text-sm font-medium px-4 py-2.5 hover:opacity-90 transition-opacity"
              >
                Itinéraire sur Google Maps
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
