"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { definirEntrepriseActive } from "@/lib/entrepriseActive";
import type { Entreprise } from "@/constants/entreprises";

export default function EntrepriseSwitcher({
  actif,
  logos,
}: {
  actif: Entreprise;
  logos: Record<Entreprise, string | null>;
}) {
  const router = useRouter();
  const [enCours, setEnCours] = useState(false);

  async function choisir(entreprise: Entreprise) {
    if (entreprise === actif || enCours) return;
    setEnCours(true);
    try {
      await definirEntrepriseActive(entreprise);
      router.refresh();
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      <button
        type="button"
        onClick={() => choisir("VERTICALE")}
        disabled={enCours}
        title="Afficher VERTICALE"
        className={`flex items-center rounded-md transition-opacity disabled:cursor-wait ${
          actif === "VERTICALE" ? "opacity-100" : "opacity-30 hover:opacity-70"
        }`}
      >
        <Image
          src={logos.VERTICALE || "/logo.jpg"}
          alt="Verticale"
          width={320}
          height={196}
          className="h-16 sm:h-24 w-auto object-contain"
          priority
        />
      </button>
      <span className="text-border text-xl font-light select-none">/</span>
      {logos.CB2B ? (
        <button
          type="button"
          onClick={() => choisir("CB2B")}
          disabled={enCours}
          title="Afficher CB2B"
          className={`flex items-center rounded-md transition-opacity disabled:cursor-wait ${
            actif === "CB2B" ? "opacity-100" : "opacity-30 hover:opacity-70"
          }`}
        >
          <Image src={logos.CB2B} alt="CB2B" width={320} height={196} className="h-16 sm:h-24 w-auto object-contain" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => choisir("CB2B")}
          disabled={enCours}
          title="Afficher CB2B"
          className={`rounded-md px-2 py-1 font-bold tracking-wide text-xl transition-opacity disabled:cursor-wait ${
            actif === "CB2B" ? "opacity-100" : "opacity-30 hover:opacity-70"
          }`}
          style={{ color: "#1e3a5f" }}
        >
          CB2B
        </button>
      )}
    </div>
  );
}
