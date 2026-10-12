"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { authAction } from "./actions";

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [state, action, pending] = useActionState(authAction, null);
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form action={action} className="card w-full max-w-sm p-6 space-y-4">
        <Link href="/" className="text-sm text-slate-500">← 처음으로</Link>
        <h1 className="text-2xl font-bold text-navy">선생님 {mode === "signin" ? "로그인" : "가입"}</h1>
        <input type="hidden" name="mode" value={mode} />
        <div>
          <label className="label">이메일</label>
          <input className="input" name="email" type="email" required autoComplete="email" />
        </div>
        <div>
          <label className="label">비밀번호 (6자 이상)</label>
          <input className="input" name="password" type="password" required minLength={6} autoComplete="current-password" />
        </div>
        {state?.message && <p className="text-sm text-rose-600">{state.message}</p>}
        <button className="btn-primary w-full" disabled={pending}>
          {pending ? "잠시만요…" : mode === "signin" ? "로그인" : "가입하기"}
        </button>
        <button type="button" className="w-full text-sm text-slate-500 underline" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>
          {mode === "signin" ? "처음이신가요? 가입하기" : "이미 계정이 있어요"}
        </button>
      </form>
    </main>
  );
}
