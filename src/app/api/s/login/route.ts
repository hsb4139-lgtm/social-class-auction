import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createAdminClient } from "@/lib/supabase/admin";
import { setStudentSession } from "@/lib/student-session";

export async function POST(req: Request) {
  const { code, number, pin } = (await req.json()) as { code?: string; number?: number; pin?: string };
  const db = createAdminClient();
  const { data: cls } = await db.from("classes").select("id").eq("join_code", String(code ?? "").toUpperCase()).maybeSingle();
  if (!cls) return NextResponse.json({ error: "학급 코드를 다시 확인해 주세요" }, { status: 404 });
  const { data: s } = await db
    .from("students")
    .select("id, pin_hash, failed_attempts, locked_until, is_active")
    .eq("class_id", cls.id)
    .eq("number", Number(number))
    .maybeSingle();
  if (!s || !s.is_active) return NextResponse.json({ error: "번호를 다시 골라 주세요" }, { status: 404 });

  if (s.locked_until && new Date(s.locked_until).getTime() > Date.now()) {
    return NextResponse.json({ error: "PIN을 여러 번 틀렸어요. 1분 뒤에 다시 해 보세요." }, { status: 429 });
  }
  if (!bcrypt.compareSync(String(pin ?? ""), s.pin_hash)) {
    const fails = (s.failed_attempts ?? 0) + 1;
    await db
      .from("students")
      .update(fails >= 5 ? { failed_attempts: 0, locked_until: new Date(Date.now() + 60_000).toISOString() } : { failed_attempts: fails })
      .eq("id", s.id);
    return NextResponse.json({ error: fails >= 5 ? "PIN을 5번 틀렸어요. 1분 뒤에 다시 해 보세요." : "PIN이 맞지 않아요" }, { status: 401 });
  }
  await db.from("students").update({ failed_attempts: 0, locked_until: null }).eq("id", s.id);
  await setStudentSession({ sid: s.id, cid: cls.id });
  return NextResponse.json({ ok: true });
}
