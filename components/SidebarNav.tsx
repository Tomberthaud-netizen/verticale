"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import type { AccesOnglet } from "@prisma/client";
import { useMobileMenu } from "./MobileMenuProvider";

const ICONS: Record<AccesOnglet, ReactNode> = {
  VUE_ENSEMBLE: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  ),
  CALENDRIER: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4.5" width="18" height="16" rx="2" />
      <path d="M3 9.5h18M8 2.5v4M16 2.5v4M7 13.5h3M7 17h3M14 13.5h3M14 17h3" />
    </svg>
  ),
  DEVIS: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2.5h9l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-17a1 1 0 0 1 1-1Z" />
      <path d="M14.5 2.5v4.5H19" />
      <path d="M8 12.5h8M8 16h8M8 9h4" />
    </svg>
  ),
  FOURNISSEURS: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 17V9l4-4h6v12" />
      <path d="M13 10h4l4 3.5V17" />
      <circle cx="7.5" cy="18.5" r="1.8" />
      <circle cx="17" cy="18.5" r="1.8" />
    </svg>
  ),
  SOUS_TRAITANTS: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.5 4 5.5v6c0 5 3.4 8.4 8 10 4.6-1.6 8-5 8-10v-6L12 2.5Z" />
    </svg>
  ),
  FINANCE: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.5 2 8h20L12 2.5Z" />
      <path d="M4 8v10M9 8v10M15 8v10M20 8v10" />
      <path d="M2 21.5h20" />
    </svg>
  ),
  DIRECTION: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 21.5V9l8-5 8 5v12.5" />
      <path d="M9 21.5v-6h6v6" />
      <path d="M9 12h.01M15 12h.01M12 9h.01" />
    </svg>
  ),
  CATALOGUE: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 3.5h11a2 2 0 0 1 2 2V21l-3-2-2 2-2-2-2 2-2-2-2 2V5.5a2 2 0 0 1 2-2Z" />
      <path d="M8 8h7M8 11.5h7" />
    </svg>
  ),
  ADMINISTRATION: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="7.5" r="3.2" />
      <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
      <path d="M16.5 5a3.2 3.2 0 0 1 0 6.3" />
      <path d="M19 14.3c2 .5 3.5 2.3 3.5 5.7" />
    </svg>
  ),
};

interface NavItem {
  href: string;
  onglet: AccesOnglet;
}

interface NavSection {
  titre: string;
  items: NavItem[];
}

const SECTIONS: NavSection[] = [
  {
    titre: "Vente",
    items: [{ href: "/devis", onglet: "DEVIS" }],
  },
  {
    titre: "Gestion",
    items: [
      { href: "/fournisseurs", onglet: "FOURNISSEURS" },
      { href: "/sous-traitants", onglet: "SOUS_TRAITANTS" },
      { href: "/catalogue", onglet: "CATALOGUE" },
      { href: "/administration", onglet: "ADMINISTRATION" },
    ],
  },
  {
    titre: "Direction",
    items: [
      { href: "/finance", onglet: "FINANCE" },
      { href: "/direction", onglet: "DIRECTION" },
    ],
  },
];

export default function SidebarNav({
  ongletsAutorises,
  libelles,
  ordres,
  reduit,
}: {
  ongletsAutorises: AccesOnglet[];
  libelles: Record<AccesOnglet, string>;
  ordres: Record<AccesOnglet, number>;
  reduit: boolean;
}) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const { fermer } = useMobileMenu();

  return (
    <nav className="flex-1 px-2 py-4 flex flex-col gap-5 overflow-y-auto overflow-x-hidden">
      {SECTIONS.map((section) => {
        const items = section.items
          .filter((item) => ongletsAutorises.includes(item.onglet))
          .sort((a, b) => ordres[a.onglet] - ordres[b.onglet]);
        if (items.length === 0) return null;
        return (
          <div key={section.titre} className="flex flex-col gap-0.5">
            <p
              className={`px-3 mb-1 text-[11px] font-semibold uppercase tracking-wider text-[#6b6f78] whitespace-nowrap ${
                reduit ? "md:hidden" : ""
              }`}
            >
              {section.titre}
            </p>
            {items.map((item) => {
              const active = isActive(item.href);
              const label = libelles[item.onglet];
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={fermer}
                  title={reduit ? label : undefined}
                  className={`flex items-center gap-2.5 py-2 rounded-md text-sm font-medium transition-colors border-l-2 whitespace-nowrap px-3 ${
                    reduit ? "md:justify-center md:px-2" : ""
                  } ${
                    active
                      ? "bg-white/[0.06] border-accent text-white"
                      : "border-transparent text-[#a7abb4] hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  <span className="shrink-0 w-[18px] h-[18px]">{ICONS[item.onglet]}</span>
                  <span className={reduit ? "md:hidden" : ""}>{label}</span>
                </Link>
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}
