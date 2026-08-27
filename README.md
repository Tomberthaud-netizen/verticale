# Verticale — Suivi de chantiers

Application de suivi de chantiers (Next.js + TypeScript + Tailwind + Prisma/SQLite). Voir [CLAUDE.md](./CLAUDE.md) pour le cahier des charges complet.

## Démarrer

```bash
npm install
npx prisma migrate dev
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Tests

```bash
npm run test
```

Teste la logique métier de calcul de dates dans `lib/dates.ts`.
