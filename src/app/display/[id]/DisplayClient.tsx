"use client";

import { useEffect, useState } from "react";
import BidDots from "@/components/BidDots";
import { useRemaining } from "@/hooks/useRemaining";

type LotView = {
  id: string; name: string; emoji: string; description: string; quantity: number; bidCount: number;
  bids?: number[]; avg?: number | null; max?: number | null; min?: number | null;
  winners?: { rank: number; amount: number; name: string | null }[];
};
type View = {
  title: string; mode: "practice" | "real"; status: "draft" | "open" | "closed" | "revealed";
  closesAt: string | null; bidderCount: number; studentCount: number; practiceCoins: number; lots: LotView[];
};

export default function DisplayClient({ id }: { id: string }) {
  const [v, setV] = useState<View | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch(`/api/display/${id}`, { cache: "no-store" });
        const json = await res.json();
        if (!alive) return;
        if (!res.ok) setErr(json.error ?? "불러오지 못했어요");
        else { setV(json); setErr(""); }
      } catch {
        if (alive) setErr("연결을 확인해 주세요");
      }
    };
    load();
    const t = setInterval(load, 2000);
    return () => { alive = false; clearInterval(t); };
  }, [id]);

  const remaining = useRemaining(v?.status === "open" ? v.closesAt : null);

  if (!v) return <main className="flex min-h-screen items-center justify-center text-3xl text-slate-500">{err || "불러오는 중…"}</main>;

  const scaleMax = v.mode === "practice" ? v.practiceCoins : Math.max(...v.lots.map((l) => l.max ?? 0), 10);

  return (
    <main className="min-h-screen bg-gradient-to-b from-skysoft to-white p-8">
      <header className="mb-8 flex items-end justify-between">
        <div>
          <div className="text-2xl font-semibold text-sky-700">🔨 우리반 경매장 · {v.mode === "practice" ? "연습 경매" : "실전 경매"}</div>
          <h1 className="mt-1 text-5xl font-extrabold text-navy">{v.title}</h1>
        </div>
        <div className="text-right">
          {v.status === "open" && (
            <>
              <div className="text-3xl font-bold text-slate-700">입찰 <span className="text-navy">{v.bidderCount}</span> / {v.studentCount}명</div>
              {remaining !== null && <div className="mt-1 font-mono text-5xl font-extrabold text-navy">{Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}</div>}
            </>
          )}
          {v.status === "draft" && <div className="text-3xl font-bold text-slate-500">곧 시작해요</div>}
          {v.status === "closed" && <div className="text-4xl font-extrabold text-amber-600">마감! 결과를 기다려요 🥁</div>}
        </div>
      </header>

      {v.status === "open" && v.mode === "practice" && (
        <p className="mb-6 text-3xl font-semibold text-slate-700">모두 🪙 {v.practiceCoins}코인! 물건마다 내가 낼 수 있는 가격을 써 보세요.</p>
      )}

      <div className={`grid gap-6 ${v.lots.length >= 3 ? "lg:grid-cols-3" : v.lots.length === 2 ? "lg:grid-cols-2" : ""}`}>
        {v.lots.map((l) => (
          <section key={l.id} className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
            <div className="flex items-center gap-4">
              <span className="text-7xl">{l.emoji}</span>
              <div>
                <h2 className="text-3xl font-extrabold text-navy">{l.name}</h2>
                <div className="text-xl text-slate-500">{l.quantity > 1 ? `${l.quantity}명 낙찰 · ` : ""}입찰 {l.bidCount}명</div>
              </div>
            </div>
            {l.description && v.status !== "revealed" && <p className="mt-3 text-xl text-slate-600">{l.description}</p>}

            {v.status === "revealed" && (
              <div className="mt-6 space-y-5">
                {l.bidCount === 0 ? (
                  <div className="text-2xl text-slate-500">입찰한 친구가 없어요 (유찰)</div>
                ) : (
                  <>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <Big label="평균" value={l.avg} />
                      <Big label="최고" value={l.max} accent />
                      <Big label="최저" value={l.min} />
                    </div>
                    <BidDots bids={l.bids ?? []} scaleMax={scaleMax} big />
                    <div className="rounded-2xl bg-amber-50 p-4 text-2xl">
                      {(l.winners ?? []).map((w) => (
                        <div key={w.rank}>🏅 {w.name ?? `${w.rank}위`} — {w.amount}코인</div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </section>
        ))}
      </div>

      {v.status === "revealed" && v.mode === "practice" && (
        <p className="mt-10 text-center text-4xl font-extrabold text-navy">같은 {v.practiceCoins}코인인데, 왜 물건마다 · 친구마다 가격이 다를까요?</p>
      )}
      {err && <p className="mt-6 text-center text-rose-600">{err}</p>}
    </main>
  );
}

function Big({ label, value, accent }: { label: string; value?: number | null; accent?: boolean }) {
  return (
    <div className={`rounded-2xl py-3 ${accent ? "bg-navy text-white" : "bg-skysoft text-navy"}`}>
      <div className="text-lg opacity-80">{label}</div>
      <div className="text-4xl font-extrabold">{value ?? "-"}</div>
    </div>
  );
}
