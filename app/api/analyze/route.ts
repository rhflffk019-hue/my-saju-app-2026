import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Solar, Lunar } from 'lunar-javascript';
import { kv } from '@vercel/kv'; // ★ 추가됨: 저장소
import { v4 as uuidv4 } from 'uuid'; // ★ 추가됨: 고유번호 생성기

// 1. 금고에서 키 꺼내기
const API_KEY = process.env.GEMINI_API_KEY;

export async function POST(request: Request) {
  try {
    // 키 확인 (로그)
    console.log("🔑 API Key Status:", API_KEY ? "Loaded" : "Missing");
    
    if (!API_KEY) {
      return NextResponse.json({ error: "API Key not found in server" }, { status: 500 });
    }

    const body = await request.json();
    const { myData, partnerData, relationshipType } = body;

    // 2. 서버에서 사주 계산 (로직 보호)
    const mySaju = calculateSaju(myData);
    const partnerSaju = calculateSaju(partnerData);

    if (!mySaju || !partnerSaju) {
      return NextResponse.json({ error: "Invalid birth data" }, { status: 400 });
    }

    // 3. 구글 AI 부르기
    const genAI = new GoogleGenerativeAI(API_KEY);
    
    // ★★★ 모델 설정 (유료 계정이면 1.5-pro 추천) ★★★
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash", 
      generationConfig: { responseMimeType: "application/json" }
    });

    // 4. 관계별 13개 항목 정의 (기존 내용 유지)
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

    // 5. ★★★ 강력한 작가 모드 프롬프트 (기존 내용 유지) ★★★
    const prompt = `
      You are a Grand Master of Korean Saju (Destiny Analysis). 
      This is a **PREMIUM PAID CONSULTATION ($50 Value)**. The user expects **deep, emotional, and detailed storytelling**.

      **RELATIONSHIP TYPE:** ${relationshipType.toUpperCase()}
      **CLIENTS:**
      1. ${mySaju.englishName} (Data: ${JSON.stringify(mySaju.pillars)})
      2. ${partnerSaju.englishName} (Data: ${JSON.stringify(partnerSaju.pillars)})

      **CRITICAL WRITING RULES (DO NOT SKIP):**
      1. **LENGTH & DEPTH:** For EACH category, write **2-3 detailed paragraphs**. Separate paragraphs with a blank line (\\n\\n). Do NOT write short summaries.
      2. **TONE:** Warm, empathetic, mystical, yet logical. Use metaphors like "Just as the ocean embraces the rock...".
      3. **REAL NAMES:** Use "${mySaju.englishName}" and "${partnerSaju.englishName}" constantly. **NEVER** use "Person A" or "Person B".
      4. **NO HANJA:** Do NOT use Chinese characters. English ONLY.
      5. **NO ROMANIZATION:** Do not use "Gap", "Eul", "In", "Myo". Use "Tree", "Flower", "Tiger", "Rabbit".
      6. **LOGIC:** Explain *why* based on their elements (e.g., "Because ${mySaju.englishName} is strong Metal...").

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

    console.log("🚀 Sending request to Gemini...");
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    console.log("✅ Gemini Response received");
    
    const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsedResult = JSON.parse(cleanText);

    // ★★★ [새로 추가된 부분] 결과를 저장소(KV)에 저장하고 ID 발급 ★★★
    const resultId = uuidv4(); // 고유 ID 생성 (예: "a1b2-c3d4...")
    
    // Vercel KV에 데이터 저장 (유효기간 30일: 60*60*24*30 초)
    await kv.set(`report:${resultId}`, {
      ...parsedResult,
      saju_chart: { my_info: mySaju, partner_info: partnerSaju },
      createdAt: new Date().toISOString()
    }, { ex: 2592000 }); // 30일 후 자동 삭제 (서버 용량 관리)

    console.log(`💾 Report Saved! ID: ${resultId}`);

    // ★ 프론트엔드에 "성공! 이 ID로 이동하세요" 라고 응답
    return NextResponse.json({ 
      success: true, 
      redirectId: resultId 
    });

  } catch (error: any) {
    console.error("🔥 FATAL API ERROR:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

// --- 서버 내부용 헬퍼 함수들 (기존 그대로 유지) ---
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

  return {
    name: fullName,
    englishName: data.firstName, 
    pillars: [
      translatePillar(ganji.year, 'Year'),
      translatePillar(ganji.month, 'Month'),
      translatePillar(ganji.day, 'Day'),
      data.unknownTime ? { hanja: "?", meaning: "Unknown", element: "Unknown", position: "Hour" } : translatePillar(ganji.time, 'Hour')
    ]
  };
};

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