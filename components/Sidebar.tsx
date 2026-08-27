"use client";

import { useState } from "react";
import SidebarNav from "./SidebarNav";
import { definirSidebarReduit } from "@/lib/sidebarState";
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

  function toggle() {
    const next = !reduit;
    setReduit(next);
    definirSidebarReduit(next).catch(() => {});
  }

  return (
    <aside
      className={`print:hidden shrink-0 sticky top-0 h-screen flex flex-col bg-[#14161b] text-[#c7c9cf] transition-[width] duration-150 ${
        reduit ? "w-14" : "w-64"
      }`}
    >
      <div className={`flex items-center p-2 border-b border-white/10 ${reduit ? "justify-center" : "justify-end"}`}>
        <button
          type="button"
          onClick={toggle}
          title={reduit ? "Déplier le menu" : "Réduire le menu"}
          className="p-1.5 rounded-md text-[#8b8f98] hover:text-white hover:bg-white/[0.06] transition-colors"
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
  );
}
