"use client";

import type { PinCard } from "@/app/teacher/actions";

export default function PinCards({ cards, code, onClose }: { cards: PinCard[]; code: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-white p-6 print:p-0">
      <div className="mb-4 flex items-center gap-3 print:hidden">
        <h2 className="text-xl font-bold text-navy">새 PIN 로그인 카드</h2>
        <p className="text-sm text-rose-600">이 화면을 닫으면 PIN을 다시 볼 수 없어요. 인쇄하거나 적어 두세요.</p>
        <button className="btn-primary ml-auto" onClick={() => window.print()}>인쇄</button>
        <button className="btn-soft" onClick={onClose}>닫기</button>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cards.map((c) => (
          <div key={c.number} className="rounded-xl border-2 border-dashed border-slate-300 p-3 text-center break-inside-avoid">
            <div className="text-xs text-slate-500">우리반 경매장 · 학급 코드 <b className="font-mono">{code}</b></div>
            <div className="mt-1 text-lg font-bold">{c.number}번 {c.name}</div>
            <div className="mt-1 font-mono text-3xl font-extrabold tracking-[0.3em] text-navy">{c.pin}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
