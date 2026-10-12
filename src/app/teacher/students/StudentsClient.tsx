"use client";

import { useState, useTransition } from "react";
import { addStudents, resetPins, updateStudent, type PinCard } from "../actions";
import PinCards from "@/components/PinCards";
import type { Student } from "@/lib/types";

export default function StudentsClient({ students, code }: { students: Student[]; code: string }) {
  const [text, setText] = useState("");
  const [msg, setMsg] = useState("");
  const [cards, setCards] = useState<PinCard[] | null>(null);
  const [pending, start] = useTransition();

  const add = () =>
    start(async () => {
      const r = await addStudents(text);
      if (!r.ok) return setMsg(r.message ?? "오류");
      setText("");
      setMsg("");
      setCards(r.cards ?? []);
    });
  const reset = (ids: string[]) =>
    start(async () => {
      if (!confirm(ids.length > 1 ? "모든 학생의 PIN을 새로 만들까요?" : "이 학생의 PIN을 새로 만들까요?")) return;
      const r = await resetPins(ids);
      setCards(r.cards ?? []);
    });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
      {cards && <PinCards cards={cards} code={code} onClose={() => setCards(null)} />}
      <section className="card p-5 space-y-3">
        <h2 className="font-bold text-navy">학생 등록</h2>
        <p className="text-sm text-slate-600">
          한 줄에 한 명씩 <b>번호 이름</b>을 적거나, 엑셀의 번호·이름 두 칸을 복사해 붙여넣으세요. 이름만 적으면 번호가 이어서 붙어요.
        </p>
        <textarea className="input h-56 font-mono" value={text} onChange={(e) => setText(e.target.value)} placeholder={"1 김민준\n2 이서연\n3 박지호"} />
        {msg && <p className="text-sm text-rose-600">{msg}</p>}
        <button className="btn-primary w-full" disabled={pending || !text.trim()} onClick={add}>
          등록하고 PIN 만들기
        </button>
      </section>

      <section className="card p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-navy">학생 명단 ({students.length}명)</h2>
          {students.length > 0 && (
            <button className="btn-soft text-sm" disabled={pending} onClick={() => reset(students.filter((s) => s.is_active).map((s) => s.id))}>
              전체 PIN 새로 만들기·인쇄
            </button>
          )}
        </div>
        <table className="mt-3 w-full text-sm">
          <thead className="text-left text-slate-500">
            <tr><th className="py-2 w-16">번호</th><th>이름</th><th className="w-40 text-right">관리</th></tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id} className={`border-t border-slate-100 ${s.is_active ? "" : "text-slate-400"}`}>
                <td className="py-2">{s.number}</td>
                <td>
                  <input
                    className="w-full rounded px-1 py-0.5 hover:bg-slate-50 focus:bg-white focus:outline-navy"
                    defaultValue={s.name}
                    onBlur={(e) => e.target.value.trim() && e.target.value !== s.name && start(() => updateStudent(s.id, { name: e.target.value.trim() }))}
                  />
                </td>
                <td className="text-right space-x-2">
                  <button className="text-navy underline" onClick={() => reset([s.id])}>PIN</button>
                  <button className="text-slate-500 underline" onClick={() => start(() => updateStudent(s.id, { is_active: !s.is_active }))}>
                    {s.is_active ? "비활성" : "복구"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
