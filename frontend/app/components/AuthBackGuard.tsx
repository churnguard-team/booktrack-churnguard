"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

const PROTECTED_PREFIXES = ["/admin", "/user", "/dashboard", "/books", "/onboarding"];

function hasSessionCookie() {
  return document.cookie.split("; ").some((cookie) => cookie.startsWith("user_session="));
}

export default function AuthBackGuard() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
    if (!isProtected) return;

    const enforceSession = () => {
      if (!hasSessionCookie()) {
        localStorage.removeItem("booktrack_auth");
        router.replace("/login");
      }
    };

    enforceSession();
    window.addEventListener("pageshow", enforceSession);
    window.addEventListener("focus", enforceSession);
    document.addEventListener("visibilitychange", enforceSession);

    return () => {
      window.removeEventListener("pageshow", enforceSession);
      window.removeEventListener("focus", enforceSession);
      document.removeEventListener("visibilitychange", enforceSession);
    };
  }, [pathname, router]);

  return null;
}
