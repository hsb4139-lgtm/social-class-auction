/** 입찰가 분포: 0 ~ scaleMax 축 위에 학생 한 명당 점 하나 (같은 금액은 위로 쌓임) */
export default function BidDots({ bids, scaleMax, big = false }: { bids: number[]; scaleMax: number; big?: boolean }) {
  const max = Math.max(scaleMax, ...bids, 1);
  const stacks = new Map<number, number>();
  const dot = big ? 18 : 10;
  const dots = bids.map((b) => {
    const level = stacks.get(b) ?? 0;
    stacks.set(b, level + 1);
    return { b, level };
  });
  const height = Math.max(...[...stacks.values(), 1]) * (dot + 2) + 8;
  return (
    <div className="w-full">
      <div className="relative w-full" style={{ height }}>
        {dots.map((d, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-navy/70 ring-2 ring-white"
            style={{
              width: dot,
              height: dot,
              left: `calc(${(d.b / max) * 100}% - ${dot / 2}px)`,
              bottom: d.level * (dot + 2),
            }}
            title={`${d.b}코인`}
          />
        ))}
      </div>
      <div className={`flex justify-between border-t-2 border-slate-300 pt-1 text-slate-500 ${big ? "text-xl" : "text-xs"}`}>
        <span>0</span>
        <span>{Math.round(max / 2)}</span>
        <span>{max}코인</span>
      </div>
    </div>
  );
}
