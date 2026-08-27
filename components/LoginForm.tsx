"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { connexion } from "@/app/authActions";

function destinationSure(destination: string | undefined): string {
  if (destination && destination.startsWith("/") && !destination.startsWith("//")) return destination;
  return "/";
}

export default function LoginForm({ destination }: { destination?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      await connexion(email, motDePasse);
      router.push(destinationSure(destination));
      router.refresh();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Une erreur est survenue.");
      setEnCours(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 bg-surface border border-border rounded-lg p-6">
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
        Mot de passe
        <input
          required
          type="password"
          autoComplete="current-password"
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
        {enCours ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  );
}
