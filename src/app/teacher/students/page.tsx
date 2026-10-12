import { requireClass } from "@/lib/teacher";
import StudentsClient from "./StudentsClient";
import type { Student } from "@/lib/types";

export default async function StudentsPage() {
  const { supabase, cls } = await requireClass();
  const { data } = await supabase.from("students").select("id, class_id, number, name, is_active").eq("class_id", cls.id).order("number");
  return <StudentsClient students={(data ?? []) as Student[]} code={cls.join_code} />;
}
