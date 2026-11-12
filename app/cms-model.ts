export const sections = [
  ["dashboard", "대시보드"], ["home", "메인페이지 관리"], ["notice", "공지사항 관리"],
  ["valorant", "발로란트 가격표 관리"], ["overwatch-2", "오버워치 가격표 관리"],
  ["images", "이미지 관리"], ["coach", "기사소개 관리"], ["review", "후기 관리"],
  ["status", "작업현황 관리"], ["faq", "FAQ 관리"], ["inquiries", "고객 문의 관리"],
  ["settings", "사이트 설정"],
] as const;

export const contentKinds = ["home", "notice", "valorant", "overwatch-2", "coach", "review", "status", "faq", "settings"] as const;
export type ContentKind = typeof contentKinds[number];
export type Content = {
  id: string;
  kind: ContentKind;
  title: string;
  body: string;
  published: boolean;
  sort_order: number;
  image_id: string | null;
  image_alt: string;
  group_key: string;
  game: string;
  source: string;
  amount: number | null;
};

export type Asset = { id: string; name: string; path: string; mime: string; size: number; deleting: boolean };
export const uuidPattern = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
export const assetUrl = (id: string) => "/media/" + id;
export const priceGroups = {
  valorant: [["win", "승당제"], ["duo", "듀오제"], ["tier", "티어제"], ["placement", "배치고사"]],
  "overwatch-2": [["tier", "티어제"], ["win", "승수제"], ["duo", "듀오제"]],
} as const;
