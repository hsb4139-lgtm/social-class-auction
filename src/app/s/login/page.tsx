"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type S = { number: number; name: string };

export default function StudentLogin() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [cls, setCls] = useState<{ className: string; students: S[] } | null>(null);
  const [picked, setPicked] = useState<S | null>(null);
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const lookup = async (c: string) => {
    setErr("");
    setBusy(true);
    const res = await fetch(`/api/s/class?code=${encodeURIComponent(c)}`);
    const json = await res.json();
    setBusy(false);
    if (!res.ok) return setErr(json.error);
    try { localStorage.setItem("auction_code", c.toUpperCase()); } catch {}
    setCls(json);
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem("auction_code");
      if (saved) { setCode(saved); lookup(saved); }
    } catch {}
  }, []);

  const login = async (fullPin: string) => {
    setBusy(true);
    const res = await fetch("/api/s/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code, number: picked?.number, pin: fullPin }),
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) { setErr(json.error); setPin(""); return; }
    router.replace("/s");
  };
  const press = (d: string) => {
    if (busy) return;
    const next = (pin + d).slice(0, 4);
    setPin(next);
    setErr("");
    if (next.length === 4) login(next);
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col p-5">
      <Link href="/" className="text-sm text-slate-500">← 처음으로</Link>
      <h1 className="mt-4 text-3xl font-extrabold text-navy">🔨 우리반 경매장</h1>

      {!cls && (
        <div className="card mt-6 space-y-4 p-6">
          <label className="label text-lg">학급 코드 6자리</label>
          <input
            className="input text-center font-mono text-3xl tracking-[0.4em] uppercase"
            value={code}
            maxLength={6}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            autoFocus
          />
          {err && <p className="text-rose-600">{err}</p>}
          <button className="btn-primary w-full py-3 text-lg" disabled={code.length !== 6 || busy} onClick={() => lookup(code)}>
            다음
          </button>
        </div>
      )}

      {cls && !picked && (
        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-bold">{cls.className} · 내 번호를 눌러요</h2>
            <button className="text-sm text-slate-500 underline" onClick={() => { setCls(null); try { localStorage.removeItem("auction_code"); } catch {} }}>
              학급 바꾸기
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
            {cls.students.map((s) => (
              <button key={s.number} className="card py-3 text-center hover:border-navy" onClick={() => setPicked(s)}>
                <div className="text-2xl font-extrabold text-navy">{s.number}</div>
                <div className="truncate text-sm">{s.name}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {cls && picked && (
        <div className="card mt-6 p-6 text-center">
          <div className="text-xl font-bold">{picked.number}번 {picked.name}</div>
          <div className="mt-1 text-slate-500">PIN 4자리를 눌러요</div>
          <div className="my-5 flex justify-center gap-3">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className={`h-5 w-5 rounded-full ${i < pin.length ? "bg-navy" : "bg-slate-200"}`} />
            ))}
          </div>
          {err && <p className="mb-3 text-rose-600">{err}</p>}
          <div className="mx-auto grid max-w-xs grid-cols-3 gap-3">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
              <button key={d} className="btn-soft py-4 text-2xl" onClick={() => press(d)}>{d}</button>
            ))}
            <button className="btn py-4 text-slate-500" onClick={() => { setPicked(null); setPin(""); setErr(""); }}>번호</button>
            <button className="btn-soft py-4 text-2xl" onClick={() => press("0")}>0</button>
            <button className="btn py-4 text-slate-500" onClick={() => setPin(pin.slice(0, -1))}>⌫</button>
          </div>
        </div>
      )}
    </main>
  );
}
