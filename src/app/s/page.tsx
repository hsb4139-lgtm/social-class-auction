"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useRemaining } from "@/hooks/useRemaining";
import type { StudentState } from "@/lib/student-data";

type LotV = NonNullable<StudentState["auction"]>["lots"][number];

export default function StudentHome() {
  const router = useRouter();
  const [st, setSt] = useState<StudentState | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/s/state", { cache: "no-store" });
    if (res.status === 401) return router.replace("/s/login");
    if (res.ok) setSt(await res.json());
  }, [router]);

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [load]);

  const remaining = useRemaining(st?.auction?.status === "open" ? st.auction.closesAt : null);

  if (!st) return <main className="flex min-h-screen items-center justify-center text-slate-500">불러오는 중…</main>;

  const a = st.auction;
  const budget = a?.mode === "practice" ? st.practiceCoins : st.balance;
  const totalBid = a ? a.lots.reduce((s, l) => s + (l.myBid ?? 0), 0) : 0;
  const open = a?.status === "open" && remaining !== 0;

  return (
    <main className="mx-auto max-w-lg p-4 pb-16">
      <header className="flex items-center justify-between">
        <div>
          <div className="text-sm text-slate-500">{st.className}</div>
          <div className="text-xl font-bold">{st.student.number}번 {st.student.name}</div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/s/bag" className="btn-soft">🎒 내 가방</Link>
          <button className="text-sm text-slate-400" onClick={async () => { await fetch("/api/s/logout", { method: "POST" }); router.replace("/s/login"); }}>
            나가기
          </button>
        </div>
      </header>

      {a?.mode === "practice" && a.status === "open" ? (
        <section className="card mt-4 border-sky bg-skysoft p-5 text-center">
          <div className="text-sm text-slate-600">연습 경매 코인 (모두 똑같이)</div>
          <div className="text-5xl font-extrabold text-navy">🪙 {st.practiceCoins}</div>
          <div className="mt-1 text-xs text-slate-500">내 진짜 코인 {st.balance}개는 그대로예요</div>
        </section>
      ) : (
        <section className="card mt-4 p-5 text-center">
          <div className="text-sm text-slate-500">내 코인</div>
          <div className="text-5xl font-extrabold text-navy">🪙 {st.balance}</div>
        </section>
      )}

      {!a && <p className="mt-8 text-center text-slate-500">지금은 진행 중인 경매가 없어요.</p>}

      {a && (
        <section className="mt-6 space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${a.mode === "real" ? "bg-amber-100 text-amber-800" : "bg-skysoft text-navy"}`}>
                {a.mode === "practice" ? "연습 경매" : "실전 경매"}
              </span>
              <h2 className="mt-1 text-2xl font-extrabold text-navy">{a.title}</h2>
            </div>
            {open && remaining !== null && (
              <span className="font-mono text-2xl font-bold text-navy">⏱ {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}</span>
            )}
          </div>

          {open && (
            <div className="rounded-xl bg-skysoft p-3 text-sm text-navy">
              {a.mode === "practice" ? `연습 코인 ${budget}개로 입찰해요. 진짜 코인은 줄지 않아요.` : `내 코인 ${budget}개로 입찰해요.`}{" "}
              지금 쓴 코인 <b>{totalBid}</b> · 남은 코인 <b>{budget - totalBid}</b>
              <br />
              <span className="text-slate-600">친구의 입찰가는 보이지 않아요. 마감 전까지 고칠 수 있어요.</span>
            </div>
          )}
          {a.status === "open" && remaining === 0 && <p className="rounded-xl bg-rose-50 p-3 text-rose-700">입찰 시간이 끝났어요. 선생님이 마감할 때까지 기다려요.</p>}
          {a.status === "closed" && <p className="rounded-xl bg-amber-50 p-3 text-amber-800">마감! 결과 발표를 기다려요 🥁</p>}

          {a.lots.map((l) => (
            <LotCard key={l.id} lot={l} open={open} status={a.status} left={budget - totalBid + (l.myBid ?? 0)} onDone={load} />
          ))}
        </section>
      )}
    </main>
  );
}

function LotCard({ lot, open, status, left, onDone }: { lot: LotV; open: boolean; status: string; left: number; onDone: () => void }) {
  const [val, setVal] = useState<number>(lot.myBid ?? lot.minBid);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (lot.myBid !== null) setVal(lot.myBid); }, [lot.myBid]);

  const send = async (amount: number) => {
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/s/bid", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ lotId: lot.id, amount }),
    });
    const json = await res.json();
    setBusy(false);
    setMsg(res.ok ? (amount > 0 ? "입찰했어요!" : "입찰을 취소했어요") : json.error);
    onDone();
  };

  return (
    <div className="card p-4">
      <div className="flex items-center gap-3">
        <span className="text-5xl">{lot.emoji}</span>
        <div className="flex-1">
          <div className="text-lg font-bold">{lot.name}</div>
          {lot.description && <div className="text-sm text-slate-500">{lot.description}</div>}
          <div className="text-xs text-slate-500">{lot.quantity > 1 ? `${lot.quantity}명 낙찰 · ` : ""}최소 {lot.minBid}코인</div>
        </div>
      </div>

      {open && (
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2">
            <button className="btn-soft px-3 text-xl" onClick={() => setVal(Math.max(lot.minBid, val - 5))}>−5</button>
            <button className="btn-soft px-3 text-xl" onClick={() => setVal(Math.max(lot.minBid, val - 1))}>−</button>
            <input
              className="input text-center text-2xl font-bold"
              type="number"
              inputMode="numeric"
              value={val}
              min={lot.minBid}
              max={left}
              onChange={(e) => setVal(parseInt(e.target.value || "0", 10))}
            />
            <button className="btn-soft px-3 text-xl" onClick={() => setVal(Math.min(left, val + 1))}>+</button>
            <button className="btn-soft px-3 text-xl" onClick={() => setVal(Math.min(left, val + 5))}>+5</button>
          </div>
          <div className="flex gap-2">
            <button className="btn-primary flex-1 py-3 text-lg" disabled={busy || val < lot.minBid || val > left} onClick={() => send(val)}>
              {lot.myBid !== null ? `${val}코인으로 고치기` : `${val}코인 입찰`}
            </button>
            {lot.myBid !== null && <button className="btn-danger" disabled={busy} onClick={() => send(0)}>취소</button>}
          </div>
          {val > left && <p className="text-sm text-rose-600">남은 코인({left})보다 많아요</p>}
        </div>
      )}

      {lot.myBid !== null && <p className="mt-2 text-sm text-navy">내 입찰: <b>{lot.myBid}</b>코인</p>}
      {status === "revealed" && (
        <p className={`mt-2 rounded-xl p-2 text-center font-bold ${lot.won !== null ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-500"}`}>
          {lot.won !== null ? `🎉 낙찰! (${lot.won}코인)` : lot.myBid !== null ? "아쉽게도 낙찰되지 않았어요" : "입찰하지 않았어요"}
        </p>
      )}
      {msg && <p className="mt-2 text-sm text-slate-700">{msg}</p>}
    </div>
  );
}
