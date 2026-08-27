/**
 * Corps de métier / types de produits, utilisés pour classer les fournisseurs et pour
 * recouper avec le catalogue de prix de référence (constants/lots.ts doit rester aligné
 * avec les valeurs `lot` déjà présentes dans PrixReference — voir prisma/seed-data/).
 */
export const LOTS = [
  "Démolition",
  "Terrassement",
  "VRD",
  "Fondations spéciales",
  "GO",
  "Charpente Bois",
  "Couverture",
  "Étanchéité",
  "Façade",
  "Menuiserie Extérieure",
  "Menuiserie Intérieure",
  "Cloisons Doublage",
  "Chape",
  "Carrelage Faïence",
  "Sols Souples",
  "Faux Plafond",
  "Peinture",
  "Plomberie Sanitaire Chauffage",
  "Elec",
  "Métallerie Serrurerie",
  "Ascenseur",
  "Toiture Végétalisée",
  "Pompage",
] as const;
