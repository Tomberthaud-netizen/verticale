import { redirect } from "next/navigation";

/** La liste des personnes vit désormais dans Administration › Personnes. */
export default function PersonnesPage() {
  redirect("/administration");
}
