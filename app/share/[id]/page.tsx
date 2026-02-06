export const dynamic = 'force-dynamic';

import { kv } from '@vercel/kv';
import { notFound } from 'next/navigation';

export default async function SharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // ★ 중요: 저장할 때 'report:'를 붙였으므로, 찾을 때도 똑같이 붙여야 합니다!
  const reportKey = `report:${id}`;
  const data = await kv.get<any>(reportKey);

  if (!data) {
    console.log("데이터를 찾지 못함:", reportKey);
    return notFound();
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <div className="w-full max-w-3xl p-8 bg-white shadow-xl rounded-2xl">
        {/* 인스타 카드 섹션 */}
        <div className="text-center mb-8 p-6 bg-purple-50 rounded-xl">
          <div className="text-6xl mb-4">
            {data.insta_card?.person_a_emoji} {data.insta_card?.person_b_emoji}
          </div>
          <h1 className="text-4xl font-bold text-purple-800 mb-2">궁합 점수: {data.score}점</h1>
          <p className="text-gray-600 italic">"{data.insta_card?.caption}"</p>
        </div>

        {/* 상세 분석 카테고리들 주르륵 출력 */}
        <div className="space-y-8">
          {data.analysis_categories?.map((cat: any, index: number) => (
            <div key={index} className="border-b pb-6">
              <h2 className="text-2xl font-semibold mb-3 flex items-center">
                <span className="mr-2">{cat.icon}</span> {cat.title}
              </h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{cat.content}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <a href="/" className="inline-block px-8 py-4 bg-purple-600 text-white font-bold rounded-full hover:bg-purple-700 transition shadow-lg">
            나도 사주 보기 🔮
          </a>
        </div>
      </div>
    </div>
  );
}