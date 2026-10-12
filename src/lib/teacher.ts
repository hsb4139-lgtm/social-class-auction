import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ClassRow } from "@/lib/types";

/** 로그인한 교사와 그 교사의 학급(없으면 null) */
export async function getTeacher() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");
  const { data: cls } = await supabase
    .from("classes")
    .select("id, name, join_code, practice_coins")
    .order("created_at")
    .limit(1)
    .maybeSingle<ClassRow>();
  return { supabase, user: data.user, cls };
}

/** 학급이 꼭 있어야 하는 화면에서 사용 */
export async function requireClass() {
  const t = await getTeacher();
  if (!t.cls) redirect("/teacher");
  return { ...t, cls: t.cls };
}
