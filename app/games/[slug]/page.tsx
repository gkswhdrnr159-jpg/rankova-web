import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { availableArtwork } from "../../artwork";
import { configured, productsFor, table } from "../../database";
import { InquiryForm } from "./inquiry-form";
import { ValorantPriceTabs } from "./valorant-price-tabs";
import { money } from "../../commerce";
import { games } from "../../games";

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

  if (slug === "valorant") {
    return (
      <section className="shell service-section max-w-4xl" id="services">
        <h1>발로란트 가격표</h1>
        <ValorantPriceTabs />
        <Link href="/contact" className="game-button mt-6">문의하기</Link>
        <InquiryForm connected={connected} submitInquiry={submitInquiry} />
      </section>
    );
  }

  const products = await productsFor(game.slug).catch(() => null);
  const artwork = availableArtwork(`${game.slug}-service-hero.webp`);

  return (
    <div className={`game-page ${game.color}`}>
      <section className="game-detail">
        <div className="detail-art" aria-hidden="true">
          {artwork
            ? <Image src={artwork} alt="" fill sizes="(max-width: 640px) 100vw, 62vw" loading="eager" />
            : <span>{game.mark}</span>}
        </div>
        <div className="shell detail-content">
          <Link className="back-link" href="/#games">← 게임 선택</Link>
          <p className="eyebrow"><span /> {game.genre}</p>
          <h1>{game.name}</h1>
          <p className="hero-description">{game.intro}</p>
          <div className="detail-actions">
            <a className="nav-button" href="#services">서비스 가격표 보기</a>
          </div>
        </div>
      </section>
      <section className="shell service-section" id="services" aria-labelledby="services-title">
        <h2 id="services-title">서비스 가격표</h2>
        <p className="section-copy">표시된 금액은 확정 전 참고 가격입니다.</p>
        {products?.length === 0 && <p className="section-copy">현재 표시할 등록 상품이 없습니다.</p>}
        <div className="grid gap-4 md:grid-cols-2">
          {products?.map((service) => (
            <article className="service-card" key={service.id}>
              
              <h3>{service.name}</h3>
              <p className="section-copy">{service.description}</p>
              <p className="service-price"><span>{connected ? "참고 기본 가격" : "테스트 기본 가격"}</span> {money(service.base_price)}</p>
            </article>
          ))}
        </div>
        {products === null && <p className="section-copy">상품을 불러오지 못했습니다. 잠시 후 새로고침해 주세요.</p>}
        <InquiryForm connected={connected} submitInquiry={submitInquiry} />
      </section>
    </div>
  );
}







