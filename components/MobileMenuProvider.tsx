"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface MobileMenuContextValue {
  ouvert: boolean;
  toggle: () => void;
  fermer: () => void;
}

const MobileMenuContext = createContext<MobileMenuContextValue | null>(null);

export function MobileMenuProvider({ children }: { children: ReactNode }) {
  const [ouvert, setOuvert] = useState(false);
  return (
    <MobileMenuContext.Provider
      value={{ ouvert, toggle: () => setOuvert((v) => !v), fermer: () => setOuvert(false) }}
    >
      {children}
    </MobileMenuContext.Provider>
  );
}

export function useMobileMenu(): MobileMenuContextValue {
  const ctx = useContext(MobileMenuContext);
  if (!ctx) throw new Error("useMobileMenu doit être utilisé à l'intérieur de MobileMenuProvider.");
  return ctx;
}
