"use client";

import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import Link from "next/link";

export interface ChantierCarte {
  id: string;
  nom: string;
  latitude: number;
  longitude: number;
}

export default function CarteChantiers({ chantiers }: { chantiers: ChantierCarte[] }) {
  if (chantiers.length === 0) return null;

  const centre: [number, number] = [
    chantiers.reduce((s, c) => s + c.latitude, 0) / chantiers.length,
    chantiers.reduce((s, c) => s + c.longitude, 0) / chantiers.length,
  ];

  return (
    <div className="relative rounded-lg overflow-hidden border border-border print:hidden">
      <MapContainer center={centre} zoom={11} scrollWheelZoom={false} style={{ height: 220, width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">Contributeurs OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {chantiers.map((c) => (
          <CircleMarker
            key={c.id}
            center={[c.latitude, c.longitude]}
            radius={9}
            pathOptions={{ color: "#1c1917", fillColor: "#1c1917", fillOpacity: 0.85, weight: 2 }}
          >
            <Popup>
              <Link href={`/chantiers/${c.id}`} className="font-medium underline">
                {c.nom}
              </Link>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
      <div className="absolute bottom-2 left-2 z-[1000] bg-surface/95 border border-border rounded-md px-2 py-1 text-xs font-medium shadow-sm pointer-events-none">
        {chantiers.length} chantier{chantiers.length > 1 ? "s" : ""} en cours
      </div>
    </div>
  );
}
