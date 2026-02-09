// app/api/reserve/route.ts
import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
  try {
    const data = await req.json();

    // 1. 필수 데이터 확인
    if (!data.myData || !data.partnerData) {
      console.error("❌ [Reserve] 데이터 누락:", data);
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    // 2. 고유 세션 ID 생성
    const sessionId = uuidv4(); 
    
    // 3. 키 생성 (웹훅과 약속된 'temp_session:' 접두어 사용)
    const storageKey = `temp_session:${sessionId}`;

    // ✅ [핵심 수정] 웹훅에서 파싱하기 좋게 아예 '문자열'로 변환해서 저장합니다.
    // (Vercel KV 특성상 객체로 저장하면 가끔 읽을 때 타입이 꼬일 수 있어서 문자열이 제일 안전합니다)
    await kv.set(storageKey, JSON.stringify(data), { ex: 86400 }); // 24시간 유지

    console.log(`📡 [Reserve] 임시 저장 완료! Key: ${storageKey}`);
    console.log(`🔑 [Reserve] 생성된 Session ID: ${sessionId}`);

    return NextResponse.json({ sessionId });
  } catch (error) {
    console.error("🔥 [Reserve] API Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}