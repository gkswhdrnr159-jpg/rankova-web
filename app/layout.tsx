import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteNavigation } from "./site-navigation";
import { publishedContent } from "./cms";
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "@fontsource-variable/space-grotesk";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const setting = (await publishedContent("settings"))?.[0];
  return {
    title: setting?.title ?? "RANKOVA | 경쟁전 서비스 플랫폼",
    description: setting?.body ?? "발로란트와 오버워치 2를 위한 통합 경쟁전 서비스 플랫폼",
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <a className="skip" href="#main">본문으로 이동</a>
        <header className="site-header">
          <div className="shell header-inner">
            <Link href="/" className="wordmark" aria-label="RANKOVA 홈">
              <Image className="brand-symbol" src="/images/rv-symbol-gold.svg" alt="" width={28} height={28} unoptimized /> RANKOVA
            </Link>
            <SiteNavigation />
          </div>
        </header>
        <main id="main">{children}</main>
        <footer className="site-footer">
          <div className="shell flex flex-wrap items-center justify-between gap-4">
            <Link className="wordmark" href="/">RANKOVA</Link>
            <small>© RANKOVA</small>
          </div>
        </footer>
      </body>
    </html>
  );
}







