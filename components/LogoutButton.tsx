"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deconnexion } from "@/app/authActions";

export default function LogoutButton() {
  const router = useRouter();
  const [enCours, setEnCours] = useState(false);

  async function handleClick() {
    setEnCours(true);
    await deconnexion();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={enCours}
      className="text-sm text-muted hover:text-foreground disabled:opacity-50"
    >
      {enCours ? "…" : "Déconnexion"}
    </button>
  );
}
