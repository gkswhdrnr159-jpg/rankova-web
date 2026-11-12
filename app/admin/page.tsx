import Link from "next/link";
import { logout } from "./actions";
import { requireAdmin } from "./auth";
import { ContentEditor, ImageCard, ImageUpload, InquiryEditor, type Inquiry } from "./cms-editor";
import { contentKinds, sections, type Asset, type Content, type ContentKind } from "../cms-model";
import { supabase, table } from "../database";

export default async function Admin({ searchParams }: { searchParams: Promise<{ section?: string; page?: string }> }) {
  const { token, email } = await requireAdmin();
  const query = await searchParams;
  const [section, title] = sections.find(([key]) => key === query.section) ?? sections[0];
  const page = /^\d{1,5}$/.test(query.page ?? "") ? Math.max(1, Number(query.page)) : 1;
  const pageSize = 24;
  const paging = { limit: String(pageSize + 1), offset: String((page - 1) * pageSize) };
  const auth = { token };
  let content: Content[] = [];
  let assets: Asset[] = [];
  let inquiries: Inquiry[] = [];
  let stats: { order_count: number; completed_count: number } | undefined;
  let failed = false;
  const kind = contentKinds.find((entry) => entry === section) as ContentKind | undefined;
  try {
    if (section === "dashboard") {
      [stats] = await supabase<typeof stats[]>("/rest/v1/rpc/rankova_stats", { method: "POST", body: "{}" }, auth);
    } else if (section === "images") {
      assets = await table<Asset[]>("rankova_assets", { ...paging, order: "name.asc,id.asc" }, undefined, auth);
    } else if (section === "inquiries") {
      inquiries = await table<Inquiry[]>("rankova_inquiries", { ...paging, order: "created_at.desc,id.desc" }, undefined, auth);
    } else if (kind) {
      [content, assets] = await Promise.all([
        table<Content[]>("rankova_content", { ...paging, kind: "eq." + kind, order: "sort_order.asc,id.asc" }, undefined, auth),
        ["home", "notice", "coach", "review", "status"].includes(kind)
          ? table<Asset[]>("rankova_assets", { order: "name.asc,id.asc", deleting: "eq.false" }, undefined, auth)
          : Promise.resolve([]),
      ]);
    }
  } catch { failed = true; }
  const hasMore = Math.max(content.length, inquiries.length, section === "images" ? assets.length : 0) > pageSize;

  return <div className="shell service-section cms-layout">
    <aside className="cms-sidebar">
      <p className="text-brand font-semibold">RANKOVA 관리</p>
      <nav aria-label="관리자 메뉴">
        {sections.map(([key, label]) => <Link key={key} href={key === "dashboard" ? "/admin" : "/admin?section=" + key}
          aria-current={section === key ? "page" : undefined}>{label}</Link>)}
      </nav>
    </aside>
    <div className="cms-main">
      <div className="cms-toolbar"><span>{email}</span><form action={logout}><button className="nav-button">로그아웃</button></form></div>
      <h1>{title}</h1>
      {failed ? <p role="alert" className="section-copy">관리 데이터를 불러오지 못했습니다. Supabase 연결과 CMS 마이그레이션을 확인하세요.</p> : <>
        {section === "dashboard" && <>
          <p className="section-copy">전체 주문 {stats?.order_count ?? 0}건 · 완료 {stats?.completed_count ?? 0}건</p>
          <Link className="nav-button mt-4" href="/admin/legacy">기존 주문·상품 관리</Link>
        </>}
        {section === "images" && <div className="cms-editors">
          <ImageUpload />
          {assets.slice(0, pageSize).map((asset) => <ImageCard key={asset.id} asset={asset} />)}
        </div>}
        {section === "inquiries" && <div className="cms-editors">
          {inquiries.length === 0 && <p>등록된 문의가 없습니다.</p>}
          {inquiries.slice(0, pageSize).map((entry) => <InquiryEditor key={entry.id} inquiry={entry} />)}
        </div>}
        {kind && <div className="cms-editors">
          <ContentEditor key={kind + "-new"} kind={kind} assets={assets} />
          {content.slice(0, pageSize).map((item) => <ContentEditor key={item.id} kind={kind} item={item} assets={assets} />)}
        </div>}
        {(page > 1 || hasMore) && <nav className="detail-actions" aria-label="관리 목록 페이지">
          {page > 1 && <Link className="nav-button" href={`/admin?section=${section}&page=${page - 1}`}>이전</Link>}
          {hasMore && <Link className="nav-button" href={`/admin?section=${section}&page=${page + 1}`}>다음</Link>}
        </nav>}
      </>}
    </div>
  </div>;
}

