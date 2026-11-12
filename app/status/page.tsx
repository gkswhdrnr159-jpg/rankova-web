import { publishedContent } from "../cms";
import { ContentList } from "../content-list";

export default async function Status() {
  const items = await publishedContent("status");
  return <section className="shell service-section">
    <h1>작업현황</h1>
    <ContentList items={items ?? []} empty="작업현황 화면이 준비 중입니다." />
  </section>;
}

