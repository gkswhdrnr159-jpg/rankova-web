import { publishedContent } from "../cms";
import { ContentList } from "../content-list";

export default async function Reviews() {
  const items = await publishedContent("review");
  return <section className="shell service-section">
    <h1>후기</h1>
    <ContentList items={items ?? []} empty="공개된 후기가 없습니다." />
  </section>;
}
