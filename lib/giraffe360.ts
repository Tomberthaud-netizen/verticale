import Anthropic from "@anthropic-ai/sdk";

const API_BASE = "https://api.giraffe360.com";

export interface Giraffe360FloorPlan {
  url: string;
  file_format: string;
}

export interface Giraffe360Project {
  id: string;
  name: string;
  address: string | null;
  floor_plans: Giraffe360FloorPlan[];
  ai_floor_plans: Giraffe360FloorPlan[];
}

/** Récupère un projet Giraffe360 (bien scanné) par son id, via l'API officielle. */
export async function getGiraffe360Project(projectId: string): Promise<Giraffe360Project> {
  const token = process.env.GIRAFFE360_API_TOKEN;
  if (!token) throw new Error("GIRAFFE360_API_TOKEN manquant dans .env.");
  const res = await fetch(`${API_BASE}/api/v2/projects/${projectId}/`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Giraffe360 a répondu ${res.status} pour le projet ${projectId}.`);
  return res.json();
}

/** Choisit la meilleure image de plan d'étage exploitable par l'IA (jpg/png — jamais svg, qui
 * n'est pas une image bitmap) : préfère un plan généré par IA s'il existe, sinon le premier plan
 * standard disponible dans ce format. */
export function choisirImagePlan(project: Giraffe360Project): Giraffe360FloorPlan | null {
  const estRaster = (f: Giraffe360FloorPlan) => f.file_format === "jpg" || f.file_format === "png";
  return project.ai_floor_plans.find(estRaster) ?? project.floor_plans.find(estRaster) ?? null;
}

export interface InfosPlanExtraites {
  surfaceM2: number | null;
  nombrePieces: number | null;
}

/**
 * Lit l'image d'un plan d'étage Giraffe360 et fait extraire par l'IA la surface totale et le
 * nombre de pièces (au sens immobilier français : hors salle de bains/WC/entrée/couloir/cuisine).
 * Best-effort, ne lève jamais d'exception : renvoie {null, null} si l'extraction échoue (clé
 * manquante, image inaccessible, réponse illisible…) pour ne jamais bloquer la création du
 * chantier provisoire — l'utilisateur complète alors ces deux champs à la main.
 */
export async function extraireInfosPlan(plan: Giraffe360FloorPlan): Promise<InfosPlanExtraites> {
  const ECHEC: InfosPlanExtraites = { surfaceM2: null, nombrePieces: null };
  if (!process.env.ANTHROPIC_API_KEY) return ECHEC;

  try {
    const imageRes = await fetch(plan.url, { signal: AbortSignal.timeout(15000) });
    if (!imageRes.ok) return ECHEC;
    const buffer = Buffer.from(await imageRes.arrayBuffer());
    const mediaType = plan.file_format === "png" ? "image/png" : "image/jpeg";

    const client = new Anthropic();
    const reponse = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 1024,
      system:
        "Tu lis un plan d'étage généré par Giraffe360 pour un bien immobilier français. Réponds " +
        'UNIQUEMENT avec un JSON valide {"surfaceM2": number ou null, "nombrePieces": number ou ' +
        'null}, sans texte autour, sans balises markdown. surfaceM2 est la surface totale ' +
        'approximative indiquée sur le plan (cherche un texte du type "Surface totale ' +
        'approximative"). nombrePieces est le nombre de pièces au sens de l\'immobilier français : ' +
        "compte uniquement les pièces principales habitables (chambres, séjour, salon, salle à " +
        "manger, bureau...) — exclus salle de bains, WC, cuisine, entrée, couloir, dressing, cave, " +
        "balcon, terrasse. Si une information n'est pas lisible sur le plan, mets null pour ce " +
        "champ plutôt que d'inventer une valeur.",
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: buffer.toString("base64") } },
            { type: "text", text: "Extrait la surface totale et le nombre de pièces de ce plan." },
          ],
        },
      ],
    });

    const bloc = reponse.content.find((b) => b.type === "text");
    if (!bloc || bloc.type !== "text") return ECHEC;
    const brut = bloc.text
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```\s*$/, "");
    const parsed = JSON.parse(brut) as { surfaceM2?: unknown; nombrePieces?: unknown };
    const surfaceM2 = typeof parsed.surfaceM2 === "number" && parsed.surfaceM2 > 0 ? parsed.surfaceM2 : null;
    const nombrePieces =
      typeof parsed.nombrePieces === "number" && Number.isInteger(parsed.nombrePieces) && parsed.nombrePieces > 0
        ? parsed.nombrePieces
        : null;
    return { surfaceM2, nombrePieces };
  } catch {
    return ECHEC;
  }
}
