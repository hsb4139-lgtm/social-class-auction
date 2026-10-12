"use client";

import { useEffect, useState } from "react";

/** 마감 시각까지 남은 초 (마감 시각이 없으면 null) */
export function useRemaining(closesAt: string | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!closesAt) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [closesAt]);
  if (!closesAt) return null;
  return Math.max(0, Math.floor((new Date(closesAt).getTime() - now) / 1000));
}
