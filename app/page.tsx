"use client";
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // ★ 페이지 이동 기능 추가
import html2canvas from 'html2canvas'; // 기존 기능 유지
import { Solar, Lunar } from 'lunar-javascript'; // 기존 기능 유지

export default function Home() {
  const router = useRouter(); // ★ 라우터 사용
  const [step, setStep] = useState(1);
  const resultRef = useRef<HTMLDivElement>(null); 

  const [relationshipType, setRelationshipType] = useState('lover'); 
  const [myData, setMyData] = useState({ 
    firstName: '', lastName: '', 
    birthDate: '', birthTime: '', unknownTime: false, timezone: '-5' 
  });
  const [partnerData, setPartnerData] = useState({ 
    firstName: '', lastName: '', 
    birthDate: '', birthTime: '', unknownTime: false, timezone: '-5' 
  });
  
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // 1. 이미지 저장 함수 (삭제 안 함, 유지)
  const downloadResultImage = async () => {
    if (resultRef.current) {
      const canvas = await html2canvas(resultRef.current, { scale: 2, useCORS: true });
      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = "the-saju-result.png";
      link.click();
    }
  };

  // 2. 사주 계산 함수 (삭제 안 함, 유지)
  const calculateSaju = (data: any) => {
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

  // 결제 확인 로직
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.get('paid') === 'true') {
      const savedMyData = localStorage.getItem('myData');
      const savedPartnerData = localStorage.getItem('partnerData');
      const savedRelType = localStorage.getItem('relationshipType');
      
      if (savedMyData && savedPartnerData) {
        setMyData(JSON.parse(savedMyData));
        setPartnerData(JSON.parse(savedPartnerData));
        if(savedRelType) setRelationshipType(savedRelType);

        requestAnalysis(JSON.parse(savedMyData), JSON.parse(savedPartnerData), savedRelType || 'lover');
      } else {
        alert("Session expired. Please enter details again.");
        window.location.href = "/";
      }
    }
  }, []);

  const handlePaymentClick = () => {
    if (!myData.firstName || !partnerData.firstName) {
      alert("Please enter First Names!");
      return;
    }
    
    localStorage.setItem('myData', JSON.stringify(myData));
    localStorage.setItem('partnerData', JSON.stringify(partnerData));
    localStorage.setItem('relationshipType', relationshipType);

    // ★ 실제 출시 시 여기에 Stripe 링크 연결
    // window.location.href = "https://buy.stripe.com/your_link"; 
    requestAnalysis(myData, partnerData, relationshipType);
  };

  // ★★★ 핵심 수정: 서버 요청 후 페이지 이동 ★★★
  const requestAnalysis = async (dataA: any, dataB: any, relType: string) => {
    setLoading(true);
    setStep(2); // 로딩 화면

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          myData: dataA,
          partnerData: dataB,
          relationshipType: relType
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      // ★ 서버가 준 ID(redirectId)가 있으면 결과 페이지로 이동!
      if (data.success && data.redirectId) {
        router.push(`/share/${data.redirectId}`);
      } else {
        throw new Error("No redirect ID returned form server");
      }

    } catch (error: any) {
      console.error(error);
      alert("Error: " + error.message);
      setStep(1); 
    } finally {
      // 페이지 이동이 일어나므로 로딩 해제는 필수가 아니지만 안전하게 처리
      setLoading(false); 
    }
  };

  // 색상 헬퍼 (유지)
  const getElementColor = (element: string) => {
    const el = element ? element.toLowerCase() : "";
    if (el === 'wood') return '#4ade80'; if (el === 'fire') return '#f87171';
    if (el === 'earth') return '#fbbf24'; if (el === 'metal') return '#9ca3af';
    if (el === 'water') return '#60a5fa'; return '#d1d5db';
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fff0f5', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', paddingBottom: '80px', boxSizing: 'border-box' }}>
      
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #ff69b4, #ff8da1)', padding: '30px 20px', textAlign: 'center', color: 'white', borderRadius: '0 0 30px 30px', boxShadow: '0 4px 20px rgba(255,105,180,0.3)' }}>
        <div style={{ fontSize: '36px', marginBottom: '5px' }}>🔮</div>
        <h1 style={{ margin: 0, fontSize: '32px', fontWeight: '900', letterSpacing: '-0.5px' }}>The Saju</h1>
        <p style={{ margin: '8px 0 0', fontSize: '14px', opacity: 0.95, fontWeight: '500' }}>Korean Destiny & Love Chemistry</p>
      </div>

      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '20px', marginTop: '-25px' }}>
        
        {step === 1 && (
          <div>
            <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '20px', marginBottom: '20px', boxShadow: '0 10px 40px rgba(0,0,0,0.08)', border: '1px solid #fff' }}>
              <div style={{fontSize: '11px', fontWeight: 'bold', color: '#ff69b4', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px'}}>Ancient Korean Secret</div>
              <h3 style={{ margin:'0 0 15px 0', color:'#333', fontSize:'22px', lineHeight:'1.3', fontWeight:'800' }}>
                Love is Intuition,<br/>Saju is a Blueprint.
              </h3>
              <div style={{ fontSize: '15px', lineHeight: '1.7', color: '#555' }}>
                <p style={{ marginBottom: '15px' }}>
                  Your story begins at birth. We analyze your <b>Birth Year, Month, Day, and Time</b> using <b>Korean Saju compatibility</b> to map your <b>Five-Element energy</b>—and reveal the hidden dynamics between you two.
                </p>
                <p style={{ marginBottom: '15px' }}>
                  In Korea, <b>fortune telling</b> isn’t guesswork. For generations, people have relied on <b>Korean Saju readings</b> for love, marriage, and life decisions.
                </p>
                <p style={{ margin: 0, fontWeight:'600', color:'#333' }}>
                  We digitized this <b>1,000-year-old framework</b> into a modern, shareable <b>love compatibility report</b>—so you can get a deep reading in minutes. Reveal your match for just <b>$1.00</b>.
                </p>
              </div>
            </div>

            <div style={{ background: 'white', padding: '25px', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{display:'block', fontSize:'11px', fontWeight:'bold', color:'#999', marginBottom:'8px', letterSpacing:'1px', textTransform:'uppercase'}}>Relationship Type</label>
                <select value={relationshipType} onChange={(e) => setRelationshipType(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '2px solid #ff69b4', fontSize: '16px', backgroundColor: '#fff', color: '#333', fontWeight: 'bold' }}>
                  <option value="lover">❤️ Lover / Spouse</option>
                  <option value="friend">👯 Friend / Bestie</option>
                  <option value="family">🏡 Family</option>
                  <option value="business">💼 Business Partner</option>
                </select>
              </div>
              <PersonInput label="YOU" data={myData} setData={setMyData} />
              <div style={{ height: '20px' }}></div>
              <PersonInput label="THE OTHER PERSON" data={partnerData} setData={setPartnerData} />
              
              <div style={{ marginTop: '20px', padding: '12px', backgroundColor: '#f0f9ff', borderRadius: '10px', fontSize: '12px', color: '#0369a1', display: 'flex', gap: '8px', lineHeight:'1.4', border:'1px solid #bce3eb' }}>
                <span style={{fontSize:'16px'}}>🗓️</span>
                <span>
                  <b>Precision matters.</b> We automatically convert your time to the <b>Korean Zodiac calendar (KST)</b> for accuracy.
                </span>
              </div>

              <button onClick={handlePaymentClick} style={buttonStyle}>Reveal Our Destiny ($1.00)</button>
            </div>
          </div>
        )}

        {/* 결제 모달 */}
        {step === 1.5 && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(5px)' }}>
            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '25px', width: '85%', maxWidth: '350px', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.4)', animation: 'popIn 0.3s ease' }}>
              <div style={{ fontSize: '40px', marginBottom: '15px' }}>💎</div>
              <h2 style={{ margin: '0 0 10px 0', color: '#333', fontSize:'20px' }}>Unlock The Future</h2>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '25px', lineHeight:'1.5' }}>Get your <b>Compatibility Score</b> & <b>Premium Analysis</b>.</p>
              <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '12px', marginBottom: '20px', display:'flex', justifyContent:'space-between', alignItems:'center', border:'1px solid #eee' }}>
                <span style={{ fontWeight: 'bold', color: '#333', fontSize:'14px' }}>The Saju Premium Report</span>
                <span style={{ fontWeight: 'bold', color: '#d63384', fontSize:'16px' }}>$1.00</span>
              </div>
              <button onClick={() => handlePaymentClick()} style={{ ...buttonStyle, marginTop: 0, backgroundColor: '#000', color: '#fff', boxShadow:'none', fontSize:'15px' }}> Pay with Apple Pay</button>
              <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: '#999', marginTop: '15px', fontSize: '13px', cursor: 'pointer', fontWeight:'500', textDecoration:'underline' }}>Cancel</button>
            </div>
          </div>
        )}

        {/* 로딩 */}
      {step === 2 && (
        <div style={{ textAlign: 'center', marginTop: '100px', animation: 'pulse 2s infinite' }}>
          <div style={{ fontSize: '60px', marginBottom:'20px' }}>⚡️</div>
          <h2 style={{ color: '#d63384', fontSize:'22px' }}>Connecting Energies...</h2>
          <p style={{ color: '#666', fontSize:'15px' }}>Applying 1000-year-old formula...</p>

          {/* ✅ 안내 문구 추가 */}
          <div
            style={{
              margin: '22px auto 0',
              maxWidth: 360,
              background: '#f0f9ff',
              border: '1px solid #bce3eb',
              borderRadius: 14,
              padding: '14px 14px',
              color: '#0369a1',
              textAlign: 'left',
              lineHeight: 1.45,
              boxShadow: '0 6px 18px rgba(0,0,0,0.06)',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 6 }}>
              Important: Please stay on this page.
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
              Please don’t leave or refresh this page.
            </div>
            <div style={{ fontSize: 12, fontWeight: 700 }}>
              Your premium report is being generated and may take up to 5 minutes.
            </div>
          </div>
        </div>
      )}


        {/* Step 3 (결과 화면)는 삭제되지 않았지만, 리다이렉트 되므로 사실상 안 보입니다. */}
      </div>
      
      <style jsx global>{`
        @keyframes pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.1); opacity: 0.7; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes popIn { 0% { transform: scale(0.9); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}

// ---------------- Helper Components & Styles (삭제된 것 없이 전부 포함) ----------------

const PersonInput = ({ label, data, setData }: any) => (
  <div style={{ marginBottom: '20px' }}>
    <label style={{display:'block', fontSize:'11px', fontWeight:'bold', color:'#999', marginBottom:'8px', letterSpacing:'1px', textTransform:'uppercase'}}>{label}</label>
    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
      <input placeholder="First Name" value={data.firstName} onChange={(e) => setData({...data, firstName: e.target.value})} style={{...inputStyle, flex: 1, minWidth: 0}} />
      <input placeholder="Last Name" value={data.lastName} onChange={(e) => setData({...data, lastName: e.target.value})} style={{...inputStyle, flex: 1, minWidth: 0}} />
    </div>

    {/* ✅ mobile에서도 빈칸처럼 안 보이게: date/time 위에 안내 라벨 추가 */}
    <div style={{ display: 'flex', gap: '8px', marginBottom: '6px', marginTop: '4px' }}>
      <div style={{ flex: 2, minWidth: 0, fontSize: 11, fontWeight: 900, color: '#999', letterSpacing: '0.5px' }}>
        Birth Date
      </div>
      {!data.unknownTime && (
        <div style={{ flex: 1, minWidth: 0, fontSize: 11, fontWeight: 900, color: '#999', letterSpacing: '0.5px' }}>
          Birth Time
        </div>
      )}
    </div>

    <div style={{ display: 'flex', gap: '8px' }}>
      <input
        type="date"
        lang="en-US"
        aria-label="Birth date"
        value={data.birthDate}
        onChange={(e) => setData({...data, birthDate: e.target.value})}
        style={{...inputStyle, flex: 2, minWidth: 0}}
      />
      {!data.unknownTime && (
        <input
          type="time"
          lang="en-US"
          aria-label="Birth time"
          value={data.birthTime}
          onChange={(e) => setData({...data, birthTime: e.target.value})}
          style={{...inputStyle, flex: 1, minWidth: 0}}
        />
      )}
    </div>

    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', alignItems:'center' }}>
      <label style={{ fontSize: '13px', color: '#666', display: 'flex', alignItems: 'center', cursor:'pointer' }}>
        <input type="checkbox" checked={data.unknownTime} onChange={(e) => setData({...data, unknownTime: e.target.checked})} style={{ marginRight: '6px', width:'16px', height:'16px' }} /> Time Unknown
      </label>

      <select value={data.timezone} onChange={(e) => setData({...data, timezone: e.target.value})} style={{ fontSize: '12px', padding: '8px', borderRadius: '8px', border: '1px solid #ddd', color: '#555', backgroundColor:'#fff', maxWidth:'140px' }}>
        <option value="-5">New York (UTC-5)</option><option value="-8">LA (UTC-8)</option><option value="0">London (UTC+0)</option><option value="9">Seoul (UTC+9)</option><option value="1">Paris (UTC+1)</option>
      </select>
    </div>
  </div>
);

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

// 기존 맵 데이터 (삭제 안 함)
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

function PillarChart({ info, getElementColor }: any) {
  const sortedPillars = info.pillars ? [...info.pillars] : []; 
  return (
    <div>
      <div style={{ textAlign:'center', fontWeight:'bold', color:'#333', marginBottom:'8px', fontSize:'14px' }}>{info.name}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
        {['YEAR', 'MONTH', 'DAY', 'HOUR'].map((label) => (
          <div key={label} style={{ textAlign: 'center', fontSize: '10px', color: '#999', fontWeight: 'bold', marginBottom: '5px' }}>{label}</div>
        ))}
        {sortedPillars.map((p: any, i: number) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div style={{ backgroundColor: getElementColor(p.stem_element), color: 'white', padding: '8px 2px', borderRadius: '8px 8px 0 0' }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{p.stem_hanja}</div>
              <div style={{ fontSize: '9px', fontWeight:'500', marginTop:'2px' }}>{p.stem_meaning}</div>
            </div>
            <div style={{ backgroundColor: getElementColor(p.branch_element), color: 'white', padding: '8px 2px', borderRadius: '0 0 8px 8px', opacity: 0.9 }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{p.branch_hanja}</div>
              <div style={{ fontSize: '9px', fontWeight:'500', marginTop:'2px' }}>{p.branch_meaning}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 스타일 정의 (삭제 안 함)
const inputStyle = { padding: '14px', borderRadius: '10px', border: '1px solid #e0e0e0', fontSize: '16px', outline: 'none', backgroundColor:'#fcfcfc', color:'#333', transition: 'border 0.2s' };
const buttonStyle = { width: '100%', padding: '16px', backgroundColor: '#d63384', color: 'white', border: 'none', borderRadius: '15px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px', boxShadow:'0 8px 20px rgba(214, 51, 132, 0.25)', transition: 'transform 0.1s' };
const actionButtonStyle = { width: '100%', padding: '15px', backgroundColor: 'white', color: '#444', border: '1px solid #ddd', borderRadius: '12px', fontSize: '15px', cursor: 'pointer', fontWeight: '600', display:'flex', justifyContent:'center', alignItems:'center', gap:'8px', boxShadow:'0 2px 5px rgba(0,0,0,0.05)' };
