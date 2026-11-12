"use server";

import { createHash, randomBytes } from "node:crypto";
import { configured, table } from "./database";
import { money, quote, type Product } from "./commerce";

export type GuestState = { message?: string; number?: string; code?: string; order?: {
  game: string; product_name: string; tier: string; amount: number; status: string; created_at: string;
} };

const field = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
const hash = (code: string) => createHash("sha256").update(code).digest("hex");
const validContact = (contact: string) => contact.length <= 120 && (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact) || /^\+?[0-9][0-9 -]{7,18}$/.test(contact));
const unavailable = { message: "현재 접수 시스템을 사용할 수 없습니다. 잠시 후 다시 시도해 주세요." };

const guestOrdersEnabled = false;

export async function placeOrder(_: GuestState, form: FormData): Promise<GuestState> {
  if (!guestOrdersEnabled || !configured()) return unavailable;
  const id = field(form, "product");
  const tier = field(form, "tier");
  const contact = field(form, "contact");
  const shownAmount = field(form, "amount");
  if (!validContact(contact)) return { message: "연락 가능한 이메일 또는 전화번호를 입력하세요." };
  if (!/^[a-z0-9-]{1,64}$/.test(id)) return { message: "서비스를 선택하세요." };
  try {
    const [product] = await table<Product[]>("rankova_products", { id: "eq." + id, active: "eq.true" });
    const amount = product ? quote(product, tier) : null;
    if (amount === null || String(amount) !== shownAmount) return { message: "서비스 또는 요금이 변경되었습니다. 새로고침 후 다시 확인하세요." };
    const number = "RV-" + randomBytes(10).toString("hex").toUpperCase();
    const code = randomBytes(18).toString("base64url");
    await table("rankova_orders", {}, { method: "POST", body: JSON.stringify({
      number, lookup_hash: hash(code), game: product.game, product_id: product.id,
      product_name: product.name, tier, amount, contact,
    }) });
    return { number, code };
  } catch { return unavailable; }
}

export async function lookupOrder(_: GuestState, form: FormData): Promise<GuestState> {
  if (!guestOrdersEnabled || !configured()) return unavailable;
  const number = field(form, "number").toUpperCase();
  const code = field(form, "code");
  const mismatch = { message: "주문번호와 조회 코드를 확인해 주세요." };
  if (!/^RV-[A-F0-9]{20}$/.test(number) || !/^[A-Za-z0-9_-]{24}$/.test(code)) return mismatch;
  try {
    const [order] = await table<NonNullable<GuestState["order"]>[]>("rankova_orders", {
      number: "eq." + number, lookup_hash: "eq." + hash(code),
      select: "game,product_name,tier,amount,status,created_at", limit: "1",
    });
    return order ? { order, number } : mismatch;
  } catch { return unavailable; }
}

export async function sendInquiry(_: GuestState, form: FormData): Promise<GuestState> {
  if (!configured()) return { message: "문의하기를 이용하려면 상담 연결 설정이 필요합니다." };
  const contact = field(form, "contact");
  const notes = field(form, "message");
  const options = field(form, "options");
  const game = field(form, "game");
  const id = field(form, "product");
  const tier = field(form, "tier");
  if (!validContact(contact) || notes.length > 500 || options.length > 200 ||
      !["valorant", "overwatch-2"].includes(game) || !/^[a-z0-9-]{1,64}$/.test(id)) {
    return { message: "연락처와 서비스 선택 및 입력 내용을 확인하세요." };
  }
  try {
    const [product] = await table<Product[]>("rankova_products", { id: "eq." + id, game: "eq." + game, active: "eq.true" });
    const amount = product ? quote(product, tier) : null;
    if (amount === null || String(amount) !== field(form, "amount")) {
      return { message: "서비스 또는 요금이 변경되었습니다. 새로고침 후 다시 확인하세요." };
    }
    const message = [
      `게임: ${game === "valorant" ? "발로란트" : "오버워치 2"}`,
      `서비스: ${product.name}`,
      `현재 티어: ${tier}`,
      `추가 옵션: ${options || "기본 구성"}`,
      `예상 금액: ${money(amount)}`,
      notes && `문의 내용: ${notes}`,
    ].filter(Boolean).join("\n");
    await table("rankova_inquiries", {}, { method: "POST", body: JSON.stringify({ game, contact, message }) });
    return { message: "문의가 접수되었습니다." };
  } catch { return unavailable; }
}
