"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PollingHandler() {
  const router = useRouter();

  useEffect(() => {
    // 3초마다 서버에 "데이터 나왔어?"라고 조용히 물어봅니다.
    const interval = setInterval(() => {
      router.refresh(); 
    }, 3000);

    return () => clearInterval(interval);
  }, [router]);

  return null; // 화면에 보이지는 않지만 배경에서 일하는 컴포넌트
}