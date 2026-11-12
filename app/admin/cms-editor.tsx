"use client";

import { useActionState, useEffect, useState } from "react";
import { assetUrl, priceGroups, type Asset, type Content, type ContentKind } from "../cms-model";
import { inquiryStatuses, money } from "../commerce";
import { manageContent, manageInquiry, removeImage, uploadImage } from "./cms-actions";

export type Inquiry = { id: string; game: string; contact: string; message: string; status: string; created_at: string };

function DeleteButton({ label = "삭제", pending }: { label?: string; pending: boolean }) {
  return <button className="nav-button" name="intent" value="delete" formNoValidate disabled={pending}
    onClick={(event) => { if (!window.confirm("이 항목을 삭제하시겠어요?")) event.preventDefault(); }}>{label}</button>;
}

export function ContentEditor({ kind, item, assets }: { kind: ContentKind; item?: Content; assets: Asset[] }) {
  const [message, action, pending] = useActionState(manageContent, "");
  const [title, setTitle] = useState(item?.title ?? "");
  const [body, setBody] = useState(item?.body ?? "");
  const [amount, setAmount] = useState(item?.amount?.toString() ?? "");
  const [image, setImage] = useState(item?.image_id ?? "");
  const [preview, setPreview] = useState(false);
  const pricing = kind === "valorant" || kind === "overwatch-2";
  const imagesAllowed = ["home", "notice", "coach", "review", "status"].includes(kind);

  return <form className="service-card consult-fields cms-editor" action={action}>
    <h3>{item ? item.title : "새 항목"}</h3>
    <input type="hidden" name="id" value={item?.id ?? ""} />
    <input type="hidden" name="kind" value={kind} />
    <label>{pricing ? "티어명" : kind === "settings" ? "사이트 제목" : "제목"}
      <input name="title" required maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} />
    </label>
    {pricing ? <>
      <label>서비스 유형<select name="group_key" defaultValue={item?.group_key}>
        {priceGroups[kind].map(([id, name]) => <option key={id} value={id}>{name}</option>)}
      </select></label>
      <label>가격 (원, 비워두면 상담 문의)<input name="amount" type="number" min={0} max={100000000} step={1} value={amount} onChange={(e) => setAmount(e.target.value)} /></label>
    </> : <label>{kind === "home" ? "메인 부제" : kind === "settings" ? "사이트 설명" : "내용"}
      <textarea name="body" rows={4} maxLength={8000} value={body} onChange={(e) => setBody(e.target.value)} />
    </label>}
    {kind === "review" && <>
      <label>게임<select name="game" defaultValue={item?.game ?? "valorant"}><option value="valorant">발로란트</option><option value="overwatch-2">오버워치 2</option></select></label>
      <label>작성 구분<select name="source" defaultValue={item?.source ?? "customer"}><option value="customer">실제 고객 후기</option><option value="operator">운영자 작성</option></select></label>
    </>}
    {imagesAllowed && <>
      <label>이미지<select name="image_id" value={image} onChange={(e) => setImage(e.target.value)}>
        <option value="">이미지 없음</option>
        {assets.filter((asset) => !asset.deleting).map((asset) => <option key={asset.id} value={asset.id}>{asset.name}</option>)}
      </select></label>
      <label>이미지 대체 텍스트<input name="image_alt" maxLength={200} defaultValue={item?.image_alt} /></label>
    </>}
    <label>노출 순서 (작은 숫자부터)<input name="sort_order" type="number" required min={0} max={999999} defaultValue={item?.sort_order ?? 10} /></label>
    <label className="admin-check"><input name="published" type="checkbox" defaultChecked={item?.published ?? false} /> 공개</label>
    <div className="flex flex-wrap gap-2">
      <button className="nav-button" disabled={pending}>저장</button>
      <button className="nav-button" type="button" aria-expanded={preview} onClick={() => setPreview(!preview)}>미리보기</button>
      {item && <DeleteButton pending={pending} />}
    </div>
    {preview && <div className="cms-preview">
      <h3>{title || "제목"}</h3>
      {image && <img src={assetUrl(image) + "?preview=1"} alt="" />}
      {pricing ? <p className="text-brand">{amount ? money(Number(amount)) : "상담 문의"}</p> : <p className="whitespace-pre-wrap">{body}</p>}
    </div>}
    {message && <p role="status">{message}</p>}
  </form>;
}

export function ImageUpload() {
  const [message, action, pending] = useActionState(uploadImage, "");
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  useEffect(() => {
    if (!file) { setUrl(""); return; }
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return <form className="service-card consult-fields cms-editor" action={action}>
    <h3>이미지 등록</h3>
    <label>JPG, PNG, WebP · 최대 2MB<input name="image" type="file" required accept="image/jpeg,image/png,image/webp"
      onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></label>
    {url && <img className="cms-image" src={url} alt="선택한 이미지 미리보기" />}
    <button className="nav-button" disabled={pending}>업로드</button>
    {message && <p role="status">{message}</p>}
  </form>;
}

export function ImageCard({ asset }: { asset: Asset }) {
  const [message, action, pending] = useActionState(removeImage, "");
  return <form className="service-card consult-fields cms-editor" action={action}>
    <input type="hidden" name="id" value={asset.id} />
    <h3>{asset.name}</h3>
    {asset.deleting ? <p>삭제 대기 중</p> : <img className="cms-image" src={assetUrl(asset.id) + "?preview=1"} alt={asset.name} />}
    <DeleteButton pending={pending} />
    {message && <p role="status">{message}</p>}
  </form>;
}

export function InquiryEditor({ inquiry }: { inquiry: Inquiry }) {
  const [message, action, pending] = useActionState(manageInquiry, "");
  return <form className="service-card consult-fields cms-editor" action={action}>
    <input type="hidden" name="id" value={inquiry.id} />
    <h3>{inquiry.game === "valorant" ? "발로란트" : "오버워치 2"} 문의</h3>
    <p>{inquiry.contact}</p>
    <time dateTime={inquiry.created_at}>{new Intl.DateTimeFormat("ko-KR", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Seoul" }).format(new Date(inquiry.created_at))}</time>
    <p className="inquiry-message">{inquiry.message}</p>
    <label>상태<select name="status" defaultValue={inquiry.status}>
      {inquiryStatuses.map((status) => <option key={status}>{status}</option>)}
    </select></label>
    <div className="flex gap-2"><button className="nav-button" disabled={pending}>저장</button><DeleteButton pending={pending} /></div>
    {message && <p role="status">{message}</p>}
  </form>;
}
