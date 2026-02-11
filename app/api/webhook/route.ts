import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Solar, Lunar } from 'lunar-javascript';
import { Resend } from 'resend'; // ✅ Nodemailer 대신 Resend 사용

// 1. API 키 설정
const API_KEY = process.env.GEMINI_API_KEY;
// ✅ Resend 초기화 (Vercel 환경변수에 RESEND_API_KEY 추가 필수)
const resend = new Resend(process.env.RESEND_API_KEY); 

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
            // 📧 [NEW] Resend로 이메일 발송 (안정성 100%)
            // ====================================================
            if (userEmail) {
                const resultLink = `https://www.mythesaju.com/share/${sessionId}`;
                
                try {
                    // ✅ 보내는 사람을 인증된 도메인 주소로 설정
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

// =========================================================
// 🧠 AI 분석 로직 (프롬프트: 조후/억부 적용 & 점수 변별력 강화) - 기존 유지
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

  // 5. ★★★ 프롬프트 수정: "진짜 사주 논리(조후/억부)" 적용 ★★★
  const prompt = `
      You are a **True Master of Korean Saju (Destiny Analysis)**.
      Your goal is to evaluate the **chemical reaction** between two people, not just compare their Day Masters.

      **CLIENTS:**
      1. ${mySaju.englishName} (Gender: ${myData.gender}, Data: ${JSON.stringify(mySaju.pillars)})
      2. ${partnerSaju.englishName} (Gender: ${partnerData.gender}, Data: ${JSON.stringify(partnerSaju.pillars)})

      **🕵️‍♂️ DEEP ANALYSIS LOGIC (THINK BEFORE SCORING):**
      
      **Step 1: Analyze Individual Strength (Wang-Soe & Temperature)**
      - Is Person A's chart too Hot (Fire/Summer)? Then they NEED Water/Metal.
      - Is Person A's chart too Cold (Water/Winter)? Then they NEED Fire/Earth.
      - Is Person A's Day Master too Weak? They need support (Mother element).
      - Is Person A's Day Master too Strong? They need to release energy (Output element).

      **Step 2: Check Compatibility (The Chemistry)**
      - **Good Match (80-100):** Person B HAS what Person A LACKS. (e.g., A is hot/dry, B is cool/wet). The balance is restored.
      - **Bad Match (30-50):** Person B makes Person A's problems WORSE. (e.g., A is already freezing, B brings more ice/snow). The imbalance is amplified.
      - **Average Match (55-75):** Neutral interaction. No major harm, no major help.

      **Step 3: Determine the Score**
      - Do NOT stay in the safe zone (60-70).
      - If the "Chemistry" is bad (Step 2), be brave and give **35-48**.
      - If the "Chemistry" is perfect, give **90-98**.
      - **CRITICAL:** Use the *Full Range* (30 to 100) based on the logic above.

      **CRITICAL WRITING RULES (FOR WESTERN AUDIENCE):**
      1. **METAPHORS ONLY:** Do not say "You need Fire." Say "You are like a frozen lake, and ${partnerSaju.englishName} acts as the warm Sun that melts the ice."
      2. **BE SPECIFIC:** Explain WHY the score is low or high based on this "filling the void" concept.
      3. **NO HANJA:** English ONLY. Use "The Sun", "The Ocean", "The Mountain", etc.

      **Categories to Analyze:**
      ${JSON.stringify(categories)}

      **Output JSON Structure:**
      {
        "score": 0,
        "insta_card": {
          "title": "Headline (e.g. The Perfect Balance)",
          "person_a_emoji": "🔥", "person_a_nature": "Fire",
          "person_b_emoji": "💧", "person_b_nature": "Water", 
          "hashtags": ["#Complementary", "#Healing", "#Destiny"],
          "caption": "A summary of their dynamic."
        },
        "elemental_analysis": {
          "balance_title": "Elemental Chemistry",
          "content": "Detailed explanation of how they balance (or imbalance) each other."
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