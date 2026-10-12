import Link from "next/link";
import { getTeacher } from "@/lib/teacher";
import { signOut } from "@/app/login/actions";

const NAV = [
  { href: "/teacher", label: "대시보드" },
  { href: "/teacher/students", label: "학생" },
  { href: "/teacher/coins", label: "코인" },
  { href: "/teacher/items", label: "물건" },
  { href: "/teacher/auctions", label: "경매" },
  { href: "/teacher/records", label: "기록" },
];

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const { cls } = await getTeacher();
  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-5xl px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2">
          <Link href="/teacher" className="text-lg font-extrabold text-navy">🔨 우리반 경매장</Link>
          {cls && (
            <nav className="flex flex-wrap gap-1 text-sm">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} className="rounded-lg px-3 py-1.5 font-semibold text-slate-600 hover:bg-skysoft hover:text-navy">
                  {n.label}
                </Link>
              ))}
            </nav>
          )}
          <div className="ml-auto flex items-center gap-3 text-sm">
            {cls && (
              <span className="text-slate-500">
                {cls.name} · 학급 코드 <b className="font-mono text-navy">{cls.join_code}</b>
              </span>
            )}
            <form action={signOut}>
              <button className="text-slate-400 hover:text-slate-700">로그아웃</button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
