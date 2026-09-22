/** @type {import('next').NextConfig} */
const nextConfig = {
  // Build de production autonome (dossier .next/standalone) : nécessaire pour livrer un
  // dossier "dist" déjà compilé, sans avoir à réinstaller/recompiler sur le serveur.
  output: "standalone",
  serverExternalPackages: ["@prisma/client"],
  // Le tracing de fichiers ne peut pas résoudre statiquement le chemin du logo (chargé
  // dynamiquement depuis la base dans lib/pdfDevis.ts) : par prudence il incluait tout le
  // dossier Devis/ (165 PDF sources, 120+ Mo) dans le build de production. Ces dossiers ne
  // sont jamais lus au runtime, on les exclut explicitement.
  outputFileTracingExcludes: {
    "/**": ["./Devis/**/*", "./Logo/**/*", "./.claude/**/*"],
  },
  experimental: {
    serverActions: {
      // Le dossier photos d'un chantier accepte jusqu'à MAX_PHOTOS_PAR_ENVOI (constants/photos.ts)
      // photos par envoi ; une photo de smartphone récent pèse couramment 3 à 6 Mo, donc 15 Mo
      // suffisait à peine pour 2-3 photos et provoquait de longs envois/échecs silencieux au-delà.
      bodySizeLimit: "50mb",
    },
  },
};

export default nextConfig;
