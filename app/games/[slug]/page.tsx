import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { configured, table } from "../../database";
import { InquiryForm } from "./inquiry-form";
import { PriceTabs } from "./price-tabs";
import { valorantPrices } from "./valorant-prices";
import { overwatchPrices } from "./overwatch-prices";
import { games } from "../../games";
import { publishedContent } from "../../cms";
import { priceGroups } from "../../cms-model";

type GamePageProps = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return games.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: GamePageProps): Promise<Metadata> {
  const { slug } = await params;
  const game = games.find((entry) => entry.slug === slug);
  return game ? { title: `${game.name} | RANKOVA`, description: game.intro } : {};
}

export default async function GamePage({ params }: GamePageProps) {
  const { slug } = await params;
  const game = games.find((entry) => entry.slug === slug);
  if (!game) notFound();

  const connected = configured();

  async function submitInquiry(_: string, form: FormData) {
    "use server";
    if (!configured()) return "상담 연결 설정이 필요합니다.";
    const contact = String(form.get("contact") ?? "").trim();
    const message = String(form.get("message") ?? "").trim();
    const validContact = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact) || /^\+?[0-9][0-9 -]{7,18}$/.test(contact);
    if (!validContact || contact.length > 120 || !message || message.length > 1000) {
      return "연락처와 문의 내용을 확인해 주세요.";
    }
    try {
      await table("rankova_inquiries", {}, {
        method: "POST",
        body: JSON.stringify({ game: slug, contact, message }),
      });
      return "문의가 접수되었습니다.";
    } catch {
      return "문의를 접수하지 못했습니다. 잠시 후 다시 시도해 주세요.";
    }
  }

  const isValorant = slug === "valorant";
  const published = await publishedContent(game.slug);
  const prices = published === null
    ? (isValorant ? valorantPrices : overwatchPrices)
    : priceGroups[game.slug].map(([id, label]) => ({
        id, label,
        perMatch: isValorant && id === "placement",
        basis: isValorant ? undefined : id === "tier" ? "1티어당" : "1승당",
        rows: published.filter((item) => item.group_key === id).map((item) => [item.title, item.amount] as const),
      }));

  return (
    <section className="shell service-section max-w-4xl" id="services">
      <h1>{isValorant ? "발로란트" : "오버워치"} 가격표</h1>
      <PriceTabs
        tables={prices}
        game={game.label}
        inquiryLabel={isValorant ? "가격 문의" : "상담문의"}
      />
      <div className="mt-6 flex justify-center">
        <Link href="/contact" className="game-button">문의하기</Link>
      </div>
      <InquiryForm connected={connected} submitInquiry={submitInquiry} />
    </section>
  );
}
