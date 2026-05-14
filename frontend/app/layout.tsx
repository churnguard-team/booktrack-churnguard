import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NextAuthProvider from "@/app/components/NextAuthProvider"; // Fournisseur de session Google
import { cookies } from "next/headers";
import { getDictionary } from "@/app/i18n/dictionaries";
import I18nProvider from "@/app/i18n/I18nProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BookTrack",
  description: "Votre bibliothèque personnelle intelligente",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value || "fr";
  const dict = await getDictionary(locale);
  const direction = locale === "ar" ? "rtl" : "ltr";
  return (
    <html
      lang={locale}
      dir={direction}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* NextAuthProvider encapsule toute l'appli pour rendre la session Google accessible */}
        <NextAuthProvider>
          <I18nProvider dictionary={dict} locale={locale}>
            {children}
          </I18nProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
