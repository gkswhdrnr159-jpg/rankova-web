import "server-only";

import { games } from "./games";
import type { Product } from "./commerce";

export const configured = () => Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY && process.env.SUPABASE_PUBLISHABLE_KEY);

export async function supabaseResponse(path: string, init: RequestInit = {}, auth?: { token?: string }) {
  if (!configured()) throw new Error("Supabase configuration is missing");
  const key = (auth ? process.env.SUPABASE_PUBLISHABLE_KEY : process.env.SUPABASE_SECRET_KEY)!;
  const headers = new Headers(init.headers);
  headers.set("apikey", key);
  if (auth?.token) headers.set("Authorization", "Bearer " + auth.token);
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const response = await fetch(process.env.SUPABASE_URL!.replace(/\/$/, "") + path, {
    ...init, headers, cache: "no-store", signal: AbortSignal.timeout(10000),
  });
  return response;
}

export async function supabase<T>(path: string, init?: RequestInit, auth?: { token?: string }): Promise<T> {
  const response = await supabaseResponse(path, init, auth);
  if (!response.ok) throw new Error("Supabase request failed (" + response.status + ")");
  const body = await response.text();
  return body ? JSON.parse(body) as T : undefined as T;
}

export function table<T>(name: string, params: Record<string, string> = {}, init?: RequestInit, auth?: { token?: string }) {
  return supabase<T>("/rest/v1/" + name + "?" + new URLSearchParams(params), init, auth);
}

export async function productsFor(game: Product["game"]) {
  if (configured()) return table<Product[]>("rankova_products", { game: "eq." + game, active: "eq.true", order: "id" });
  return games.find((entry) => entry.slug === game)!.services.map((service, index): Product => ({
    id: game + "-" + service.id, game, name: service.name, description: service.description,
    base_price: index ? 30000 : 15000, tier_step: index ? 2000 : 1000, active: true,
  }));
}



