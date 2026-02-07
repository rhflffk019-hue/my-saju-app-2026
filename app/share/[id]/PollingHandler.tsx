"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * PollingHandler
 * - 하드 새로고침(meta refresh / location.reload) 대신
 * - Next.js App Router의 router.refresh()로 "조용히" 서버컴포넌트 재호출
 * - 결과가 생기면 (data가 생겨서) 로딩 화면이 사라지고 이 컴포넌트도 unmount됨
 */
export default function PollingHandler({
  intervalMs = 7000,
  maxMinutes = 4,
}: {
  intervalMs?: number;
  maxMinutes?: number;
}) {
  const router = useRouter();
  const startedAt = useRef<number>(Date.now());
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const tick = () => {
      // 탭이 백그라운드면 불필요한 polling 줄이기
      if (typeof document !== "undefined" && document.hidden) return;

      const elapsed = Date.now() - startedAt.current;
      const maxMs = maxMinutes * 60 * 1000;

      // 너무 오래 돌면 stop (원하면 maxMinutes 조절)
      if (elapsed > maxMs) {
        if (timerRef.current) window.clearInterval(timerRef.current);
        timerRef.current = null;
        return;
      }

      // ✅ 서버 컴포넌트 재호출 (soft refresh)
      router.refresh();
    };

    timerRef.current = window.setInterval(tick, intervalMs);

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [router, intervalMs, maxMinutes]);

  return null;
}
