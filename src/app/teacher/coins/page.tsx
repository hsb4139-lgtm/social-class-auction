import { requireClass } from "@/lib/teacher";
import CoinsClient, { type Batch } from "./CoinsClient";

type LedgerRow = {
  batch_id: string; amount: number; reason: string; type: string; undone: boolean; created_at: string;
  students: { name: string; number: number } | null;
};

export default async function CoinsPage() {
  const { supabase, cls } = await requireClass();
  const [{ data: students }, { data: balances }, { data: ledger }] = await Promise.all([
    supabase.from("students").select("id, number, name").eq("class_id", cls.id).eq("is_active", true).order("number"),
    supabase.from("student_balances").select("student_id, balance").eq("class_id", cls.id),
    supabase
      .from("coin_ledger")
      .select("batch_id, amount, reason, type, undone, created_at, students(name, number)")
      .eq("class_id", cls.id)
      .order("created_at", { ascending: false })
      .limit(300),
  ]);
  const bal = Object.fromEntries((balances ?? []).map((b: { student_id: string; balance: number }) => [b.student_id, b.balance]));

  const batches = new Map<string, Batch>();
  for (const r of (ledger ?? []) as unknown as LedgerRow[]) {
    const b = batches.get(r.batch_id) ?? {
      id: r.batch_id, amount: r.amount, reason: r.reason, type: r.type, undone: r.undone, created_at: r.created_at, names: [],
    };
    if (r.students) b.names.push(`${r.students.number}번 ${r.students.name}`);
    batches.set(r.batch_id, b);
  }
  return (
    <CoinsClient
      students={(students ?? []).map((s) => ({ ...s, balance: bal[s.id] ?? 0 }))}
      batches={[...batches.values()].slice(0, 30)}
    />
  );
}
