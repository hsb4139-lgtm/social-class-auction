"use client";

import { useState, useTransition } from "react";
import { grantCoins, undoBatch } from "../actions";

export type Batch = {
  id: string; amount: number; reason: string; type: string; undone: boolean; created_at: string; names: string[];
};
type S = { id: string; number: number; name: string; balance: number };

const PRESETS = [
  { label: "학급 목표 달성", amount: 10 },
  { label: "과제 완료", amount: 5 },
  { label: "1인 1역 수행", amount: 3 },
  { label: "칭찬", amount: 2 },
];

export default function CoinsClient({ students, batches }: { students: S[]; batches: Batch[] }) {
  const [target, setTarget] = useState<"all" | "some">("all");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [amount, setAmount] = useState(5);
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();

  const toggle = (id: string) => {
    const n = new Set(picked);
    if (n.has(id)) n.delete(id);
    else n.add(id);
    setPicked(n);
  };
  const submit = () =>
    start(async () => {
      const r = await grantCoins({ studentIds: target === "all" ? "all" : [...picked], amount, reason });
      setMsg(r.message ?? "");
      if (r.ok) setPicked(new Set());
    });

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <section className="card p-5 space-y-4">
        <div className="flex gap-2">
          <button className={target === "all" ? "btn-primary" : "btn-soft"} onClick={() => setTarget("all")}>전체 주기</button>
          <button className={target === "some" ? "btn-primary" : "btn-soft"} onClick={() => setTarget("some")}>골라서 주기</button>
        </div>

        {target === "some" && (
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-slate-600">{picked.size}명 선택</span>
              <span className="space-x-2">
                <button className="underline" onClick={() => setPicked(new Set(students.map((s) => s.id)))}>모두</button>
                <button className="underline" onClick={() => setPicked(new Set())}>해제</button>
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {students.map((s) => (
                <button
                  key={s.id}
                  onClick={() => toggle(s.id)}
                  className={`rounded-xl border p-2 text-center text-sm ${picked.has(s.id) ? "border-navy bg-skysoft" : "border-slate-200"}`}
                >
                  <div className="font-semibold">{s.number}. {s.name}</div>
                  <div className="text-xs text-slate-500">🪙 {s.balance}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button key={p.label} className="rounded-full border border-slate-300 px-3 py-1 text-sm hover:border-navy" onClick={() => { setReason(p.label); setAmount(p.amount); }}>
              {p.label} +{p.amount}
            </button>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-[140px_1fr]">
          <div>
            <label className="label">코인 (빼려면 −)</label>
            <input className="input" type="number" value={amount} onChange={(e) => setAmount(parseInt(e.target.value || "0", 10))} />
          </div>
          <div>
            <label className="label">사유</label>
            <input className="input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="예: 학급 목표 달성" />
          </div>
        </div>
        <button className="btn-primary w-full" disabled={pending || !amount || (target === "some" && picked.size === 0)} onClick={submit}>
          {target === "all" ? `전체 학생에게 ${amount > 0 ? "+" : ""}${amount} 코인` : `${picked.size}명에게 ${amount > 0 ? "+" : ""}${amount} 코인`}
        </button>
        {msg && <p className="text-sm text-navy">{msg}</p>}
      </section>

      <section className="card p-5">
        <h2 className="font-bold text-navy">최근 내역</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {batches.map((b) => (
            <li key={b.id} className={`rounded-xl border border-slate-100 p-3 ${b.undone ? "opacity-50" : ""}`}>
              <div className="flex items-center justify-between">
                <span className={`font-bold ${b.amount >= 0 ? "text-navy" : "text-rose-600"}`}>
                  {b.amount > 0 ? "+" : ""}{b.amount} · {b.reason}
                </span>
                {(b.type === "grant" || b.type === "deduct") && !b.undone && (
                  <button className="text-xs text-slate-500 underline" disabled={pending} onClick={() => start(async () => { const r = await undoBatch(b.id); setMsg(r.message ?? ""); })}>
                    되돌리기
                  </button>
                )}
                {b.undone && <span className="text-xs">되돌림</span>}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {new Date(b.created_at).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })} ·{" "}
                {b.names.length > 4 ? `${b.names.slice(0, 4).join(", ")} 외 ${b.names.length - 4}명` : b.names.join(", ")}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
