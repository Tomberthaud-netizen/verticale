import { addDays, format } from "date-fns";
import { libellePhase } from "@/constants/colors";
import type { ChantierCalcule } from "./chantier";

function echapperTexteICS(texte: string): string {
  return texte
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function formatDateICS(date: Date): string {
  return format(date, "yyyyMMdd");
}

/** Horodatage UTC au format RFC 5545 (indépendant du fuseau horaire du serveur). */
function formatDateTimeUTC(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

/** Pliage des lignes selon RFC 5545 (75 octets max, continuation indentée). */
function plierLigne(ligne: string): string {
  if (ligne.length <= 75) return ligne;
  let resultat = "";
  let reste = ligne;
  let premiere = true;
  while (reste.length > 0) {
    const taille = premiere ? 75 : 74;
    resultat += (premiere ? "" : "\r\n ") + reste.slice(0, taille);
    reste = reste.slice(taille);
    premiere = false;
  }
  return resultat;
}

interface EvenementICS {
  uid: string;
  debut: Date;
  fin: Date;
  titre: string;
  description?: string | null;
}

function construireEvenement(e: EvenementICS): string[] {
  const lignes = [
    "BEGIN:VEVENT",
    `UID:${e.uid}`,
    `DTSTAMP:${formatDateTimeUTC(new Date())}`,
    `DTSTART;VALUE=DATE:${formatDateICS(e.debut)}`,
    `DTEND;VALUE=DATE:${formatDateICS(addDays(e.fin, 1))}`,
    `SUMMARY:${echapperTexteICS(e.titre)}`,
  ];
  if (e.description) lignes.push(`DESCRIPTION:${echapperTexteICS(e.description)}`);
  lignes.push("END:VEVENT");
  return lignes.map(plierLigne);
}

/** Construit un calendrier .ics (RFC 5545) à partir des chantiers calculés donnés. */
export function construireCalendrierICS(chantiers: ChantierCalcule[]): string {
  const lignesEvenements: string[] = [];

  for (const c of chantiers) {
    for (const phase of c.phases) {
      lignesEvenements.push(
        ...construireEvenement({
          uid: `phase-${phase.id}@verticale.local`,
          debut: phase.dateDebut,
          fin: phase.dateFin,
          titre: `${c.nom} — ${libellePhase(phase)}`,
        })
      );
    }
    for (const retard of c.retards) {
      lignesEvenements.push(
        ...construireEvenement({
          uid: `retard-${retard.id}@verticale.local`,
          debut: retard.dateDebut,
          fin: retard.dateFin,
          titre: `${c.nom} — Retard`,
          description: retard.commentaire,
        })
      );
    }
    for (const d of c.datesImportantes) {
      lignesEvenements.push(
        ...construireEvenement({
          uid: `date-${d.id}@verticale.local`,
          debut: d.date,
          fin: d.date,
          titre: `${c.nom} — ${d.nom}`,
        })
      );
    }
    for (const a of c.alertes) {
      lignesEvenements.push(
        ...construireEvenement({
          uid: `alerte-${a.id}@verticale.local`,
          debut: a.dateDeclenchement,
          fin: a.dateDeclenchement,
          titre: `⚠ ${c.nom} — Alerte J-${a.joursAvantLivraison} avant livraison`,
        })
      );
    }
  }

  const lignes = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Verticale//Suivi de chantiers//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Verticale — Suivi de chantiers",
    ...lignesEvenements,
    "END:VCALENDAR",
  ];

  return lignes.join("\r\n") + "\r\n";
}
