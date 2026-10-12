import Link from "next/link";
import { redirect } from "next/navigation";
import { getStudentSession } from "@/lib/student-session";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type Inv = { id: string; price_paid: number; status: string; acquired_at: string; items: { name: string; emoji: string } | null };
type Led = { id: string; amount: number; reason: string; created_at: string };

export default async function BagPage() {
  const s = await getStudentSession();
  if (!s) redirect("/s/login");
  const db = createAdminClient();
  const [{ data: inv }, { data: ledger }] = await Promise.all([
    db.from("inventory").select("id, price_paid, status, acquired_at, items(name, emoji)").eq("student_id", s.sid).order("acquired_at", { ascending: false }),
    db.from("coin_ledger").select("id, amount, reason, created_at").eq("student_id", s.sid).order("created_at", { ascending: false }).limit(50),
  ]);
  const items = (inv ?? []) as unknown as Inv[];
  const led = (ledger ?? []) as Led[];
  const balance = led.length ? (await db.from("coin_ledger").select("amount").eq("student_id", s.sid)).data?.reduce((a, r) => a + r.amount, 0) ?? 0 : 0;

  return (
    <main className="mx-auto max-w-lg p-4 pb-16">
      <Link href="/s" className="text-sm text-slate-500">← 경매장으로</Link>
      <h1 className="mt-2 text-2xl font-extrabold text-navy">🎒 내 가방</h1>

      <section className="mt-4 grid grid-cols-2 gap-3">
        {items.length === 0 && <p className="col-span-2 text-slate-500">아직 낙찰받은 물건이 없어요.</p>}
        {items.map((i) => (
          <div key={i.id} className={`card p-4 text-center ${i.status === "used" ? "opacity-50" : ""}`}>
            <div className="text-5xl">{i.items?.emoji}</div>
            <div className="mt-2 font-bold">{i.items?.name}</div>
            <div className="text-xs text-slate-500">{i.price_paid}코인 · {new Date(i.acquired_at).toLocaleDateString("ko-KR")}</div>
            <div className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-bold ${i.status === "used" ? "bg-slate-200" : "bg-amber-100 text-amber-800"}`}>
              {i.status === "used" ? "사용 완료" : "사용 전"}
            </div>
          </div>
        ))}
      </section>

      <section className="card mt-6 p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-navy">코인 내역</h2>
          <span className="font-bold">🪙 {balance}</span>
        </div>
        <ul className="mt-2 divide-y divide-slate-100 text-sm">
          {led.map((l) => (
            <li key={l.id} className="flex justify-between py-2">
              <span>
                {l.reason}
                <span className="ml-2 text-xs text-slate-400">{new Date(l.created_at).toLocaleDateString("ko-KR")}</span>
              </span>
              <b className={l.amount >= 0 ? "text-navy" : "text-rose-600"}>{l.amount > 0 ? "+" : ""}{l.amount}</b>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
