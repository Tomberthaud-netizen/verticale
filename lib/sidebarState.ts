"use server";

import { cookies } from "next/headers";

const NOM_COOKIE_SIDEBAR = "verticale_sidebar_reduit";

export async function getSidebarReduit(): Promise<boolean> {
  const store = await cookies();
  return store.get(NOM_COOKIE_SIDEBAR)?.value === "1";
}

export async function definirSidebarReduit(reduit: boolean) {
  const store = await cookies();
  store.set(NOM_COOKIE_SIDEBAR, reduit ? "1" : "0", { path: "/", maxAge: 60 * 60 * 24 * 365 });
}
