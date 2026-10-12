import Link from "next/link";
import { notFound } from "next/navigation";
import { requireClass } from "@/lib/teacher";
import { loadAuctionResult } from "@/lib/auction-data";
import AutoRefresh from "@/components/AutoRefresh";
import BidDots from "@/components/BidDots";
import Controls from "./Controls";
import { MODE_LABEL, STATUS_LABEL } from "@/lib/types";

export default async function AuctionDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, cls } = await requireClass();
  const data = await loadAuctionResult(supabase, id);
  if (!data) notFound();
  const { auction, results, bidderCount, studentCount } = data;
  const done = auction.status === "closed" || auction.status === "revealed";
  const scaleMax = auction.mode === "practice" ? cls.practice_coins : Math.max(...results.map((r) => r.max ?? 0), 10);

  return (
    <div className="space-y-6">
      {auction.status === "open" && <AutoRefresh ms={3000} />}
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/teacher/auctions" className="text-sm text-slate-500">← 경매 목록</Link>
        <h1 className="text-2xl font-bold text-navy">{auction.title}</h1>
        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${auction.mode === "real" ? "bg-amber-100 text-amber-800" : "bg-skysoft text-navy"}`}>
          {MODE_LABEL[auction.mode]}
        </span>
        <span className="text-slate-600">{STATUS_LABEL[auction.status]}</span>
        <Link href={`/display/${auction.id}`} target="_blank" className="btn-soft ml-auto">📺 전광판 열기</Link>
      </div>

      <Controls id={auction.id} status={auction.status} closesAt={auction.closes_at} />

      <div className="card p-4 text-slate-700">
        입찰한 학생 <b className="text-navy">{bidderCount}</b> / {studentCount}명
        {auction.mode === "practice" && <span className="ml-3 text-sm text-slate-500">연습 코인 {cls.practice_coins}개씩</span>}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {results.map((r) => (
          <div key={r.lot.id} className="card p-5 space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{r.lot.items.emoji}</span>
              <div>
                <div className="text-lg font-bold">{r.lot.items.name}</div>
                <div className="text-sm text-slate-500">수량 {r.lot.quantity} · 입찰 {r.bidCount}명</div>
              </div>
            </div>
            {r.bidCount > 0 && (
              <>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <Stat label="평균" value={r.avg} />
                  <Stat label="최고" value={r.max} />
                  <Stat label="최저" value={r.min} />
                </div>
                <BidDots bids={r.bids} scaleMax={scaleMax} />
              </>
            )}
            {done && (
              <div className="rounded-xl bg-amber-50 p-3 text-sm">
                {r.winners.length === 0 ? "유찰 (입찰자 없음)" : r.winners.map((w) => (
                  <div key={w.rank}>🏅 {w.rank}위 {w.number}번 {w.name} — {w.amount}코인</div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded-xl bg-skysoft py-2">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-xl font-extrabold text-navy">{value ?? "-"}</div>
    </div>
  );
}
