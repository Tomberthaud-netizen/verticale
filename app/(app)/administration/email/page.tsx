import { requireAdmin } from "@/lib/authContext";
import { getParametresEmail } from "@/lib/queries";
import RetourButton from "@/components/RetourButton";
import EmailPanel from "@/components/admin/EmailPanel";

export default async function AdministrationEmailPage() {
  await requireAdmin();
  const parametres = await getParametresEmail();

  return (
    <div className="flex flex-col gap-6">
      <RetourButton />
      <h1 className="text-2xl font-semibold">Email</h1>
      <EmailPanel objet={parametres.objet} corps={parametres.corps} />
    </div>
  );
}
