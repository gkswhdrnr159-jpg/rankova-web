import Link from "next/link";
import { games } from "../games";

export default function Contact() {
  return (
    <section className="shell service-section">
      <h1>문의하기</h1>
      <p className="section-copy">문의할 게임을 선택하세요.</p>
      <div className="detail-actions">
        {games.map(({ slug, label }) => (
          <Link className="nav-button" key={slug} href={`/games/${slug}#consultation`}>{label} 문의하기</Link>
        ))}
      </div>
    </section>
  );
}


