/** Nombre maximum de photos envoyées en un seul ajout (formulaire + action serveur, cf.
 * PhotoUploadForm.tsx et ajouterPhoto dans app/actions.ts) — au-delà, la taille cumulée des
 * photos d'un téléphone récent dépasse vite la limite de taille des Server Actions Next.js
 * (bodySizeLimit, next.config.mjs) et l'envoi devient très long, voire échoue silencieusement. */
export const MAX_PHOTOS_PAR_ENVOI = 10;
