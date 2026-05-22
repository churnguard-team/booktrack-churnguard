export type AuthUser = {
  access_token: string;
  role: string;
  nom: string;
  prenom: string;
  user_id: string;
};

export function saveAuth(data: AuthUser) {
  localStorage.setItem("booktrack_auth", JSON.stringify(data));
}

export function getAuth(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("booktrack_auth");
  return raw ? JSON.parse(raw) : null;
}

export function clearAuth() {
  localStorage.removeItem("booktrack_auth");
}

export function getRoleRedirect(role: string): string {
  switch (role) {
    case "SUPER_ADMIN": return "/dashboard/superadmin";
    case "ADMIN":       return "/admin/dashboard";
    case "MODERATOR":   return "/dashboard/moderator";
    case "AUTHOR":      return "/dashboard/author";
    default:            return "/dashboard/user";
  }
}
