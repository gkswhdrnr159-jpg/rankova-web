import Link from "next/link";
import { inquiryStatuses, money, orderStatuses, type Product } from "../../commerce";
import { supabase, table } from "../../database";
import { logout, saveProduct, updateStatus } from "../actions";
import { requireAdmin } from "../auth";

type Order = { number: string; game: string; product_name: string; tier: string; amount: number; contact: string; status: string; created_at: string };
type Inquiry = { id: string; game: string; contact: string; message: string; status: string; created_at: string };
type Stats = { order_count: number; completed_count: number; completed_quote: number };
const pageSize = 25;
const timestamp = (value: string) => new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Seoul" }).format(new Date(value));

function StatusForm({ kind, id, status, options }: { kind: string; id: string; status: string; options: readonly string[] }) {
  return <form className="consult-fields" action={updateStatus}>
    <input type="hidden" name="kind" value={kind} />
    <input type="hidden" name="id" value={id} />
    <label>상태<select name="status" defaultValue={status}>{options.map((option) => <option key={option}>{option}</option>)}</select></label>
    <button className="nav-button">상태 저장</button>
  </form>;
}

function ProductForm({ product }: { product?: Product }) {
  return <form className="service-card consult-fields" action={saveProduct}>
    <h3>{product?.name ?? "새 상품"}</h3>
    <input type="hidden" name="existing" value={product ? "yes" : "no"} />
    {product ? <>
      <input type="hidden" name="id" value={product.id} />
      <input type="hidden" name="game" value={product.game} />
      <p>{product.game} · {product.id}</p>
    </> : <>
      <label>상품 코드<input name="id" pattern="[a-z0-9\-]{1,64}" required /></label>
      <label>게임<select name="game"><option value="valorant">발로란트</option><option value="overwatch-2">오버워치 2</option></select></label>
    </>}
    <label>상품명<input name="name" required maxLength={80} defaultValue={product?.name} /></label>
    <label>설명<textarea name="description" required maxLength={500} defaultValue={product?.description} /></label>
    <label>기본 요금 (원)<input name="base_price" type="number" required min={0} max={9999999} defaultValue={product?.base_price} /></label>
    <label>티어당 추가 요금 (원)<input name="tier_step" type="number" required min={0} max={9999999} defaultValue={product?.tier_step} /></label>
    <label className="admin-check"><input name="active" type="checkbox" defaultChecked={product?.active ?? true} /> 주문 접수 활성화</label>
    <button className="nav-button">상품 저장</button>
  </form>;
}

export default async function Admin({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const auth = await requireAdmin();
  const rawPage = Number((await searchParams).page);
  const page = Number.isSafeInteger(rawPage) && rawPage > 0 && rawPage <= 100000 ? rawPage : 1;
  const pagination = { limit: String(pageSize + 1), offset: String((page - 1) * pageSize) };
  const [orders, inquiries, products, [stats]] = await Promise.all([
    table<Order[]>("rankova_orders", { ...pagination, select: "number,game,product_name,tier,amount,contact,status,created_at", order: "created_at.desc,number.desc" }, undefined, auth),
    table<Inquiry[]>("rankova_inquiries", { ...pagination, order: "created_at.desc,id.desc" }, undefined, auth),
    table<Product[]>("rankova_products", { order: "game,id" }, undefined, auth),
    supabase<Stats[]>("/rest/v1/rpc/rankova_stats", { method: "POST", body: "{}" }, auth),
  ]);

  return <div className="shell service-section admin-panel">
    <div className="detail-actions"><h1>관리자 대시보드</h1><form action={logout}><button className="nav-button">로그아웃</button></form></div>
    <section>
      <h2>주문 및 매출 통계</h2>
      <p>전체 주문 {stats.order_count}건 · 완료 {stats.completed_count}건</p>
      <p>완료 테스트 주문 견적 합계 {money(stats.completed_quote)}</p>
      <p className="section-copy">결제 연동 전이므로 실제 매출은 집계하지 않습니다.</p>
    </section>
    <section>
      <h2>주문 관리</h2>
      {!orders.length && <p>표시할 주문이 없습니다.</p>}
      <div className="grid gap-4 md:grid-cols-2">{orders.slice(0, pageSize).map((order) =>
        <article className="service-card" key={order.number}>
          <h3>{order.product_name}</h3><p>{order.number} · {timestamp(order.created_at)}</p>
          <p>{order.game} · {order.tier} · {money(order.amount)}</p><p>{order.contact}</p>
          <StatusForm kind="order" id={order.number} status={order.status} options={orderStatuses} />
        </article>
      )}</div>
    </section>
    <section>
      <h2>상담 관리</h2>
      {!inquiries.length && <p>표시할 문의가 없습니다.</p>}
      <div className="grid gap-4 md:grid-cols-2">{inquiries.slice(0, pageSize).map((entry) =>
        <article className="service-card" key={entry.id}>
          <p>{entry.game} · {timestamp(entry.created_at)}</p><p>{entry.contact}</p>
          <p className="inquiry-message">{entry.message}</p>
          <StatusForm kind="inquiry" id={entry.id} status={entry.status} options={inquiryStatuses} />
        </article>
      )}</div>
    </section>
    <nav className="detail-actions" aria-label="주문 및 상담 목록 페이지">
      {page > 1 && <Link className="nav-button" href={`/admin/legacy?page=${page - 1}`}>이전</Link>}
      {(orders.length > pageSize || inquiries.length > pageSize) && page < 100000 && <Link className="nav-button" href={`/admin/legacy?page=${page + 1}`}>다음</Link>}
    </nav>
    <section><h2>상품 및 가격 관리</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {products.map((product) => <ProductForm key={product.id} product={product} />)}
        <ProductForm />
      </div>
    </section>
  </div>;
}
