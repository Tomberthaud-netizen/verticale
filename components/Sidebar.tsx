"use client";

import { useState } from "react";
import SidebarNav from "./SidebarNav";
import { definirSidebarReduit } from "@/lib/sidebarState";
import { useMobileMenu } from "./MobileMenuProvider";
import type { AccesOnglet } from "@prisma/client";

export default function Sidebar({
  ongletsAutorises,
  libelles,
  ordres,
  reduitInitial,
}: {
  ongletsAutorises: AccesOnglet[];
  libelles: Record<AccesOnglet, string>;
  ordres: Record<AccesOnglet, number>;
  reduitInitial: boolean;
}) {
  const [reduit, setReduit] = useState(reduitInitial);
  const { ouvert, fermer } = useMobileMenu();

  function toggle() {
    const next = !reduit;
    setReduit(next);
    definirSidebarReduit(next).catch(() => {});
  }

  return (
    <>
      {/* Fond assombri derrière le tiroir mobile : cliquer dessus referme le menu. */}
      {ouvert && (
        <div className="md:hidden fixed inset-0 bg-black/40 z-30" onClick={fermer} aria-hidden="true" />
      )}
      <aside
        className={`print:hidden shrink-0 flex flex-col bg-[#14161b] text-[#c7c9cf] transition-[width] duration-150 fixed inset-y-0 left-0 z-40 w-64 transition-transform ${
          ouvert ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 md:sticky md:top-0 md:h-screen md:z-auto ${reduit ? "md:w-14" : "md:w-64"}`}
      >
        <div className={`flex items-center justify-end p-2 border-b border-white/10 ${reduit ? "md:justify-center" : ""}`}>
          <button
            type="button"
            onClick={fermer}
            aria-label="Fermer le menu"
            className="md:hidden p-1.5 rounded-md text-[#8b8f98] hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
          <button
            type="button"
            onClick={toggle}
            title={reduit ? "Déplier le menu" : "Réduire le menu"}
            className="hidden md:inline-flex p-1.5 rounded-md text-[#8b8f98] hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-transform ${reduit ? "rotate-180" : ""}`}
            >
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
        </div>
        <SidebarNav ongletsAutorises={ongletsAutorises} libelles={libelles} ordres={ordres} reduit={reduit} />
      </aside>
    </>
  );
}
