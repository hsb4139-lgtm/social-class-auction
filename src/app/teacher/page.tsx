import Link from "next/link";
import { getTeacher } from "@/lib/teacher";
import { createClass, updateClassSettings } from "./actions";
import { MODE_LABEL, STATUS_LABEL, type Auction } from "@/lib/types";

export default async function TeacherHome() {
  const { supabase, cls } = await getTeacher();

  if (!cls) {
    return (
      <form action={createClass} className="card mx-auto max-w-md p-6 space-y-4">
        <h1 className="text-2xl font-bold text-navy">학급 만들기</h1>
        <p className="text-slate-600">학급을 만들면 학생들이 들어올 때 쓰는 6자리 학급 코드가 생겨요.</p>
        <div>
          <label className="label">학급 이름</label>
          <input className="input" name="name" placeholder="예: 6학년 4반" required />
        </div>
        <button className="btn-primary w-full">만들기</button>
      </form>
    );
  }

  const [{ data: students }, { data: balances }, { data: auctions }] = await Promise.all([
    supabase.from("students").select("id, number, name, is_active").eq("class_id", cls.id).order("number"),
    supabase.from("student_balances").select("student_id, balance").eq("class_id", cls.id),
    supabase.from("auctions").select("*").eq("class_id", cls.id).in("status", ["draft", "open", "closed"]).order("created_at", { ascending: false }).limit(3),
  ]);
  const bal = new Map((balances ?? []).map((b: { student_id: string; balance: number }) => [b.student_id, b.balance]));
  const active = (students ?? []).filter((s) => s.is_active);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <div className="card p-5">
          <div className="text-sm text-slate-500">학생 입장 주소</div>
          <div className="mt-1 font-semibold text-navy">/s/login</div>
          <div className="mt-3 text-sm text-slate-500">학급 코드</div>
          <div className="font-mono text-3xl font-extrabold tracking-widest text-navy">{cls.join_code}</div>
        </div>
        <div className="card p-5 md:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-navy">진행 중인 경매</h2>
            <Link href="/teacher/auctions" className="text-sm text-slate-500">전체 보기 →</Link>
          </div>
          {(auctions ?? []).length === 0 && <p className="mt-3 text-slate-500">진행 중인 경매가 없어요.</p>}
          <ul className="mt-3 space-y-2">
            {((auctions ?? []) as Auction[]).map((a) => (
              <li key={a.id}>
                <Link href={`/teacher/auctions/${a.id}`} className="flex items-center justify-between rounded-xl bg-skysoft px-4 py-2 hover:bg-sky/30">
                  <span className="font-semibold">{a.title}</span>
                  <span className="text-sm text-slate-600">{MODE_LABEL[a.mode]} · {STATUS_LABEL[a.status]}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="card p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-navy">학생별 코인 ({active.length}명)</h2>
          <Link href="/teacher/coins" className="btn-soft text-sm">코인 주기</Link>
        </div>
        {active.length === 0 ? (
          <p className="mt-3 text-slate-500">
            아직 학생이 없어요. <Link className="underline" href="/teacher/students">학생 등록하기</Link>
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-7">
            {active.map((s) => (
              <div key={s.id} className="rounded-xl border border-slate-200 p-2 text-center">
                <div className="text-xs text-slate-500">{s.number}번</div>
                <div className="font-semibold truncate">{s.name}</div>
                <div className="text-lg font-extrabold text-navy">🪙 {bal.get(s.id) ?? 0}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <details className="card p-5">
        <summary className="cursor-pointer font-bold text-navy">학급 설정</summary>
        <form action={updateClassSettings} className="mt-4 grid gap-4 sm:grid-cols-3 sm:items-end">
          <div>
            <label className="label">학급 이름</label>
            <input className="input" name="name" defaultValue={cls.name} />
          </div>
          <div>
            <label className="label">연습 경매 코인 (모두 같은 금액)</label>
            <input className="input" name="practice_coins" type="number" min={0} defaultValue={cls.practice_coins} />
          </div>
          <button className="btn-primary">저장</button>
        </form>
      </details>
    </div>
  );
}
