import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Solar, Lunar } from 'lunar-javascript';

// 1. API 키 설정
const API_KEY = process.env.GEMINI_API_KEY;

export async function POST(req: Request) {
  try {
    // ✅ [데이터 수신] 검로드 데이터 안전하게 받기
    const rawBody = await req.text();
    const params = new URLSearchParams(rawBody);
    const data: any = {};
    for (const [key, value] of params.entries()) {
      data[key] = value;
    }

    console.log("🚀 [Gumroad Webhook] 전체 데이터 수신:", data);

    // ✅ [ID 찾기] saju_id 우선 탐색
    const sessionId = data.saju_id || 
                      data['custom_fields[saju_id]'] || 
                      data['url_params[saju_id]'] || 
                      data.id;

    if (sessionId) {
      console.log(`🚀 [Gumroad Webhook] 분석 시작: Session ID: ${sessionId}`);
      
      // ✅ [데이터 조회] 접두어(temp_session:) 체크 및 백업 조회
      let tempStore = await kv.get(`temp_session:${sessionId}`);
      if (!tempStore) {
        console.log("⚠️ 접두어 있는 키로 못 찾음. 원본 ID로 재시도...");
        tempStore = await kv.get(sessionId);
      }

      // 문자열이면 JSON으로 변환 (안전장치)
      if (typeof tempStore === 'string') {
        try { tempStore = JSON.parse(tempStore); } catch (e) { console.error("❌ KV JSON 파싱 에러:", e); }
      }

      if (tempStore) {
        // ✅ [핵심 수정] AI 분석 중 에러가 나도 서버가 죽지 않도록 try-catch 추가
        try {
            // 기존 사주 분석 로직 수행
            const analysisResult = await performAIAnalysis(tempStore as any);

            // 분석 결과를 영구 저장
            await kv.set(`report:${sessionId}`, {
                ...analysisResult,
                createdAt: new Date().toISOString(),
                paid: true
            }, { ex: 2592000 }); // 30일 보관

            // 사용 완료된 임시 데이터 삭제
            await kv.del(`temp_session:${sessionId}`);
            await kv.del(sessionId);
            
            console.log(`✅ [Gumroad Webhook] 분석 완료 및 저장 성공: ${sessionId}`);

        } catch (aiError) {
            console.error("🔥 [AI Analysis Failed]:", aiError);
            // AI 실패 시 로그만 남기고 웹훅은 성공 처리 (재시도 방지)
        }
      } else {
         console.error(`❌ [Gumroad Webhook] 만료되었거나 없는 세션입니다: ${sessionId}`);
      }
    } else {
        console.log("⚠️ [Gumroad Webhook] ID 없음 (Ping)");
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("🔥 [Webhook Fatal Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// =========================================================
// 🧠 준수님의 원본 로직 (100% 무삭제 보존 + JSON 에러 해결)
// =========================================================
async function performAIAnalysis(dataFromKV: any) {
  // 키 확인
  if (!API_KEY) throw new Error("API Key not found in server");

  // 데이터 구조 확인
  const { myData, partnerData, relationshipType } = dataFromKV;
  if (!myData || !partnerData) {
    console.error("❌ 데이터 구조 오류:", dataFromKV);
    throw new Error("Missing required saju data (myData or partnerData)");
  }

  // 2. 서버에서 사주 계산 (성별 정보 포함)
  const mySaju = calculateSaju(myData);
  const partnerSaju = calculateSaju(partnerData);

  if (!mySaju || !partnerSaju) throw new Error("Invalid birth data");

  // 3. 구글 AI 부르기
  const genAI = new GoogleGenerativeAI(API_KEY);
  
  // ★★★ 모델 설정 ★★★
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash", 
    generationConfig: { responseMimeType: "application/json" }
  });

  // 4. 관계별 13개 항목 정의 (준수님 원본 그대로 100% 보존)
  let categories: string[] = [];
  if (relationshipType === 'lover') {
    categories = [
      "❤️ Essence & Personality Match", "🔥 Romantic Chemistry & Spark", "🗣️ Communication Flow", 
      "⚡ Conflict Points & Resolution", "🔞 Physical & Intimacy Compatibility", "💰 Financial Synergy & Wealth", 
      "💍 Marriage & Long-term Potential", "👶 Children & Family Planning", "👵 In-Laws & Extended Family", 
      "🤝 Support System (Who gives/receives?)", "🚀 Career & Growth Support", "🧘 Lifestyle & Daily Habits", "✨ Master's Final Verdict"
    ];
  } else if (relationshipType === 'business') {
    categories = [
      "🧠 Brainstorming & Idea Match", "💼 Work Style & Ethics", "🗣️ Communication Efficiency", 
      "⚡ Conflict & Crisis Management", "💰 Profit Generation Synergy", "🚀 Business Growth Potential", 
      "⚖️ Power Dynamics & Leadership", "🤝 Trust & Long-term Loyalty", "⚠️ Risk Tolerance Differences", 
      "📄 Contract & Legal Luck", "🎯 Shared Vision & Goals", "🛠️ Problem Solving Capability", "✨ Master's Strategic Advice"
    ];
  } else if (relationshipType === 'friend') {
    categories = [
      "😎 Core Vibe & First Impression", "🎉 Fun, Hobbies & Interests", "🗣️ Conversation Style", 
      "⚡ Why You Might Argue", "🤝 Trust & Dependability", "✈️ Travel & Adventure Match", 
      "💸 Money Dynamics (Borrowing/Lending)", "🚑 Emotional Support Capacity", "🕒 Friendship Longevity", 
      "🍻 Social Life Compatibility", "🧩 Mutual Growth & Inspiration", "🤐 Secret Keeping Ability", "✨ Master's Friendship Note"
    ];
  } else { // Family
    categories = [
      "🏠 Core Nature & Role in Family", "🗣️ Communication Barriers", "⚡ Triggers for Conflict", 
      "❤️ Emotional Bond & Affection", "👵 Respect, Authority & Hierarchy", "💰 Financial Support & Dependency", 
      "🧬 Past Life & Karmic Ties", "🤝 Mutual Aid & Sacrifice", "🚀 Encouragement for Growth", 
      "🧘 Co-living Compatibility", "🎁 Generosity & Giving Style", "🛡️ Protective Instincts", "✨ Master's Family Healing Advice"
    ];
  }

  // 5. ★★★ 성별 데이터가 반영된 강력한 작가 모드 프롬프트 ★★★
  const prompt = `
      You are a Grand Master of Korean Saju (Destiny Analysis). 
      This is a **PREMIUM PAID CONSULTATION ($50 Value)**. The user expects **deep, emotional, and detailed storytelling**.

      **RELATIONSHIP TYPE:** ${relationshipType.toUpperCase()}
      **CLIENTS:**
      1. ${mySaju.englishName} (Gender: ${myData.gender}, Data: ${JSON.stringify(mySaju.pillars)})
      2. ${partnerSaju.englishName} (Gender: ${partnerData.gender}, Data: ${JSON.stringify(partnerSaju.pillars)})

      **CRITICAL WRITING RULES (DO NOT SKIP):**
      1. **STRICT JSON ONLY:** Do NOT output any markdown, code blocks, or explanations. Output pure JSON.
      2. **NO CONTROL CHARACTERS:** Do NOT use literal newlines inside strings. Use '\\n' for line breaks.
      3. **GENDER REFLECTION:** In Korean Saju, gender dictates the direction of the Life Cycles (Daewun). Use their genders to provide a precise interpretation of their cosmic flow.
      4. **LENGTH & DEPTH:** For EACH category, write **2-3 detailed paragraphs**. Separate paragraphs with a blank line (\\n\\n). Do NOT write short summaries.
      5. **TONE:** Warm, empathetic, mystical, yet logical. Use metaphors like "Just as the ocean embraces the rock...".
      6. **REAL NAMES:** Use "${mySaju.englishName}" and "${partnerSaju.englishName}" constantly. **NEVER** use "Person A" or "Person B".
      7. **NO HANJA:** Do NOT use Chinese characters. English ONLY.
      8. **NO ROMANIZATION:** Do not use "Gap", "Eul", "In", "Myo". Use "Tree", "Flower", "Tiger", "Rabbit".
      9. **LOGIC:** Explain *why* based on their elements and gender-specific energy flow (e.g., "Because ${mySaju.englishName} is strong Metal...").

      **Categories to Analyze:**
      ${JSON.stringify(categories)}

      **Output JSON Structure:**
      {
        "score": 88,
        "insta_card": {
          "title": "Headline (e.g. The Unstoppable Storm & The Calm Anchor)",
          "person_a_emoji": "🌊", "person_a_nature": "Ocean",
          "person_b_emoji": "⛰️", "person_b_nature": "Mountain", 
          "hashtags": ["#Tag1", "#Tag2", "#Tag3"],
          "caption": "A touching 2-sentence summary using their real names."
        },
        "elemental_analysis": {
          "balance_title": "The Core Dynamic",
          "content": "A beautiful, poetic, yet accurate summary of their elemental compatibility (3-4 sentences)."
        },
        "analysis_categories": [
          { "icon": "ICON", "title": "TITLE", "content": "Paragraph 1...\\n\\nParagraph 2..." },
          ... (Make sure there are exactly 13 items)
        ]
      }
    `;

  console.log("🚀 [Webhook] Sending request to Gemini...");
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  console.log("✅ Gemini Response received");
  
  // ✅ [핵심 해결책] 에러를 일으키는 '나쁜 문자'들 청소 (JSON 파싱 에러 방지)
  let cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
  // 제어 문자(줄바꿈 제외) 제거
  cleanText = cleanText.replace(/[\x00-\x09\x0B-\x1F\x7F]/g, "");

  const parsedResult = JSON.parse(cleanText);

  return {
    ...parsedResult,
    saju_chart: { my_info: mySaju, partner_info: partnerSaju }
  };
}

// --- 서버 내부용 헬퍼 함수들 (원본 100% 보존 및 성별 필드 추가) ---
function calculateSaju(data: any) {
  if (!data.birthDate) return null;
  let [year, month, day] = data.birthDate.split('-').map(Number);
  let hour = 12; let minute = 0;

  if (!data.unknownTime && data.birthTime) {
    [hour, minute] = data.birthTime.split(':').map(Number);
    const offset = parseInt(data.timezone);
    const kstOffset = 9;
    const dateObj = new Date(year, month - 1, day, hour, minute);
    dateObj.setHours(dateObj.getHours() + (kstOffset - offset));
    year = dateObj.getFullYear(); month = dateObj.getMonth() + 1; day = dateObj.getDate(); hour = dateObj.getHours();
  }

  const solar = Solar.fromYmdHms(year, month, day, hour, minute, 0);
  const lunar = solar.getLunar();
  const ganji = {
    year: lunar.getYearInGanZhiExact(),
    month: lunar.getMonthInGanZhiExact(),
    day: lunar.getDayInGanZhiExact(),
    time: data.unknownTime ? "?" : lunar.getTimeInGanZhi()
  };

  const fullName = `${data.firstName} ${data.lastName}`.trim();

  const unknownHourPillar = {
    stem_hanja: "?",
    stem_meaning: "Unknown",
    stem_element: "unknown",
    branch_hanja: "?",
    branch_meaning: "Unknown",
    branch_element: "unknown",
    position: "Hour",
  };

  return {
    name: fullName,
    englishName: data.firstName,
    gender: data.gender, // ✅ 성별 정보 보존
    pillars: [
      translatePillar(ganji.year, "Year"),
      translatePillar(ganji.month, "Month"),
      translatePillar(ganji.day, "Day"),
      data.unknownTime ? unknownHourPillar : translatePillar(ganji.time, "Hour"),
    ],
  };
}

function translatePillar(chineseChar: string, position: string) {
  const stem = chineseChar.charAt(0);
  const branch = chineseChar.charAt(1);
  const stemData = STEM_MAP[stem] || { metaphor: "Unknown", element: "Unknown" };
  const branchData = BRANCH_MAP[branch] || { metaphor: "Unknown", element: "Unknown" };
  return {
    stem_hanja: stem, stem_meaning: stemData.metaphor, stem_element: stemData.element,
    branch_hanja: branch, branch_meaning: branchData.metaphor, branch_element: branchData.element,
    position: position
  };
}

const STEM_MAP: any = {
  "甲": { metaphor: "Big Tree", element: "wood" }, "乙": { metaphor: "Flower", element: "wood" },
  "丙": { metaphor: "The Sun", element: "fire" }, "丁": { metaphor: "Candle", element: "fire" },
  "戊": { metaphor: "Mountain", element: "earth" }, "己": { metaphor: "Soil", element: "earth" },
  "庚": { metaphor: "Iron/Rock", element: "metal" }, "辛": { metaphor: "Jewelry", element: "metal" },
  "壬": { metaphor: "Ocean", element: "water" }, "癸": { metaphor: "Rain", element: "water" }
};

const BRANCH_MAP: any = {
  "子": { metaphor: "Rat", element: "water" }, "丑": { metaphor: "Ox", element: "earth" },
  "寅": { metaphor: "Tiger", element: "wood" }, "卯": { metaphor: "Rabbit", element: "wood" },
  "辰": { metaphor: "Dragon", element: "earth" }, "巳": { metaphor: "Snake", element: "fire" },
  "午": { metaphor: "Horse", element: "fire" }, "未": { metaphor: "Goat", element: "earth" },
  "申": { metaphor: "Monkey", element: "metal" }, "酉": { metaphor: "Rooster", element: "metal" },
  "戌": { metaphor: "Dog", element: "earth" }, "亥": { metaphor: "Pig", element: "water" }
};