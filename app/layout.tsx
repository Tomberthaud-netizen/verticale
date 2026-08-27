import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getCouleurPrincipale } from "@/lib/queries";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Verticale — Suivi de chantiers",
  description: "Suivi des chantiers Verticale sous forme de calendriers Gantt",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const couleurPrincipale = await getCouleurPrincipale();

  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      style={{ ["--accent" as string]: couleurPrincipale }}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">{children}</body>
    </html>
  );
}
