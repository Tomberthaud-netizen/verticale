import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface ConnexionAvecPersonne {
  id: string;
  ip: string | null;
  appareil: string | null;
  connecteLe: Date;
  personne: { id: string; nom: string; prenom: string; email: string };
}

export default function ConnexionsPanel({ connexions }: { connexions: ConnexionAvecPersonne[] }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted">
        Personnes actuellement connectées (session active de moins de 7 jours, non déconnectée).
      </p>
      {connexions.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left text-muted border-b border-border">
                <th className="py-2 pr-2 font-medium">Personne</th>
                <th className="py-2 pr-2 font-medium">Connecté depuis</th>
                <th className="py-2 pr-2 font-medium">Adresse IP</th>
                <th className="py-2 pr-0 font-medium">Appareil</th>
              </tr>
            </thead>
            <tbody>
              {connexions.map((c) => (
                <tr key={c.id} className="border-b border-border">
                  <td className="py-2 pr-2">
                    <span className="font-medium">
                      {c.personne.prenom} {c.personne.nom}
                    </span>
                    <span className="text-muted"> — {c.personne.email}</span>
                  </td>
                  <td className="py-2 pr-2" title={format(c.connecteLe, "d MMMM yyyy à HH:mm", { locale: fr })}>
                    {formatDistanceToNow(c.connecteLe, { locale: fr, addSuffix: true })}
                  </td>
                  <td className="py-2 pr-2 text-muted">{c.ip ?? "—"}</td>
                  <td className="py-2 pr-0 text-muted truncate max-w-xs" title={c.appareil ?? undefined}>
                    {c.appareil ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-muted">Personne d&apos;autre connecté pour le moment.</p>
      )}
    </div>
  );
}
