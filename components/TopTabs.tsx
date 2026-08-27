"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AccesOnglet } from "@prisma/client";

const TABS: { href: string; onglet: AccesOnglet }[] = [
  { href: "/", onglet: "VUE_ENSEMBLE" },
  { href: "/calendrier", onglet: "CALENDRIER" },
];

export default function TopTabs({
  ongletsAutorises,
  libelles,
  ordres,
}: {
  ongletsAutorises: AccesOnglet[];
  libelles: Record<AccesOnglet, string>;
  ordres: Record<AccesOnglet, number>;
}) {
  const pathname = usePathname();
  const tabs = TABS.filter((tab) => ongletsAutorises.includes(tab.onglet)).sort(
    (a, b) => ordres[a.onglet] - ordres[b.onglet]
  );

  return (
    <nav className="flex gap-1">
      {tabs.map((tab) => {
        const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 py-2 text-sm font-medium rounded-t-md border-b-2 transition-colors ${
              active ? "border-accent text-accent" : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {libelles[tab.onglet]}
          </Link>
        );
      })}
    </nav>
  );
}
