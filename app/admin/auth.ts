import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { configured, supabase } from "../database";

export const sessionCookie = "rankova-admin";
type AuthUser = { email?: string; app_metadata?: { rankova_admin?: boolean }; is_anonymous?: boolean };

async function getAdmin(token: string) {
  if (!configured() || !token) return null;
  try {
    const user = await supabase<AuthUser>("/auth/v1/user", {}, { token });
    return user.app_metadata?.rankova_admin === true && !user.is_anonymous ? user : null;
  } catch { return null; }
}

export async function isAdmin(token: string) {
  return Boolean(await getAdmin(token));
}

export async function currentAdmin() {
  const token = (await cookies()).get(sessionCookie)?.value ?? "";
  const user = await getAdmin(token);
  return user ? { token, email: user.email ?? "관리자" } : null;
}

export async function requireAdmin() {
  const admin = await currentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

