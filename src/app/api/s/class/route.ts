import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/** 학급 코드 → 학급 이름과 번호 목록 (로그인 화면용) */
export async function GET(req: Request) {
  const code = new URL(req.url).searchParams.get("code")?.trim().toUpperCase() ?? "";
  if (code.length !== 6) return NextResponse.json({ error: "학급 코드 6자리를 입력해 주세요" }, { status: 400 });
  const db = createAdminClient();
  const { data: cls } = await db.from("classes").select("id, name").eq("join_code", code).maybeSingle();
  if (!cls) return NextResponse.json({ error: "학급 코드를 다시 확인해 주세요" }, { status: 404 });
  const { data: students } = await db
    .from("students")
    .select("number, name")
    .eq("class_id", cls.id)
    .eq("is_active", true)
    .order("number");
  return NextResponse.json({ className: cls.name, students: students ?? [] });
}
