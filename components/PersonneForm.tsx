"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { creerPersonne, modifierPersonne } from "@/app/personnesActions";
import { ACCES_LABELS, ACCES_ONGLETS, ONGLETS_SANS_ENTREPRISE } from "@/constants/acces";
import { ENTREPRISES } from "@/constants/entreprises";
import type { AccesOnglet } from "@prisma/client";

export interface PersonneExistante {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
  estAdmin: boolean;
  estAdminPrincipal: boolean;
  acces: { onglet: AccesOnglet; entreprise: string | null }[];
}

/** Sélection d'accès par onglet : "" = aucun accès, "BOTH" = les deux entreprises, ou une entreprise précise. */
type ValeurAcces = "" | "BOTH" | (typeof ENTREPRISES)[number];

function accesInitiaux(acces?: PersonneExistante["acces"]): Record<AccesOnglet, ValeurAcces> {
  const initial = Object.fromEntries(ACCES_ONGLETS.map((o) => [o, ""])) as Record<AccesOnglet, ValeurAcces>;
  for (const a of acces ?? []) {
    initial[a.onglet] = (a.entreprise as ValeurAcces | null) ?? "BOTH";
  }
  return initial;
}

export default function PersonneForm({
  personneExistante,
  moiEstAdminPrincipal = false,
}: {
  personneExistante?: PersonneExistante;
  /** Si l'utilisateur connecté n'est pas l'administrateur principal, il ne peut pas retirer
   * les droits admin d'un compte qui les a déjà. */
  moiEstAdminPrincipal?: boolean;
}) {
  const router = useRouter();
  const [nom, setNom] = useState(personneExistante?.nom ?? "");
  const [prenom, setPrenom] = useState(personneExistante?.prenom ?? "");
  const [email, setEmail] = useState(personneExistante?.email ?? "");
  const [telephone, setTelephone] = useState(personneExistante?.telephone ?? "");
  const [motDePasse, setMotDePasse] = useState("");
  const [estAdmin, setEstAdmin] = useState(personneExistante?.estAdmin ?? false);
  const [acces, setAcces] = useState<Record<AccesOnglet, ValeurAcces>>(() => accesInitiaux(personneExistante?.acces));
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const adminVerrouille =
    personneExistante?.estAdminPrincipal || (!!personneExistante?.estAdmin && !moiEstAdminPrincipal);

  function definirAcces(onglet: AccesOnglet, valeur: ValeurAcces) {
    setAcces((prev) => ({ ...prev, [onglet]: valeur }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      const accesPayload = ACCES_ONGLETS.filter((onglet) => acces[onglet] !== "").map((onglet) => ({
        onglet,
        entreprise: acces[onglet] === "BOTH" ? null : acces[onglet],
      }));
      if (personneExistante) {
        await modifierPersonne(personneExistante.id, {
          nom,
          prenom,
          email,
          telephone: telephone || undefined,
          motDePasse: motDePasse || undefined,
          estAdmin,
          acces: accesPayload,
        });
      } else {
        if (!motDePasse) {
          setErreur("Le mot de passe est obligatoire à la création.");
          setEnCours(false);
          return;
        }
        const { emailEnvoye } = await creerPersonne({
          nom,
          prenom,
          email,
          telephone: telephone || undefined,
          motDePasse,
          estAdmin,
          acces: accesPayload,
        });
        if (!emailEnvoye) {
          window.alert(
            "Le compte a été créé, mais l'e-mail avec les identifiants n'a pas pu être envoyé. Communiquez-les manuellement à la personne."
          );
        }
      }
      router.push("/administration");
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Une erreur est survenue.");
      setEnCours(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-xl">
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Prénom
          <input
            required
            value={prenom}
            onChange={(e) => setPrenom(e.target.value)}
            className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Nom
          <input
            required
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Adresse e-mail
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Téléphone (optionnel)
          <input
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
            className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium sm:col-span-2">
          {personneExistante ? "Nouveau mot de passe (laisser vide pour ne pas changer)" : "Mot de passe (8 caractères minimum)"}
          <input
            type="password"
            minLength={8}
            autoComplete="new-password"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface"
          />
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          checked={estAdmin}
          disabled={adminVerrouille}
          onChange={(e) => setEstAdmin(e.target.checked)}
          className="rounded border-border disabled:opacity-50"
        />
        Administrateur
        <span className="text-xs text-muted font-normal">
          (peut gérer les personnes — créer, modifier, supprimer des comptes)
        </span>
      </label>
      {personneExistante?.estAdminPrincipal && (
        <p className="text-xs text-muted -mt-4">
          Administrateur principal : ses droits ne peuvent pas être retirés.
        </p>
      )}
      {!personneExistante?.estAdminPrincipal && personneExistante?.estAdmin && !moiEstAdminPrincipal && (
        <p className="text-xs text-muted -mt-4">
          Seul l&apos;administrateur principal peut retirer les droits administrateur de ce compte.
        </p>
      )}

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold">Accès aux onglets</h3>
        <p className="text-xs text-muted -mt-1">
          Pour chaque onglet propre à une société, choisissez si l&apos;accès vaut pour VERTICALE, pour CB2B, ou les
          deux. Calendrier Global, Catalogue et Personnes sont communs aux deux entreprises.
        </p>
        <div className="flex flex-col gap-1.5">
          {ACCES_ONGLETS.map((onglet) => {
            const sansEntreprise = ONGLETS_SANS_ENTREPRISE.includes(onglet);
            return (
              <div key={onglet} className="flex items-center gap-3 text-sm">
                <label className="flex items-center gap-2 w-40 shrink-0">
                  <input
                    type="checkbox"
                    checked={acces[onglet] !== ""}
                    onChange={(e) => definirAcces(onglet, e.target.checked ? "BOTH" : "")}
                    className="rounded border-border"
                  />
                  {ACCES_LABELS[onglet]}
                </label>
                {!sansEntreprise && acces[onglet] !== "" && (
                  <select
                    value={acces[onglet]}
                    onChange={(e) => definirAcces(onglet, e.target.value as ValeurAcces)}
                    className="border border-border rounded-md px-2 py-1 text-xs bg-surface"
                  >
                    <option value="BOTH">Les deux entreprises</option>
                    {ENTREPRISES.map((ent) => (
                      <option key={ent} value={ent}>
                        {ent} uniquement
                      </option>
                    ))}
                  </select>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {erreur && <p className="text-sm text-red-600">{erreur}</p>}

      <button
        type="submit"
        disabled={enCours}
        className="self-start rounded-md bg-foreground text-background text-sm font-medium px-5 py-2.5 hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {enCours ? "Enregistrement…" : personneExistante ? "Enregistrer les modifications" : "Créer la personne"}
      </button>
    </form>
  );
}
