import { NextResponse } from "next/server";
import { getStudentSession } from "@/lib/student-session";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const s = await getStudentSession();
  if (!s) return NextResponse.json({ error: "다시 로그인해 주세요" }, { status: 401 });
  const { lotId, amount } = (await req.json()) as { lotId?: string; amount?: number };
  const { error } = await createAdminClient().rpc("place_bid", {
    p_student: s.sid,
    p_lot: lotId,
    p_amount: Math.trunc(Number(amount) || 0),
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
