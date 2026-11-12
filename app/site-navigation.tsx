"use client";

import Link from "next/link";
import { useRef, useState } from "react";

const menu = [
  ["공지사항", "/notices"],
  ["오버워치 가격표", "/games/overwatch-2#services"],
  ["발로란트 가격표", "/games/valorant#services"],
  ["기사소개", "/coaches"],
  ["작업현황", "/status"],
  ["자주묻는질문", "/#faq"],

];

export function SiteNavigation() {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);

  return (
    <div className="header-navigation" onKeyDown={(event) => {
      if (event.key === "Escape" && open) {
        setOpen(false);
        toggle.current?.focus();
      }
    }}>
      <button ref={toggle} className="menu-toggle" type="button" aria-controls="main-navigation"
        aria-expanded={open} aria-label={open ? "메뉴 닫기" : "메뉴 열기"} onClick={() => setOpen(!open)}>
        <span aria-hidden="true">{open ? "×" : "☰"}</span>
      </button>
      <nav id="main-navigation" className="main-navigation" data-open={open} aria-label="주 메뉴">
        <div className="main-navigation-links">
          {menu.map(([label, href]) => (
            <Link key={href} href={href} className="nav-link" onClick={() => setOpen(false)}>
              {label}
            </Link>
          ))}
        </div>
        <Link href="/contact" className="nav-button nav-contact" onClick={() => setOpen(false)}>
          문의하기
        </Link>
      </nav>
    </div>
  );
}


