"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createAuction } from "../actions";
import type { Item } from "@/lib/types";

export default function NewAuctionForm({ items }: { items: Item[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [mode, setMode] = useState<"practice" | "real">("practice");
  const [showNames, setShowNames] = useState(false);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();

  const toggle = (it: Item) => {
    const n = { ...qty };
    if (n[it.id]) delete n[it.id];
    else n[it.id] = it.default_quantity;
    setQty(n);
  };
  const submit = () =>
    start(async () => {
      const r = await createAuction({
        title,
        mode,
        showWinnerNames: mode === "real" ? true : showNames,
        lots: Object.entries(qty).map(([itemId, quantity]) => ({ itemId, quantity })),
      });
      if (!r.ok) return setMsg(r.message ?? "오류");
      router.push(`/teacher/auctions/${r.id}`);
    });

  return (
    <section className="card p-5 space-y-4 self-start">
      <h2 className="font-bold text-navy">새 경매 만들기</h2>
      <div className="grid grid-cols-2 gap-2">
        <button className={`rounded-xl border-2 p-3 text-left ${mode === "practice" ? "border-navy bg-skysoft" : "border-slate-200"}`} onClick={() => setMode("practice")}>
          <div className="font-bold">🧪 연습 경매</div>
          <div className="text-xs text-slate-600">모두 같은 코인으로 입찰. 코인·가방은 그대로 (수업 동기유발용)</div>
        </button>
        <button className={`rounded-xl border-2 p-3 text-left ${mode === "real" ? "border-amber-500 bg-amber-50" : "border-slate-200"}`} onClick={() => setMode("real")}>
          <div className="font-bold">🏆 실전 경매</div>
          <div className="text-xs text-slate-600">모은 코인으로 입찰. 낙찰되면 코인이 빠지고 가방에 들어가요</div>
        </button>
      </div>
      <div>
        <label className="label">경매 이름</label>
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={mode === "practice" ? "예: 2차시 경매 게임" : "예: 11월 자리 경매"} />
      </div>
      <div>
        <label className="label">물건 고르기 (수량 조절 가능)</label>
        {items.length === 0 && (
          <p className="text-sm text-slate-500">먼저 <Link href="/teacher/items" className="underline">물건을 등록</Link>해 주세요.</p>
        )}
        <ul className="space-y-2">
          {items.map((it) => (
            <li key={it.id} className={`flex items-center gap-3 rounded-xl border p-2 ${qty[it.id] ? "border-navy bg-skysoft" : "border-slate-200"}`}>
              <input type="checkbox" className="h-5 w-5" checked={!!qty[it.id]} onChange={() => toggle(it)} />
              <span className="text-2xl">{it.emoji}</span>
              <span className="flex-1 font-semibold">{it.name}</span>
              {qty[it.id] ? (
                <label className="flex items-center gap-1 text-sm">
                  수량
                  <input type="number" min={1} className="input w-16 py-1" value={qty[it.id]} onChange={(e) => setQty({ ...qty, [it.id]: Math.max(1, parseInt(e.target.value || "1", 10)) })} />
                </label>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
      {mode === "practice" && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={showNames} onChange={(e) => setShowNames(e.target.checked)} />
          결과 화면에 최고가 학생 이름 보여 주기 (끄면 금액만 공개)
        </label>
      )}
      {msg && <p className="text-sm text-rose-600">{msg}</p>}
      <button className="btn-primary w-full" disabled={pending || Object.keys(qty).length === 0} onClick={submit}>
        경매 만들기
      </button>
    </section>
  );
}
