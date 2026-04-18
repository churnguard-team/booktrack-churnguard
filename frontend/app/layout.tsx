import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BookTrack ChurnGuard",
  description: "Plateforme éditoriale intelligente avec prédiction du churn",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={geist.variable}>
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
