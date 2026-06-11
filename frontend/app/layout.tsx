import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NextAuthProvider from "@/app/components/NextAuthProvider"; // Fournisseur de session Google
import { cookies } from "next/headers";
import { getDictionary } from "@/app/i18n/dictionaries";
import I18nProvider from "@/app/i18n/I18nProvider";
import Script from "next/script";
import AuthBackGuard from "@/app/components/AuthBackGuard";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

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
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <Script id="remove-extension-hydration-attrs" strategy="beforeInteractive">
          {`
            (function () {
              function clean() {
                document.querySelectorAll('[bis_skin_checked]').forEach(function (node) {
                  node.removeAttribute('bis_skin_checked');
                });
              }
              clean();
              var observer = new MutationObserver(clean);
              observer.observe(document.documentElement, {
                attributes: true,
                childList: true,
                subtree: true,
                attributeFilter: ['bis_skin_checked']
              });
              window.addEventListener('load', function () {
                clean();
                setTimeout(function () { observer.disconnect(); }, 1000);
              });
            })();
          `}
        </Script>
        {/* NextAuthProvider encapsule toute l'appli pour rendre la session Google accessible */}
        <NextAuthProvider>
          <I18nProvider dictionary={dict} locale={locale}>
            <AuthBackGuard />
            {children}
          </I18nProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
