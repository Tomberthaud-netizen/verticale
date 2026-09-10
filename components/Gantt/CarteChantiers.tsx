"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import type { Map as LeafletMap } from "leaflet";
import Link from "next/link";
import { ETAT_COLORS } from "@/constants/colors";
import type { EtatChantier } from "@/lib/dates";
import type { Entreprise } from "@/constants/entreprises";
import RetirerChantierCarteButton from "./RetirerChantierCarteButton";

export interface ChantierCarte {
  id: string;
  nom: string;
  latitude: number;
  longitude: number;
  etat: EtatChantier;
  entreprise: Entreprise;
}

const HAUTEUR_REDUITE = 220;
const HAUTEUR_AGRANDIE = 600;
// Durée de la transition CSS de hauteur du conteneur (voir div englobante ci-dessous). Le style
// du MapContainer lui-même ne peut PAS porter cette hauteur : react-leaflet fige son prop
// `style` au montage (via useState) et ne le remet jamais à jour sur un re-render — d'où cette
// div intermédiaire, dont la hauteur est un état React normal, que le MapContainer remplit à
// 100%. Leaflet ne détecte pas non plus seul le redimensionnement de son conteneur :
// invalidateSize() doit être appelé manuellement une fois la transition terminée.
const DUREE_TRANSITION_MS = 200;

export default function CarteChantiers({ chantiers }: { chantiers: ChantierCarte[] }) {
  const [agrandie, setAgrandie] = useState(false);
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => mapRef.current?.invalidateSize(), DUREE_TRANSITION_MS);
    return () => clearTimeout(timeout);
  }, [agrandie]);

  if (chantiers.length === 0) return null;

  const centre: [number, number] = [
    chantiers.reduce((s, c) => s + c.latitude, 0) / chantiers.length,
    chantiers.reduce((s, c) => s + c.longitude, 0) / chantiers.length,
  ];

  return (
    <div className="relative rounded-lg overflow-hidden border border-border">
      <div
        style={{
          height: agrandie ? HAUTEUR_AGRANDIE : HAUTEUR_REDUITE,
          transition: `height ${DUREE_TRANSITION_MS}ms ease`,
        }}
      >
        <MapContainer ref={mapRef} center={centre} zoom={11} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">Contributeurs OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {chantiers.map((c) => {
            const couleur = ETAT_COLORS[c.etat].text;
            return (
              <CircleMarker
                key={c.id}
                center={[c.latitude, c.longitude]}
                radius={9}
                pathOptions={{ color: couleur, fillColor: couleur, fillOpacity: 0.85, weight: 2 }}
              >
                <Popup>
                  <Link href={`/chantiers/${c.id}`} className="font-medium underline">
                    {c.nom}
                  </Link>
                  <br />
                  <span className="text-muted">{ETAT_COLORS[c.etat].label}</span>
                  {c.etat === "TERMINE" && (
                    <div>
                      <RetirerChantierCarteButton chantierId={c.id} nomChantier={c.nom} entreprise={c.entreprise} />
                    </div>
                  )}
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>
      <div className="absolute bottom-2 left-2 z-[1000] bg-surface/95 border border-border rounded-md px-2 py-1 text-xs font-medium shadow-sm pointer-events-none">
        {chantiers.length} chantier{chantiers.length > 1 ? "s" : ""}
      </div>
      <button
        type="button"
        onClick={() => setAgrandie((a) => !a)}
        className="print:hidden absolute top-2 right-2 z-[1000] bg-surface/95 border border-border rounded-md px-2 py-1 text-xs font-medium shadow-sm hover:bg-surface transition-colors"
      >
        {agrandie ? "Réduire la carte" : "Agrandir la carte"}
      </button>
    </div>
  );
}
