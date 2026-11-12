import { assetUrl, type Content } from "./cms-model";

export function ContentList({ items, empty }: { items: Content[]; empty: string }) {
  if (!items.length) return <p className="section-copy">{empty}</p>;
  return <div className="grid gap-4 md:grid-cols-2">
    {items.map((item) => <article key={item.id} className="service-card">
      {item.source && <p className="genre">
        {item.source === "customer" ? "실제 고객 후기" : "운영자 작성"} · {item.game === "valorant" ? "발로란트" : "오버워치 2"}
      </p>}
      <h3>{item.title}</h3>
      {item.image_id && <img className="mt-3 max-h-72 w-full rounded-md object-contain" src={assetUrl(item.image_id)} alt={item.image_alt} />}
      <p className="section-copy whitespace-pre-wrap wrap-anywhere">{item.body}</p>
    </article>)}
  </div>;
}
