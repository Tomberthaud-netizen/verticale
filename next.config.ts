import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
      bodySizeLimit: "15mb",
    },
  },
};

export default nextConfig;
