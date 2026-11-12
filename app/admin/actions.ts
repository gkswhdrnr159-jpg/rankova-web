"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { configured, supabase, table } from "../database";
import { orderStatuses, inquiryStatuses, tiers } from "../commerce";
import { isAdmin, requireAdmin, sessionCookie } from "./auth";

const read = (form: FormData, key: string) => String(form.get(key) ?? "").trim();

export async function login(_: { message?: string }, form: FormData) {
  if (!configured()) return { message: "관리자 인증 시스템 연결이 필요합니다." };
  const email = read(form, "email");
  const password = String(form.get("password") ?? "");
  if (!email || email.length > 254 || !password || password.length > 256) return { message: "로그인 정보를 확인하세요." };
  try {
    const session = await supabase<{ access_token: string; expires_in: number }>("/auth/v1/token?grant_type=password", {
      method: "POST", body: JSON.stringify({ email, password }),
    }, {});
    if (!await isAdmin(session.access_token)) return { message: "관리자 로그인 정보를 확인하세요." };
    (await cookies()).set(sessionCookie, session.access_token, {
      httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict",
      path: "/", maxAge: Math.min(session.expires_in, 3600),
    });
  } catch { return { message: "관리자 로그인 정보를 확인하세요." }; }
  redirect("/admin");
}

export async function logout() {
  (await cookies()).delete(sessionCookie);
  redirect("/admin/login");
}

export async function updateStatus(form: FormData) {
  await requireAdmin();
  const kind = read(form, "kind");
  const id = read(form, "id");
  const status = read(form, "status");
  if (kind === "order" && /^RV-[A-F0-9]{20}$/.test(id) && orderStatuses.some((entry) => entry === status)) {
    await table("rankova_orders", { number: "eq." + id }, { method: "PATCH", body: JSON.stringify({ status }) });
  } else if (kind === "inquiry" && /^[a-f0-9-]{36}$/.test(id) && inquiryStatuses.some((entry) => entry === status)) {
    await table("rankova_inquiries", { id: "eq." + id }, { method: "PATCH", body: JSON.stringify({ status }) });
  }
  revalidatePath("/admin");
}

export async function saveProduct(form: FormData) {
  await requireAdmin();
  const id = read(form, "id");
  const game = read(form, "game");
  const name = read(form, "name");
  const description = read(form, "description");
  const base = read(form, "base_price");
  const step = read(form, "tier_step");
  if (!/^[a-z0-9-]{1,64}$/.test(id) || !Object.hasOwn(tiers, game) || !name || name.length > 80 ||
      !description || description.length > 500 || !/^\d{1,7}$/.test(base) || !/^\d{1,7}$/.test(step)) return;
  const active = form.get("active") === "on";
  const values = { name, description, base_price: Number(base), tier_step: Number(step), active };
  if (form.get("existing") === "yes") {
    await table("rankova_products", { id: "eq." + id, game: "eq." + game }, { method: "PATCH", body: JSON.stringify(values) });
  } else {
    await table("rankova_products", {}, { method: "POST", body: JSON.stringify({ id, game, ...values }) });
  }
  revalidatePath("/admin");
  revalidatePath("/games/" + game);
}

