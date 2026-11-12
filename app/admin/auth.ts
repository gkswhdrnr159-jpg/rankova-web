import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { configured, supabase } from "../database";

export const sessionCookie = "rankova-admin";
type AuthUser = { app_metadata?: { rankova_admin?: boolean }; is_anonymous?: boolean };

export async function isAdmin(token: string) {
  if (!configured() || !token) return false;
  try {
    const user = await supabase<AuthUser>("/auth/v1/user", {}, { token });
    return user.app_metadata?.rankova_admin === true && !user.is_anonymous;
  } catch { return false; }
}

export async function requireAdmin() {
  if (!await isAdmin((await cookies()).get(sessionCookie)?.value ?? "")) redirect("/admin/login");
}

