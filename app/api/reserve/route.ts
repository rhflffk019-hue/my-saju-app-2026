// app/api/reserve/route.ts
import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
  try {
    const data = await req.json();

    // 1. 필수 데이터가 있는지 살짝 확인 (안전장치)
    if (!data.myData || !data.partnerData) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    // 2. 고유 세션 ID 생성
    const sessionId = uuidv4(); 

    // 3. 결제 전 24시간 동안 임시 데이터 보관 (temp_session: 접두사 사용)
    await kv.set(`temp_session:${sessionId}`, data, { ex: 86400 });

    console.log(`📡 Session Reserved: ${sessionId}`);

    return NextResponse.json({ sessionId });
  } catch (error) {
    console.error("🔥 Reserve API Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}