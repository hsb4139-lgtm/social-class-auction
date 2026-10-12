import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 p-6">
      <div className="text-center">
        <div className="text-6xl mb-3">🔨</div>
        <h1 className="text-4xl font-extrabold text-navy">우리반 경매장</h1>
        <p className="mt-2 text-slate-600">코인을 모아 원하는 물건을 낙찰받아요</p>
      </div>
      <div className="grid w-full max-w-md grid-cols-2 gap-4">
        <Link href="/s/login" className="card p-6 text-center hover:border-navy">
          <div className="text-4xl">🙋</div>
          <div className="mt-2 text-xl font-bold text-navy">학생</div>
        </Link>
        <Link href="/teacher" className="card p-6 text-center hover:border-navy">
          <div className="text-4xl">🧑‍🏫</div>
          <div className="mt-2 text-xl font-bold text-navy">선생님</div>
        </Link>
      </div>
    </main>
  );
}
