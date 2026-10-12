import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { loadAuctionResult } from "@/lib/auction-data";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return NextResponse.json({ error: "로그인이 필요해요" }, { status: 401 });
  const data = await loadAuctionResult(supabase, id);
  if (!data) return NextResponse.json({ error: "경매가 없어요" }, { status: 404 });
  const { data: cls } = await supabase.from("classes").select("practice_coins").eq("id", data.auction.class_id).single();

  const { auction } = data;
  const revealed = auction.status === "revealed";
  return NextResponse.json({
    title: auction.title,
    mode: auction.mode,
    status: auction.status,
    closesAt: auction.closes_at,
    bidderCount: data.bidderCount,
    studentCount: data.studentCount,
    practiceCoins: cls?.practice_coins ?? 100,
    lots: data.results.map((r) => ({
      id: r.lot.id,
      name: r.lot.items.name,
      emoji: r.lot.items.emoji,
      description: r.lot.items.description,
      quantity: r.lot.quantity,
      bidCount: r.bidCount,
      ...(revealed
        ? {
            bids: r.bids,
            avg: r.avg,
            max: r.max,
            min: r.min,
            winners: r.winners.map((w) => ({
              rank: w.rank,
              amount: w.amount,
              name: auction.show_winner_names ? `${w.number}번 ${w.name}` : null,
            })),
          }
        : {}),
    })),
  });
}
