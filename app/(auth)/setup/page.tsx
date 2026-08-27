import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SetupForm from "@/components/SetupForm";

export default async function SetupPage() {
  const nombrePersonnes = await prisma.personne.count();
  if (nombrePersonnes > 0) redirect("/login");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-2xl font-semibold">Premier compte administrateur</h1>
        <p className="text-sm text-muted">
          Aucun compte n&apos;existe encore. Créez le premier — il aura accès à toutes les sections.
        </p>
      </div>
      <SetupForm />
    </div>
  );
}
