import type { SupabaseClient } from "@supabase/supabase-js";
import type { Auction, Bid, Lot, Winner } from "@/lib/types";

export type LotResult = {
  lot: Lot;
  bidCount: number;
  bids: number[]; // 금액만 (익명)
  avg: number | null;
  max: number | null;
  min: number | null;
  winners: { name: string; number: number; amount: number; rank: number }[];
};

/** 경매 하나의 물건·입찰·낙찰 정보를 모아 계산 (교사 클라이언트 또는 admin 클라이언트) */
export async function loadAuctionResult(supabase: SupabaseClient, auctionId: string) {
  const { data: auction } = await supabase.from("auctions").select("*").eq("id", auctionId).maybeSingle<Auction>();
  if (!auction) return null;
  const { data: lotsData } = await supabase
    .from("auction_lots")
    .select("*, items(*)")
    .eq("auction_id", auctionId)
    .order("position");
  const lots = (lotsData ?? []) as Lot[];
  const lotIds = lots.map((l) => l.id);
  const [{ data: bidsData }, { data: winData }, { data: studentData }, { count: studentCount }] = await Promise.all([
    lotIds.length ? supabase.from("bids").select("*").in("lot_id", lotIds) : Promise.resolve({ data: [] }),
    lotIds.length ? supabase.from("lot_winners").select("*").in("lot_id", lotIds) : Promise.resolve({ data: [] }),
    supabase.from("students").select("id, name, number").eq("class_id", auction.class_id),
    supabase.from("students").select("id", { count: "exact", head: true }).eq("class_id", auction.class_id).eq("is_active", true),
  ]);
  const bids = (bidsData ?? []) as Bid[];
  const wins = (winData ?? []) as Winner[];
  const studentMap = new Map((studentData ?? []).map((s: { id: string; name: string; number: number }) => [s.id, s]));
  const bidders = new Set(bids.map((b) => b.student_id));

  const results: LotResult[] = lots.map((lot) => {
    const amounts = bids.filter((b) => b.lot_id === lot.id).map((b) => b.amount).sort((a, b) => b - a);
    const sum = amounts.reduce((a, b) => a + b, 0);
    return {
      lot,
      bidCount: amounts.length,
      bids: amounts,
      avg: amounts.length ? Math.round((sum / amounts.length) * 10) / 10 : null,
      max: amounts.length ? amounts[0] : null,
      min: amounts.length ? amounts[amounts.length - 1] : null,
      winners: wins
        .filter((w) => w.lot_id === lot.id)
        .sort((a, b) => a.rank - b.rank)
        .map((w) => ({
          name: studentMap.get(w.student_id)?.name ?? "?",
          number: studentMap.get(w.student_id)?.number ?? 0,
          amount: w.amount,
          rank: w.rank,
        })),
    };
  });
  return { auction, results, bidderCount: bidders.size, studentCount: studentCount ?? 0, bids };
}
