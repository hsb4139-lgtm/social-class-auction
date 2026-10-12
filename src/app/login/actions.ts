"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function authAction(_prev: { message: string } | null, formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const mode = String(formData.get("mode") || "signin");
  const supabase = await createClient();
  if (mode === "signup") {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { message: error.message };
    if (!data.session) return { message: "가입 확인 메일을 보냈어요. 메일의 링크를 누른 뒤 로그인해 주세요." };
  } else {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { message: "이메일 또는 비밀번호가 맞지 않아요." };
  }
  redirect("/teacher");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
