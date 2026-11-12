import { publishedContent } from "../cms";
import { ContentList } from "../content-list";

export default async function Coaches() {
  const items = await publishedContent("coach");
  return <section className="shell service-section">
    <h1>기사소개</h1>
    <ContentList items={items ?? []} empty="기사소개가 준비 중입니다." />
  </section>;
}

