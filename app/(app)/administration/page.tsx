import { requireAcces } from "@/lib/authContext";
import AdminCard from "@/components/admin/AdminCard";

export default async function AdministrationPage() {
  const moi = await requireAcces("ADMINISTRATION");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Administration</h1>
      <div className="grid sm:grid-cols-2 gap-4">
        <AdminCard
          titre="Utilisateurs & accès"
          description="Créer des comptes de connexion pour vos collègues et gérer leurs rôles."
          lienHref="/administration/personnes"
          lienLabel="Gérer les utilisateurs"
        />
        {moi.estAdmin && (
          <>
            <AdminCard
              titre="Connexions"
              description="Qui est connecté en ce moment, depuis quand, depuis quelle adresse IP et avec quel appareil."
              lienHref="/administration/connexions"
              lienLabel="Voir les connexions"
            />
            <AdminCard
              titre="Informations société"
              description="Coordonnées légales et logo de chaque entreprise."
              lienHref="/administration/informations-societe"
              lienLabel="Modifier les informations"
            />
            <AdminCard
              titre="Réglages du site"
              description="Couleur principale, ordre et noms des onglets du menu."
              lienHref="/administration/reglages"
              lienLabel="Gérer les réglages"
            />
            <AdminCard
              titre="Email"
              description="Modèle du mail envoyé depuis un devis validé (objet, corps, placeholders)."
              lienHref="/administration/email"
              lienLabel="Gérer le modèle"
            />
            <AdminCard
              titre="Modèles de rénovation"
              description="Types de rénovation disponibles et leur coût moyen au m², pour la suggestion de montant en Finances."
              lienHref="/administration/modeles-renovation"
              lienLabel="Gérer les modèles"
            />
          </>
        )}
      </div>
    </div>
  );
}
