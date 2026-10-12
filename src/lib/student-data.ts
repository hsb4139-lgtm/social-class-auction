import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Auction, Item } from "@/lib/types";

export async function loadStudentState(sid: string, cid: string) {
  const db = createAdminClient();
  const [{ data: student }, { data: cls }, { data: ledger }, { data: auction }] = await Promise.all([
    db.from("students").select("id, number, name, is_active").eq("id", sid).eq("class_id", cid).maybeSingle(),
    db.from("classes").select("name, practice_coins").eq("id", cid).single(),
    db.from("coin_ledger").select("amount").eq("student_id", sid),
    db.from("auctions").select("*").eq("class_id", cid).in("status", ["open", "closed", "revealed"]).order("opened_at", { ascending: false, nullsFirst: false }).limit(1).maybeSingle<Auction>(),
  ]);
  if (!student || !student.is_active) return null;
  const balance = (ledger ?? []).reduce((a: number, r: { amount: number }) => a + r.amount, 0);

  let auctionView = null;
  if (auction) {
    const { data: lots } = await db.from("auction_lots").select("id, quantity, position, items(*)").eq("auction_id", auction.id).order("position");
    const lotIds = (lots ?? []).map((l) => l.id);
    const [{ data: myBids }, { data: myWins }] = await Promise.all([
      lotIds.length ? db.from("bids").select("lot_id, amount").eq("student_id", sid).in("lot_id", lotIds) : Promise.resolve({ data: [] }),
      lotIds.length ? db.from("lot_winners").select("lot_id, amount").eq("student_id", sid).in("lot_id", lotIds) : Promise.resolve({ data: [] }),
    ]);
    const bidMap = new Map((myBids ?? []).map((b: { lot_id: string; amount: number }) => [b.lot_id, b.amount]));
    const winMap = new Map((myWins ?? []).map((b: { lot_id: string; amount: number }) => [b.lot_id, b.amount]));
    auctionView = {
      id: auction.id,
      title: auction.title,
      mode: auction.mode,
      status: auction.status,
      closesAt: auction.closes_at,
      lots: (lots ?? []).map((l) => {
        const item = l.items as unknown as Item;
        return {
          id: l.id,
          quantity: l.quantity,
          name: item.name,
          emoji: item.emoji,
          description: item.description,
          minBid: item.min_bid,
          myBid: bidMap.get(l.id) ?? null,
          won: auction.status === "revealed" ? (winMap.get(l.id) ?? null) : null,
        };
      }),
    };
  }
  return {
    student: { number: student.number, name: student.name },
    className: cls?.name ?? "",
    balance,
    practiceCoins: cls?.practice_coins ?? 100,
    auction: auctionView,
  };
}
export type StudentState = NonNullable<Awaited<ReturnType<typeof loadStudentState>>>;
