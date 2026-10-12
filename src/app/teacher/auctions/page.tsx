import Link from "next/link";
import { requireClass } from "@/lib/teacher";
import NewAuctionForm from "./NewAuctionForm";
import { MODE_LABEL, STATUS_LABEL, type Auction, type Item } from "@/lib/types";

export default async function AuctionsPage() {
  const { supabase, cls } = await requireClass();
  const [{ data: items }, { data: auctions }] = await Promise.all([
    supabase.from("items").select("*").eq("class_id", cls.id).eq("archived", false).order("created_at", { ascending: false }),
    supabase.from("auctions").select("*").eq("class_id", cls.id).order("created_at", { ascending: false }),
  ]);
  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <NewAuctionForm items={(items ?? []) as Item[]} />
      <section className="card p-5 self-start">
        <h2 className="font-bold text-navy">경매 목록</h2>
        <ul className="mt-3 space-y-2">
          {((auctions ?? []) as Auction[]).map((a) => (
            <li key={a.id}>
              <Link href={`/teacher/auctions/${a.id}`} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 hover:border-navy">
                <div>
                  <div className="font-semibold">{a.title}</div>
                  <div className="text-xs text-slate-500">{new Date(a.created_at).toLocaleDateString("ko-KR")}</div>
                </div>
                <div className="text-right text-sm">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${a.mode === "real" ? "bg-amber-100 text-amber-800" : "bg-skysoft text-navy"}`}>
                    {MODE_LABEL[a.mode]}
                  </span>
                  <div className="mt-1 text-slate-600">{STATUS_LABEL[a.status]}</div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
