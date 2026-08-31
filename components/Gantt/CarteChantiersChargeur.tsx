"use client";

import dynamic from "next/dynamic";
import type { ChantierCarte } from "./CarteChantiers";

// Leaflet touche `window`/`document` au chargement du module : ssr:false est obligatoire, et ne
// peut s'employer que depuis un composant client — d'où cette coquille dédiée à cet unique appel.
const CarteChantiers = dynamic(() => import("./CarteChantiers"), { ssr: false });

export default function CarteChantiersChargeur({ chantiers }: { chantiers: ChantierCarte[] }) {
  return <CarteChantiers chantiers={chantiers} />;
}
