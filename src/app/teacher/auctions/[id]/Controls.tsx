"use client";

import { useState, useTransition } from "react";
import { useRemaining } from "@/hooks/useRemaining";
import { closeAuction, deleteDraftAuction, openAuction, revealAuction } from "../../actions";
import type { AuctionStatus } from "@/lib/types";

export default function Controls({ id, status, closesAt }: { id: string; status: AuctionStatus; closesAt: string | null }) {
  const [minutes, setMinutes] = useState(0);
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();
  const remaining = useRemaining(status === "open" ? closesAt : null);
  const run = (fn: () => Promise<{ ok: boolean; message?: string }>) =>
    start(async () => {
      const r = await fn();
      setMsg(r.ok ? "" : r.message ?? "오류");
    });

  return (
    <div className="card flex flex-wrap items-center gap-3 p-4">
      <Step on={status === "draft"} n={1} label="준비" />
      <Step on={status === "open"} n={2} label="입찰 중" />
      <Step on={status === "closed"} n={3} label="마감" />
      <Step on={status === "revealed"} n={4} label="결과 공개" />
      <div className="ml-auto flex flex-wrap items-center gap-2">
        {status === "draft" && (
          <>
            <label className="text-sm text-slate-600">
              제한 시간
              <select className="input ml-1 inline-block w-auto py-1" value={minutes} onChange={(e) => setMinutes(parseInt(e.target.value, 10))}>
                <option value={0}>없음(직접 마감)</option>
                <option value={2}>2분</option>
                <option value={3}>3분</option>
                <option value={5}>5분</option>
                <option value={10}>10분</option>
                <option value={60}>1시간</option>
                <option value={1440}>하루</option>
              </select>
            </label>
            <button className="btn-primary" disabled={pending} onClick={() => run(() => openAuction(id, minutes))}>▶ 입찰 시작</button>
            <button className="btn-danger" disabled={pending} onClick={() => confirm("이 경매를 지울까요?") && start(() => deleteDraftAuction(id))}>삭제</button>
          </>
        )}
        {status === "open" && (
          <>
            {remaining !== null && (
              <span className={`font-mono text-lg font-bold ${remaining === 0 ? "text-rose-600" : "text-navy"}`}>
                ⏱ {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}
              </span>
            )}
            <button className="btn-primary" disabled={pending} onClick={() => confirm("입찰을 마감하고 낙찰자를 정할까요?") && run(() => closeAuction(id))}>
              ■ 마감하기
            </button>
          </>
        )}
        {status === "closed" && (
          <button className="btn-primary" disabled={pending} onClick={() => run(() => revealAuction(id))}>🎉 전광판에 결과 공개</button>
        )}
      </div>
      {msg && <p className="w-full text-sm text-rose-600">{msg}</p>}
    </div>
  );
}

function Step({ on, n, label }: { on: boolean; n: number; label: string }) {
  return (
    <span className={`flex items-center gap-1 text-sm ${on ? "font-bold text-navy" : "text-slate-400"}`}>
      <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${on ? "bg-navy text-white" : "bg-slate-200"}`}>{n}</span>
      {label}
    </span>
  );
}
