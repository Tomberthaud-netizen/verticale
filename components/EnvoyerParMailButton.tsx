"use client";

function remplacerPlaceholders(texte: string, valeurs: Record<string, string>): string {
  return texte.replace(/\{(\w+)\}/g, (correspondance, cle: string) => valeurs[cle] ?? correspondance);
}

export default function EnvoyerParMailButton({
  devisId,
  numero,
  intitule,
  entreprise,
  clientNom,
  clientEmail,
  objetModele,
  corpsModele,
}: {
  devisId: string;
  numero: string;
  intitule: string;
  entreprise: string;
  clientNom: string | null;
  clientEmail: string | null;
  objetModele: string;
  corpsModele: string;
}) {
  const valeurs = {
    numero,
    intitule,
    entreprise,
    clientNom: clientNom || "Madame, Monsieur",
  };

  function envoyer() {
    if (!clientEmail) return;

    // Télécharge le PDF du devis à joindre manuellement (mailto: ne permet pas les pièces jointes).
    const lien = document.createElement("a");
    lien.href = `/api/devis/${devisId}/pdf`;
    lien.download = `${numero}.pdf`;
    document.body.appendChild(lien);
    lien.click();
    document.body.removeChild(lien);

    const objet = remplacerPlaceholders(objetModele, valeurs);
    const corps = remplacerPlaceholders(corpsModele, valeurs);
    const mailto = `mailto:${encodeURIComponent(clientEmail)}?subject=${encodeURIComponent(objet)}&body=${encodeURIComponent(corps)}`;
    window.setTimeout(() => {
      window.location.href = mailto;
    }, 300);
  }

  return (
    <div className="flex flex-col items-end gap-1 ml-auto">
      <button
        type="button"
        onClick={envoyer}
        disabled={!clientEmail}
        title={!clientEmail ? "Renseignez l'email du client dans la fiche devis pour activer l'envoi." : undefined}
        className="rounded-md bg-accent text-background text-sm font-medium px-5 py-2.5 hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Envoyer par mail
      </button>
      {!clientEmail && (
        <p className="text-xs text-muted">Renseignez l&apos;email du client pour activer l&apos;envoi.</p>
      )}
    </div>
  );
}
