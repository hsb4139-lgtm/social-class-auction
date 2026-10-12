export type ClassRow = { id: string; name: string; join_code: string; practice_coins: number };
export type Student = { id: string; class_id: string; number: number; name: string; is_active: boolean };
export type Item = {
  id: string; class_id: string; name: string; description: string; emoji: string;
  default_quantity: number; min_bid: number; archived: boolean;
};
export type AuctionMode = "practice" | "real";
export type AuctionStatus = "draft" | "open" | "closed" | "revealed";
export type Auction = {
  id: string; class_id: string; title: string; mode: AuctionMode; status: AuctionStatus;
  closes_at: string | null; show_winner_names: boolean; created_at: string;
};
export type Lot = { id: string; auction_id: string; item_id: string; quantity: number; position: number; items: Item };
export type Bid = { id: string; lot_id: string; student_id: string; amount: number; updated_at: string };
export type Winner = { lot_id: string; student_id: string; amount: number; rank: number };

export const STATUS_LABEL: Record<AuctionStatus, string> = {
  draft: "준비",
  open: "입찰 중",
  closed: "마감(결과 비공개)",
  revealed: "결과 공개",
};
export const MODE_LABEL: Record<AuctionMode, string> = { practice: "연습", real: "실전" };
