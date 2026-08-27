"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { creerPremierCompte } from "@/app/authActions";

export default function SetupForm() {
  const router = useRouter();
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      await creerPremierCompte({ nom, prenom, email, telephone: telephone || undefined, motDePasse });
      router.push("/");
      router.refresh();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Une erreur est survenue.");
      setEnCours(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 bg-surface border border-border rounded-lg p-6">
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Prénom
          <input
            required
            value={prenom}
            onChange={(e) => setPrenom(e.target.value)}
            className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-background"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Nom
          <input
            required
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-background"
          />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Adresse e-mail
        <input
          required
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-background"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Téléphone (optionnel)
        <input
          value={telephone}
          onChange={(e) => setTelephone(e.target.value)}
          className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-background"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Mot de passe (8 caractères minimum)
        <input
          required
          type="password"
          minLength={8}
          autoComplete="new-password"
          value={motDePasse}
          onChange={(e) => setMotDePasse(e.target.value)}
          className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-background"
        />
      </label>

      {erreur && <p className="text-sm text-red-600">{erreur}</p>}

      <button
        type="submit"
        disabled={enCours}
        className="rounded-md bg-foreground text-background text-sm font-medium px-5 py-2.5 hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {enCours ? "Création…" : "Créer le compte et me connecter"}
      </button>
    </form>
  );
}
