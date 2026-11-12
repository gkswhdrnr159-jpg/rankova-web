import "server-only";
import { configured, table } from "./database";
import type { Content, ContentKind } from "./cms-model";

export async function publishedContent(kind: ContentKind): Promise<Content[] | null> {
  if (!configured()) return null;
  try {
    return await table<Content[]>("rankova_content", {
      kind: "eq." + kind, published: "eq.true", order: "sort_order.asc,id.asc",
    }, undefined, {});
  } catch {
    // Use bundled content only for a locally unconfigured project.
    return [];
  }
}
