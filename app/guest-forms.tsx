"use client";

import { useActionState, useState } from "react";
import { lookupOrder, placeOrder, sendInquiry } from "./guest-actions";
import { money, quote, tiers, type Product } from "./commerce";

const date = (value: string) => new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Seoul" }).format(new Date(value));

export function OrderForm({ products, connected }: { products: Product[]; connected: boolean }) {
  const [id, setId] = useState(products[0]?.id);
  const product = products.find((item) => item.id === id);
  const [tier, setTier] = useState(product ? tiers[product.game][0] : "");
  const [result, submit, pending] = useActionState(placeOrder, {});
  if (result.code) return <div className="service-card" role="status">
    <h3>테스트 주문이 접수되었습니다</h3>
    <p>주문번호 <strong>{result.number}</strong></p>
    <p>조회 코드 <strong>{result.code}</strong></p>
    <p>조회 코드는 이 화면에서만 표시됩니다. 주문번호와 함께 보관하세요.</p>
    <a className="back-link" href="/orders">주문 상태 조회 ↗</a>
  </div>;
  if (!product) return <p>현재 접수 가능한 서비스가 없습니다.</p>;

  const amount = quote(product, tier);
  return <form className="consult-fields" action={submit}>
    {!connected && <p className="section-copy">예시 가격입니다. 접수는 주문 시스템 연결 후 가능합니다.</p>}
    <label>서비스<select name="product" value={id} onChange={(event) => setId(event.target.value)}>
      {products.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}
    </select></label>
    <label>현재 티어<select name="tier" value={tier} onChange={(event) => setTier(event.target.value)}>
      {tiers[product.game].map((entry) => <option key={entry}>{entry}</option>)}
    </select></label>
    <input type="hidden" name="amount" value={amount ?? ""} />
    <output className="service-price">예상 견적 {amount === null ? "—" : money(amount)}</output>
    <label>연락처 (이메일 또는 전화번호)<input name="contact" required maxLength={120} autoComplete="off" /></label>
    <p className="section-copy">연락처는 주문 처리에 사용합니다. 테스트 주문에는 실제 결제가 없습니다.</p>
    <button className="game-button" disabled={!connected || pending}>테스트 주문 접수</button>
    {result.message && <p role="status">{result.message}</p>}
  </form>;
}

export function LookupForm() {
  const [result, submit, pending] = useActionState(lookupOrder, {});
  return <>
    <form className="consult-fields" action={submit}>
      <label>주문번호<input name="number" required maxLength={23} autoComplete="off" /></label>
      <label>조회 코드<input name="code" type="password" required maxLength={24} autoComplete="off" /></label>
      <button className="nav-button" disabled={pending}>조회하기</button>
    </form>
    {result.message && <p role="status">{result.message}</p>}
    {result.order && <div className="service-card" role="status">
      <h3>{result.order.status}</h3>
      <p>{result.number} · {result.order.game === "valorant" ? "발로란트" : "오버워치 2"}</p>
      <p>{result.order.product_name} · {result.order.tier} · {money(result.order.amount)}</p>
      <p>접수 일시 {date(result.order.created_at)}</p>
    </div>}
  </>;
}

export function InquiryForm({ products, connected }: { products: Product[]; connected: boolean }) {
  const [id, setId] = useState(products[0]?.id);
  const product = products.find((entry) => entry.id === id);
  const [tier, setTier] = useState(product ? tiers[product.game][0] : "");
  const [result, submit, pending] = useActionState(sendInquiry, {});

  if (!product) return <p>현재 문의할 수 있는 서비스가 없습니다.</p>;

  const amount = quote(product, tier);
  return <form className="consult-fields" action={submit}>
    <input type="hidden" name="game" value={product.game} />
    <input type="hidden" name="amount" value={amount ?? ""} />
    <label>서비스<select name="product" value={id} onChange={(event) => setId(event.target.value)}>
      {products.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}
    </select></label>
    <label>현재 티어<select name="tier" value={tier} onChange={(event) => setTier(event.target.value)}>
      {tiers[product.game].map((entry) => <option key={entry}>{entry}</option>)}
    </select></label>
    <label>추가 옵션 요청 (선택)<input name="options" maxLength={200} /></label>
    <output className="service-price">{connected ? "예상 금액" : "예시 예상 금액"} {amount === null ? "—" : money(amount)}</output>
    {connected ? <>
      <label>답변 받을 이메일 또는 전화번호<input name="contact" maxLength={120} required /></label>
      <label>문의 내용 (선택)<textarea name="message" maxLength={500} rows={4} /></label>
    </> : <p className="section-copy">문의하기를 이용하려면 상담 연결 설정이 필요합니다.</p>}
    <button className="game-button" disabled={!connected || pending}>문의하기</button>
    {result.message && <p role="status">{result.message}</p>}
  </form>;
}
