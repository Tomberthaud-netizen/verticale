import { NextResponse, type NextRequest } from "next/server";
import { NOM_COOKIE_SESSION, verifierJetonSession } from "@/lib/session";

// Chemins accessibles sans être connecté. /api/ics est un flux calendrier public consommé
// par des applications externes (Google Agenda), pas par une session de navigateur.
const CHEMINS_PUBLICS = ["/login", "/setup"];

// Fichiers statiques (logo, photos uploadées, etc.) : toujours publics. Sans ce filtre, la
// requête interne que Next.js fait vers /logo.jpg pour l'optimisation d'image est elle-même
// redirigée vers /login, et le logo casse silencieusement.
const EXTENSIONS_STATIQUES = /\.(?:jpg|jpeg|png|gif|svg|webp|ico|css|js|map|woff|woff2|ttf|txt|json)$/i;

function estPublic(pathname: string): boolean {
  if (CHEMINS_PUBLICS.some((c) => pathname === c)) return true;
  if (pathname.startsWith("/api/ics")) return true;
  if (pathname.startsWith("/uploads/")) return true;
  if (EXTENSIONS_STATIQUES.test(pathname)) return true;
  return false;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (estPublic(pathname)) return NextResponse.next();

  const jeton = request.cookies.get(NOM_COOKIE_SESSION)?.value;
  const payload = await verifierJetonSession(jeton);
  if (!payload) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("suite", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Toutes les routes sauf les assets statiques Next.js et le favicon.
     */
    "/((?!_next/static|_next/image|favicon.ico|uploads/).*)",
  ],
};
