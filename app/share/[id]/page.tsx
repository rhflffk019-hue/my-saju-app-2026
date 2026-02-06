export const dynamic = 'force-dynamic';

import { kv } from '@vercel/kv';
import { notFound } from 'next/navigation';

// params를 Promise로 받도록 수정
export default async function SharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; // ★ await 추가
  
  // KV 저장소에서 분석 결과 가져오기
  const result = await kv.get<{ result: string }>(id);

  if (!result) {
    return notFound();
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <div className="w-full max-w-2xl p-8 bg-white shadow-xl rounded-2xl">
        <h1 className="text-3xl font-bold mb-6 text-center text-purple-700">🔮 사주 분석 결과</h1>
        <div className="whitespace-pre-wrap leading-relaxed text-gray-800 text-lg">
          {result.result}
        </div>
        <div className="mt-8 text-center">
          <a href="/" className="inline-block px-6 py-3 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition">
            다시 분석하기
          </a>
        </div>
      </div>
    </div>
  );
}