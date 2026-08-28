"use client";

import { useMobileMenu } from "./MobileMenuProvider";

export default function MobileMenuButton() {
  const { toggle } = useMobileMenu();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Ouvrir le menu"
      className="md:hidden shrink-0 p-2 -ml-1 rounded-md text-muted hover:bg-background transition-colors"
    >
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  );
}
