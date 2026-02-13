import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Solar, Lunar } from 'lunar-javascript';
import { Resend } from 'resend'; 

// 1. API 키 설정
const API_KEY = process.env.GEMINI_API_KEY;

// ⚠️ [중요] Resend 초기화를 함수 밖에서 하지 말고 안에서 합니다.
// const resend = new Resend(process.env.RESEND_API_KEY); <--- 이거 지움

export async function POST(req: Request) {
  try {
    // ✅ [Resend 초기화 위치 이동]
    // 여기에 아까 발급받은 're_'로 시작하는 키를 따옴표 안에 직접 붙여넣으세요!
    // 예: new Resend('re_123456789...'); 
    const resend = new Resend('re_DEyjcd2H_PyMNYLfuwtWGhSL1imy2zcZR'); 

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
    
    // 고객 이메일 가져오기
    const userEmail = data.email;

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
        // ✅ AI 분석 중 에러가 나도 서버가 죽지 않도록 try-catch 추가
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

            // ====================================================
            // 📧 [NEW] Resend로 이메일 발송
            // ====================================================
            if (userEmail) {
                const resultLink = `https://www.mythesaju.com/share/${sessionId}`;
                
                try {
                    const emailData = await resend.emails.send({
                        from: 'The Saju Master <hello@mythesaju.com>', 
                        to: [userEmail], 
                        subject: '🔮 [The Saju] Your Premium Destiny Report is Ready!',
                        html: `
                            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                                <h2 style="color: #4F46E5;">Your Saju Analysis is Complete.</h2>
                                <p>You can view your full report by clicking the button below:</p>
                                <br>
                                <a href="${resultLink}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">👉 View My Report</a>
                                <br><br>
                                <p style="font-size: 13px; color: #666;">This link is valid for 30 days. Please save your report.</p>
                            </div>
                        `
                    });
                    console.log(`📧 Resend 이메일 발송 성공: ID ${emailData.data?.id}`);
                } catch (emailError) {
                    console.error("❌ Resend 이메일 발송 실패:", emailError);
                }
            }

        } catch (aiError) {
            console.error("🔥 [AI Analysis Failed]:", aiError);
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

// ... (나머지 calculateSaju, performAIAnalysis 함수들은 기존과 동일하게 유지)
// 여기 아래는 아까 드린 코드 그대로 두시면 됩니다!
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

  // 5. ★★★ 프롬프트 수정: "계절(Season) 기반 정통 사주 논리" ★★★
  const prompt = `
      You are a **Master of Orthodox Korean Saju (Destiny Analysis)**.
      Your analysis must be based on **Seasonality (The Month of Birth)** and **Energy Strength**, not just simple element matching.

      **CLIENTS:**
      1. ${mySaju.englishName} (Gender: ${myData.gender}, Data: ${JSON.stringify(mySaju.pillars)})
      2. ${partnerSaju.englishName} (Gender: ${partnerData.gender}, Data: ${JSON.stringify(partnerSaju.pillars)})

      **🕵️‍♂️ AUTHENTIC SAJU LOGIC (HOW TO CALCULATE):**

      **Logic 1: The "Season" Check (Crucial)**
      - Check the "Month" pillar of Person A.
      - **Born in Winter (Nov, Dec, Jan):** Fire is WEAK and dying. Needs Wood/Fire. **Water is a KILLER (Destructive).**
      - **Born in Summer (May, Jun, Jul):** Fire is STRONG and raging. Needs Water/Metal. **Water is a SAVIOR (Balancing).**
      
      **Logic 2: Fire vs Water Compatibility**
      - IF Person A is **Fire** AND born in **Winter** AND Person B is **Strong Water**:
        -> **VERDICT:** The water extinguishes the weak fire. This is a "Clash" (Soo-Geuk-Hwa).
        -> **SCORE:** Must be low (**30-50**). Explain that B drowns A's energy.
      
      - IF Person A is **Fire** AND born in **Summer** AND Person B is **Water**:
        -> **VERDICT:** The water cools down the heat. This is "Balance" (Jo-Hoo).
        -> **SCORE:** Must be high (**85-99**). Explain that B saves A from burning out.

      **Logic 3: Output Tone**
      - Be accurate and realistic. Do not give false hope if the elemental dynamics are destructive.
      - Use metaphors: "Like a candle in a storm" (Bad) vs "Like rain on a drought" (Good).

      **Categories to Analyze:**
      ${JSON.stringify(categories)}

      **Output JSON Structure:**
      {
        "score": 0,
        "insta_card": {
          "title": "Headline (e.g. Destructive Force OR Perfect Balance)",
          "person_a_emoji": "🔥", "person_a_nature": "Fire",
          "person_b_emoji": "🌊", "person_b_nature": "Water", 
          "hashtags": ["#Saju", "#Chemistry", "#Analysis"],
          "caption": "A summary of the dynamic."
        },
        "elemental_analysis": {
          "balance_title": "Elemental Chemistry",
          "content": "Detailed explanation based on the Season Logic above."
        },
        "analysis_categories": [
           { "icon": "ICON", "title": "TITLE", "content": "Paragraph..." },
           ...
        ]
      }
    `;

  console.log("🚀 [Webhook] Sending request to Gemini...");
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  console.log("✅ Gemini Response received");
  
  // ✅ JSON 파싱 에러 방지 (청소)
  let cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
  cleanText = cleanText.replace(/[\x00-\x09\x0B-\x1F\x7F]/g, "");

  const parsedResult = JSON.parse(cleanText);

  return {
    ...parsedResult,
    saju_chart: { my_info: mySaju, partner_info: partnerSaju }
  };
}

function calculateSaju(data: any) {
  if (!data.birthDate) return null;
  
  // 1. 입력된 날짜 파싱
  let [year, month, day] = data.birthDate.split('-').map(Number);
  let hour = 12; let minute = 0;

  if (!data.unknownTime && data.birthTime) {
    [hour, minute] = data.birthTime.split(':').map(Number);
    
    // 🌍 KST 변환 로직 (정확도 100% 버전)
    const userOffset = parseInt(data.timezone || "9"); 
    const kstOffset = 9;
    
    if (userOffset !== kstOffset) {
      // 한국(9)이 아닌 경우에만 시차만큼 시간을 조절합니다.
      const dateObj = new Date(year, month - 1, day, hour, minute);
      dateObj.setHours(dateObj.getHours() + (kstOffset - userOffset));
      
      // 변환된 '한국 시간'으로 다시 세팅
      year = dateObj.getFullYear();
      month = dateObj.getMonth() + 1;
      day = dateObj.getDate();
      hour = dateObj.getHours();
      minute = dateObj.getMinutes();
    }
  }

  // 3. 변환 완료된 (한국 기준) 시간으로 만세력 생성
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
    stem_hangul: "?",
    stem_meaning: "Unknown",
    stem_element: "unknown",
    branch_hanja: "?",
    branch_hangul: "?",
    branch_meaning: "Unknown",
    branch_element: "unknown",
    position: "Hour",
  };

  return {
    name: fullName,
    englishName: data.firstName,
    gender: data.gender,
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
  const stemData = STEM_MAP[stem] || { hangul: "?", metaphor: "Unknown", element: "Unknown" };
  const branchData = BRANCH_MAP[branch] || { hangul: "?", metaphor: "Unknown", element: "Unknown" };
  return {
    stem_hanja: stem, 
    stem_hangul: stemData.hangul, // ✅ 한글 추가
    stem_meaning: stemData.metaphor, 
    stem_element: stemData.element,
    branch_hanja: branch, 
    branch_hangul: branchData.hangul, // ✅ 한글 추가
    branch_meaning: branchData.metaphor, 
    branch_element: branchData.element,
    position: position
  };
}

// 🛠️ STEM_MAP (천간)
const STEM_MAP: any = {
  "甲": { hangul: "갑", metaphor: "Big Tree", element: "wood" },
  "乙": { hangul: "을", metaphor: "Flower", element: "wood" },
  "丙": { hangul: "병", metaphor: "The Sun", element: "fire" },
  "丁": { hangul: "정", metaphor: "Candle", element: "fire" },
  "戊": { hangul: "무", metaphor: "Mountain", element: "earth" },
  "己": { hangul: "기", metaphor: "Soil", element: "earth" },
  "庚": { hangul: "경", metaphor: "Iron/Rock", element: "metal" },
  "辛": { hangul: "신", metaphor: "Jewelry", element: "metal" },
  "壬": { hangul: "임", metaphor: "Ocean", element: "water" },
  "癸": { hangul: "계", metaphor: "Rain", element: "water" }
};

// 🛠️ BRANCH_MAP (지지)
const BRANCH_MAP: any = {
  "子": { hangul: "자", metaphor: "Rat", element: "water" },
  "丑": { hangul: "축", metaphor: "Ox", element: "earth" },
  "寅": { hangul: "인", metaphor: "Tiger", element: "wood" },
  "卯": { hangul: "묘", metaphor: "Rabbit", element: "wood" },
  "辰": { hangul: "진", metaphor: "Dragon", element: "earth" },
  "巳": { hangul: "사", metaphor: "Snake", element: "fire" },
  "午": { hangul: "오", metaphor: "Horse", element: "fire" },
  "未": { hangul: "미", metaphor: "Goat", element: "earth" },
  "申": { hangul: "신", metaphor: "Monkey", element: "metal" },
  "酉": { hangul: "유", metaphor: "Rooster", element: "metal" },
  "戌": { hangul: "술", metaphor: "Dog", element: "earth" },
  "亥": { hangul: "해", metaphor: "Pig", element: "water" }
};