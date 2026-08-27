/**
 * Jeton de session signé (HMAC-SHA256), au format `payloadBase64Url.signatureBase64Url`.
 * Utilise l'API Web Crypto (disponible aussi bien dans le middleware Edge que côté Node),
 * pour éviter toute dépendance à Prisma dans le middleware.
 */

const DUREE_SESSION_SECONDES = 7 * 24 * 3600; // 7 jours

export interface SessionPayload {
  personneId: string;
  /** Identifiant unique de cette connexion précise (voir modèle Connexion) — permet à la
   * déconnexion de retrouver puis clore la bonne ligne dans Administration › Connexions. */
  sid: string;
  exp: number; // timestamp unix (secondes)
}

function secret(): string {
  const valeur = process.env.AUTH_SECRET;
  if (!valeur) throw new Error("AUTH_SECRET manquant dans les variables d'environnement.");
  return valeur;
}

async function cle(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function base64url(bytes: Uint8Array): string {
  let binaire = "";
  for (const octet of bytes) binaire += String.fromCharCode(octet);
  return btoa(binaire).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// @types/node fait fusionner Uint8Array avec un paramètre générique par défaut différent de
// celui attendu par lib.dom (BufferSource) ; le cast rend explicite que le buffer est concret.
function depuisBase64url(str: string): Uint8Array<ArrayBuffer> {
  const complete = str.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (str.length % 4)) % 4);
  const binaire = atob(complete);
  const octets = new Uint8Array(binaire.length);
  for (let i = 0; i < binaire.length; i++) octets[i] = binaire.charCodeAt(i);
  return octets as Uint8Array<ArrayBuffer>;
}

export async function creerJetonSession(personneId: string, sid: string): Promise<string> {
  const payload: SessionPayload = {
    personneId,
    sid,
    exp: Math.floor(Date.now() / 1000) + DUREE_SESSION_SECONDES,
  };
  const payloadB64 = base64url(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign("HMAC", await cle(), new TextEncoder().encode(payloadB64));
  return `${payloadB64}.${base64url(new Uint8Array(signature))}`;
}

export async function verifierJetonSession(jeton: string | undefined | null): Promise<SessionPayload | null> {
  if (!jeton) return null;
  const [payloadB64, signatureB64] = jeton.split(".");
  if (!payloadB64 || !signatureB64) return null;

  // Un jeton corrompu ou falsifié (cookie manipulé) ne doit jamais faire planter la requête :
  // toute anomalie (base64 invalide, JSON invalide, etc.) est traitée comme "non connecté".
  try {
    const valide = await crypto.subtle.verify(
      "HMAC",
      await cle(),
      depuisBase64url(signatureB64),
      new TextEncoder().encode(payloadB64)
    );
    if (!valide) return null;

    const payload = JSON.parse(new TextDecoder().decode(depuisBase64url(payloadB64))) as SessionPayload;
    if (
      typeof payload.personneId !== "string" ||
      typeof payload.sid !== "string" ||
      payload.exp < Math.floor(Date.now() / 1000)
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export const NOM_COOKIE_SESSION = "verticale_session";
