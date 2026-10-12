import { requireClass } from "@/lib/teacher";
import { setInventoryUsed } from "../actions";

type Inv = {
  id: string; student_id: string; price_paid: number; status: "owned" | "used"; acquired_at: string; used_at: string | null;
  items: { name: string; emoji: string } | null;
};

export default async function RecordsPage() {
  const { supabase, cls } = await requireClass();
  const [{ data: students }, { data: inv }] = await Promise.all([
    supabase.from("students").select("id, number, name, is_active").eq("class_id", cls.id).order("number"),
    supabase.from("inventory").select("id, student_id, price_paid, status, acquired_at, used_at, items(name, emoji)").eq("class_id", cls.id).order("acquired_at", { ascending: false }),
  ]);
  const rows = (inv ?? []) as unknown as Inv[];
  const unused = rows.filter((r) => r.status === "owned").length;

  return (
    <div className="space-y-4">
      <div className="card p-4">
        낙찰된 물건 <b className="text-navy">{rows.length}</b>개 · 아직 안 쓴 것 <b className="text-amber-700">{unused}</b>개
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {(students ?? []).map((s) => {
          const mine = rows.filter((r) => r.student_id === s.id);
          if (!mine.length) return null;
          return (
            <section key={s.id} className="card p-4">
              <h3 className="font-bold text-navy">{s.number}번 {s.name} <span className="text-sm font-normal text-slate-500">({mine.length}개)</span></h3>
              <ul className="mt-2 space-y-1 text-sm">
                {mine.map((r) => (
                  <li key={r.id} className={`flex items-center gap-2 ${r.status === "used" ? "text-slate-400 line-through" : ""}`}>
                    <span>{r.items?.emoji}</span>
                    <span className="flex-1">{r.items?.name} · {r.price_paid}코인 · {new Date(r.acquired_at).toLocaleDateString("ko-KR")}</span>
                    <form action={setInventoryUsed.bind(null, r.id, r.status !== "used")}>
                      <button className={`rounded-lg px-2 py-0.5 text-xs no-underline ${r.status === "used" ? "bg-slate-100" : "bg-amber-100 text-amber-800"}`}>
                        {r.status === "used" ? "되돌리기" : "사용 완료"}
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
      {rows.length === 0 && <p className="text-slate-500">아직 실전 경매 낙찰 기록이 없어요.</p>}
    </div>
  );
}
