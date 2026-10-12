import { requireClass } from "@/lib/teacher";
import { createItem, setItemArchived } from "../actions";
import type { Item } from "@/lib/types";

const EXAMPLES = [
  { emoji: "💺", name: "원하는 자리 2주 앉기권" },
  { emoji: "🍪", name: "과자파티 구매권" },
  { emoji: "🎵", name: "점심시간 신청곡 1곡" },
  { emoji: "📚", name: "숙제 1회 면제권" },
];

export default async function ItemsPage() {
  const { supabase, cls } = await requireClass();
  const { data } = await supabase.from("items").select("*").eq("class_id", cls.id).order("created_at", { ascending: false });
  const items = (data ?? []) as Item[];
  const active = items.filter((i) => !i.archived);
  const archived = items.filter((i) => i.archived);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
      <form action={createItem} className="card p-5 space-y-3 self-start">
        <h2 className="font-bold text-navy">물건 등록</h2>
        <div className="grid grid-cols-[80px_1fr] gap-3">
          <div>
            <label className="label">이모지</label>
            <input className="input text-center text-2xl" name="emoji" defaultValue="🎁" maxLength={4} />
          </div>
          <div>
            <label className="label">이름</label>
            <input className="input" name="name" required placeholder="예: 원하는 자리 2주 앉기권" />
          </div>
        </div>
        <div>
          <label className="label">설명 (선택)</label>
          <input className="input" name="description" placeholder="예: 다음 자리 바꾸기 때 원하는 자리를 먼저 고를 수 있어요" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">기본 수량</label>
            <input className="input" name="default_quantity" type="number" min={1} defaultValue={1} />
          </div>
          <div>
            <label className="label">최소 입찰가</label>
            <input className="input" name="min_bid" type="number" min={1} defaultValue={1} />
          </div>
        </div>
        <button className="btn-primary w-full">등록</button>
        <p className="text-xs text-slate-500">아이디어: {EXAMPLES.map((e) => `${e.emoji} ${e.name}`).join(" · ")}</p>
      </form>

      <section className="card p-5">
        <h2 className="font-bold text-navy">물건 보관함 ({active.length})</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {active.map((i) => (
            <li key={i.id} className="flex items-start gap-3 rounded-xl border border-slate-200 p-3">
              <span className="text-3xl">{i.emoji}</span>
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{i.name}</div>
                {i.description && <div className="text-xs text-slate-500">{i.description}</div>}
                <div className="mt-1 text-xs text-slate-500">수량 {i.default_quantity} · 최소 {i.min_bid}코인</div>
              </div>
              <form action={setItemArchived.bind(null, i.id, true)}>
                <button className="text-xs text-slate-400 underline">숨기기</button>
              </form>
            </li>
          ))}
        </ul>
        {archived.length > 0 && (
          <details className="mt-4 text-sm">
            <summary className="cursor-pointer text-slate-500">숨긴 물건 {archived.length}개</summary>
            <ul className="mt-2 space-y-1">
              {archived.map((i) => (
                <li key={i.id} className="flex items-center gap-2 text-slate-500">
                  {i.emoji} {i.name}
                  <form action={setItemArchived.bind(null, i.id, false)}>
                    <button className="underline">다시 보이기</button>
                  </form>
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>
    </div>
  );
}
