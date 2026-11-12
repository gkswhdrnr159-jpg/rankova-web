import Image from "next/image";
import Link from "next/link";
import { availableArtwork } from "./artwork";
import { games } from "./games";
import { publishedContent } from "./cms";
import { assetUrl } from "./cms-model";

export default async function Home() {
  const [home, faq, reviews] = await Promise.all([
    publishedContent("home"), publishedContent("faq"), publishedContent("review"),
  ]);
  const hero = home?.[0];
  const artwork = hero?.image_id ? assetUrl(hero.image_id) : availableArtwork("rankova-home-hero.webp");
  const title = hero?.title ?? (home === null ? "발로란트 | 오버워치 대리는 RANKOVA" : "RANKOVA");
  const subtitle = hero?.body ?? (home === null ? "발로란트 | 오버워치 희망하시는 게임을 선택해주세요" : "");

  return (
    <>
      <section className="hero">
        <div className="hero-art" aria-hidden="true">
          {artwork
            ? <div className="hero-banner"><Image src={artwork} alt="" fill unoptimized={Boolean(hero?.image_id)} sizes="(max-width: 640px) 100vw, 66vw" loading="eager" /></div>
            : <><i /><i /><i /></>}
        </div>
        <div className="shell hero-inner">
          <p className="eyebrow"><span /> 경쟁전 서비스 플랫폼</p>
          <h1 className="home-title">{title.endsWith("RANKOVA") ? <>{title.slice(0, -7)}<em>RANKOVA</em></> : title}</h1>
          {subtitle && <p className="hero-description">{subtitle}</p>}
          <Link className="primary-button" href="#games">게임 선택하기 <span aria-hidden="true">↓</span></Link>
        </div>
      </section>
      <section className="shell games-section" id="games" aria-labelledby="games-title">
        <p className="eyebrow"><span /> 지원 게임</p>
        <h2 id="games-title">게임을 선택하세요</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {games.map((game) => (
            <Link className={`game-card ${game.color}`} href={`/games/${game.slug}`} key={game.slug}>
              <span className="game-mark" aria-hidden="true">{game.mark}</span>
              <div className="card-copy">
                <span className="genre">{game.genre}</span>
                <h3>{game.name}</h3>
                <p>{game.label} 서비스 보기</p>
              </div>
              <span className="card-arrow" aria-hidden="true">↗</span>
            </Link>
          ))}
        </div>
      </section>
      <section className="shell faq-section" id="faq" aria-labelledby="faq-title">
        <h2 id="faq-title">이용 안내</h2>
        {faq === null ? <>
          <details><summary>어떤 게임을 지원하나요?</summary><p>발로란트와 오버워치 2를 지원합니다. 위에서 게임을 선택하면 각 게임의 서비스 페이지로 이동합니다.</p></details>
          <details><summary>상품과 가격은 어디서 확인할 수 있나요?</summary><p>게임별 가격표에서 서비스 유형과 티어별 가격을 확인할 수 있습니다.</p></details>
        </> : faq.map((item) => <details key={item.id}><summary>{item.title}</summary><p className="whitespace-pre-wrap">{item.body}</p></details>)}
        {!!reviews?.length && <Link href="/reviews" className="nav-button mt-5">후기 보기</Link>}
      </section>
    </>
  );
}


