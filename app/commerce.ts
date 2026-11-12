export const tiers = {
  valorant: ["아이언", "브론즈", "실버", "골드", "플래티넘", "다이아몬드", "초월자", "불멸", "레디언트"],
  "overwatch-2": ["브론즈", "실버", "골드", "플래티넘", "다이아몬드", "마스터", "그랜드마스터", "챔피언"],
};

export const orderStatuses = ["접수", "진행 중", "완료", "취소"] as const;
export const inquiryStatuses = ["접수", "확인 중", "답변 완료"] as const;

export type Product = {
  id: string; game: keyof typeof tiers; name: string; description: string;
  base_price: number; tier_step: number; active: boolean;
};
export const money = (amount: number) => new Intl.NumberFormat("ko-KR").format(amount) + "원";
export const quote = (product: Product, tier: string) => {
  const index = tiers[product.game].indexOf(tier);
  return index < 0 ? null : product.base_price + product.tier_step * index;
};

