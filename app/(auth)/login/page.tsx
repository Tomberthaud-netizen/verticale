import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import LoginForm from "@/components/LoginForm";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const nombrePersonnes = await prisma.personne.count();
  if (nombrePersonnes === 0) redirect("/setup");

  const { suite } = await searchParams;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-1">
        <h1 className="text-2xl font-semibold">Connexion</h1>
        <p className="text-sm text-muted">Suivi de chantiers Verticale</p>
      </div>
      <LoginForm destination={typeof suite === "string" ? suite : undefined} />
    </div>
  );
}
