"use client";
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import html2canvas from 'html2canvas';
import { Solar, Lunar } from 'lunar-javascript';

export default function Home() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const resultRef = useRef<HTMLDivElement>(null); 

  // ✅ 샘플 팝업 상태 관리
  const [showSample, setShowSample] = useState(false);

  const [relationshipType, setRelationshipType] = useState('lover'); 
  const [myData, setMyData] = useState({ 
    firstName: '', lastName: '', gender: '', 
    birthDate: '', birthTime: '', unknownTime: false, timezone: '-5' 
  });
  const [partnerData, setPartnerData] = useState({ 
    firstName: '', lastName: '', gender: '', 
    birthDate: '', birthTime: '', unknownTime: false, timezone: '-5' 
  });
  
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState<any>({
    my: { firstName: false, gender: false, birthDate: false, birthTime: false },
    partner: { firstName: false, gender: false, birthDate: false, birthTime: false }
  });

  // 1. 이미지 저장 함수
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

  // 2. 사주 계산 함수
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

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    
    const urlSajuId = query.get('saju_id');
    const localSajuId = localStorage.getItem('currentSessionId');
    const finalId = urlSajuId || localSajuId;

    if ((query.get('paid') === 'true' || query.get('success') === 'true') && finalId) {
      localStorage.setItem('currentSessionId', finalId);
      router.push(`/share/${finalId}`);
    }
  }, [router]);

  const handlePaymentClick = async () => {
    const newErrors = {
      my: {
        firstName: !myData.firstName,
        gender: !myData.gender,
        birthDate: !myData.birthDate,
        birthTime: !myData.unknownTime && !myData.birthTime
      },
      partner: {
        firstName: !partnerData.firstName,
        gender: !partnerData.gender,
        birthDate: !partnerData.birthDate,
        birthTime: !partnerData.unknownTime && !partnerData.birthTime
      }
    };

    setErrors(newErrors);

    const hasError = 
      newErrors.my.firstName || newErrors.my.gender || newErrors.my.birthDate || newErrors.my.birthTime ||
      newErrors.partner.firstName || newErrors.partner.gender || newErrors.partner.birthDate || newErrors.partner.birthTime;

    if (hasError) {
      window.scrollTo({ top: 150, behavior: 'smooth' });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ myData, partnerData, relationshipType }),
      });
      const { sessionId } = await res.json();
      localStorage.setItem('currentSessionId', sessionId);

      const GUMROAD_PRODUCT_URL = "https://rhflffk.gumroad.com/l/ixxuyp"; 
      const checkoutUrl = `${GUMROAD_PRODUCT_URL}?wanted=true&saju_id=${sessionId}`;
      window.location.href = checkoutUrl;

    } catch (e) {
      console.error(e);
      alert("Payment initialization failed.");
      setLoading(false);
    }
  };

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
        <div style={{ fontSize: '36px', marginBottom: '5px' }}>💗</div>
        <h1 style={{ margin: 0, fontSize: '32px', fontWeight: '900', letterSpacing: '-0.5px' }}>The Saju</h1>
        <p style={{ margin: '8px 0 0', fontSize: '14px', opacity: 0.95, fontWeight: '500' }}>Korean Compatibility Report</p>
      </div>

      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '20px', marginTop: '-25px' }}>
        
        {step === 1 && (
          <div>
            <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '20px', marginBottom: '20px', boxShadow: '0 10px 40px rgba(0,0,0,0.08)', border: '1px solid #fff' }}>
              
              {/* ✅ [수정됨] 마케팅 훅 + 감성 문구의 조화 */}
              <div style={{fontSize: '11px', fontWeight: 'bold', color: '#ff69b4', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px'}}>The Korean Secret to Success</div>
              <h3 style={{ margin:'0 0 15px 0', color:'#333', fontSize:'22px', lineHeight:'1.3', fontWeight:'800' }}>
                Love is Intuition,<br/>Saju is a Blueprint.
              </h3>

              <div style={{ fontSize: '15px', lineHeight: '1.7', color: '#555' }}>
                {/* 1. 가격 앵커링 (강력한 훅) - 원래 문구 아래에 배치하여 설득력 강화 */}
                <p style={{ marginBottom: '15px' }}>
                  In Korea, this isn't just a game. Before marriage or big business deals, people consult a Master. It typically costs <b>$50–$100 per session</b>.
                </p>

                {/* 2. 서비스 가치 설명 */}
                <p style={{ marginBottom: '15px' }}>
                  Why? Because Saju analyzes the <b>energy of your birth time</b> to predict chemistry with scary accuracy. We digitized this premium analysis for you.
                </p>

                {/* ✅ 샘플 보기 버튼 */}
                <button 
                  onClick={() => setShowSample(true)}
                  style={{ width: '100%', padding: '12px', backgroundColor: '#fff', color: '#ff69b4', border: '2px solid #ff69b4', borderRadius: '12px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(255,105,180,0.1)' }}
                >
                  👀 See a Sample Report (13 Chapters)
                </button>

                {/* 3. 가격 제안 */}
                <p style={{ margin: 0, fontWeight:'600', color:'#333' }}>
                  Unlock your full <b>13-chapter compatibility report</b> instantly for just <b>$3.99</b> (Launch Price).
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

              <PersonInput label="YOU" data={myData} setData={setMyData} errorState={errors.my} />
              <div style={{ height: '20px' }}></div>
              <PersonInput label="THE OTHER PERSON" data={partnerData} setData={setPartnerData} errorState={errors.partner} />
              
              <div style={{ marginTop: '20px', padding: '12px', backgroundColor: '#f0f9ff', borderRadius: '10px', fontSize: '12px', color: '#0369a1', display: 'flex', gap: '8px', lineHeight:'1.4', border:'1px solid #bce3eb' }}>
                <span style={{fontSize:'16px'}}>🗓️</span>
                <span>
                  <b>Precision matters.</b> We automatically convert your time to <b>KST</b> for consistent calculations.
                </span>
              </div>

              <button onClick={handlePaymentClick} style={buttonStyle}>
                <div style={{ fontSize: '17px', fontWeight: '900' }}>
                  {loading ? "Checking details..." : "Get My Compatibility Report — $3.99"}
                </div>
                {!loading && (
                  <div style={{ fontSize: '12px', fontWeight: '500', opacity: 0.9, marginTop: '3px' }}>
                    Launch price (Regular $4.99)
                  </div>
                )}
              </button>

              <div style={{ marginTop: '15px', textAlign: 'center', fontSize: '12px', color: '#555', lineHeight: '1.5', padding: '12px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #eee', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                <div style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', marginBottom:'4px'}}>
                  <span style={{ fontSize: '14px' }}>⚡️</span>
                  <b style={{color:'#333', fontSize:'13px'}}>Instant Access + Email Backup</b>
                </div>
                Your report opens <b>automatically</b> here after payment.<br/>
                <span style={{color:'#888', fontSize:'11px'}}>(We also email a copy for safekeeping)</span>
              </div>

              {!loading && (
                <div style={{ textAlign: 'center', marginTop: '15px' }}>
                  <div style={{ fontSize: '11px', color: '#ff69b4', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Limited-time launch offer ends Feb 28.
                  </div>
                  <div style={{ fontSize: '10px', color: '#999', marginTop: '4px', fontWeight: '500' }}>
                    Delivered instantly after payment • Secure checkout
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 결제 모달 (Step 1.5) */}
        {step === 1.5 && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(5px)' }}>
            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '25px', width: '85%', maxWidth: '350px', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.4)', animation: 'popIn 0.3s ease' }}>
              <div style={{ fontSize: '40px', marginBottom: '15px' }}>💎</div>
              <h2 style={{ margin: '0 0 10px 0', color: '#333', fontSize:'20px' }}>Get Your Full Report</h2>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '25px', lineHeight:'1.5' }}>Generate your <b>Compatibility Score</b> & <b>Premium Analysis</b>.</p>
              <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '12px', marginBottom: '20px', display:'flex', justifyContent:'space-between', alignItems:'center', border:'1px solid #eee' }}>
                <span style={{ fontWeight: 'bold', color: '#333', fontSize:'14px' }}>Launch Offer</span>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 'bold', color: '#d63384', fontSize:'18px' }}>$3.99</div>
                  <div style={{ fontSize: '10px', color: '#999', textDecoration: 'line-through' }}>Regular $4.99</div>
                </div>
              </div>
              <button onClick={() => handlePaymentClick()} style={{ ...buttonStyle, marginTop: 0, backgroundColor: '#000', color: '#fff', boxShadow:'none', fontSize:'15px' }}> Pay with Apple Pay</button>
              <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: '#999', marginTop: '15px', fontSize: '13px', cursor: 'pointer', fontWeight:'500', textDecoration:'underline' }}>Cancel</button>
            </div>
          </div>
        )}

        {/* 로딩 화면 */}
        {step === 2 && (
          <div style={{ textAlign: 'center', marginTop: '100px', animation: 'pulse 2s infinite' }}>
            <div style={{ fontSize: '60px', marginBottom:'20px' }}>⚡️</div>
            <h2 style={{ color: '#d63384', fontSize:'22px' }}>Generating Your Report...</h2>
            <p style={{ color: '#666', fontSize:'15px' }}>Running the compatibility calculation...</p>

            <div style={{ margin: '22px auto 0', maxWidth: 360, background: '#f0f9ff', border: '1px solid #bce3eb', borderRadius: 14, padding: '14px 14px', color: '#0369a1', textAlign: 'left', lineHeight: 1.45, boxShadow: '0 6px 18px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 6 }}>Important: Please stay on this page.</div>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Please don’t leave or refresh this page.</div>
              <div style={{ fontSize: 12, fontWeight: 700 }}>
                Your premium report is being generated automatically.<br/>
                It may take up to 3 minutes.
              </div>
              <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #bce3eb', fontSize: 12, fontWeight: 500, color: '#0284c7' }}>
                 📧 <b>Don't worry!</b> A permanent link to the result will also be sent to your email.
              </div>
            </div>
          </div>
        )}

        {/* ✅ 샘플 팝업 모달 (모바일 최적화 수정) */}
        {showSample && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px', backdropFilter: 'blur(5px)' }}>
            <div style={{ width: '100%', maxWidth: '480px', display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
              <button 
                onClick={() => setShowSample(false)} 
                style={{ backgroundColor: '#fff', border: 'none', borderRadius: '50%', width: '32px', height: '32px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >✕</button>
            </div>
            <div style={{ width: '100%', maxWidth: '480px', height: '85vh', backgroundColor: '#fff', borderRadius: '20px', overflow: 'hidden', position: 'relative', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
              <iframe 
                src="https://www.mythesaju.com/share/0182d432-1396-4de4-9000-bdeb57f72ed9" 
                style={{ width: '100%', height: '100%', border: 'none' }}
                title="Sample Report Preview"
              />
            </div>
            <p style={{ color: '#fff', marginTop: '10px', fontSize: '13px', fontWeight: '500', opacity: 0.8 }}>Close to start your own analysis</p>
          </div>
        )}

        {/* Footer */}
        <footer style={{ marginTop: '50px', padding: '30px 20px', textAlign: 'center', borderTop: '1px solid #ffe4ef' }}>
          <div style={{ marginBottom: '15px' }}>
            <a href="/privacy" style={footerLinkStyle}>Privacy Policy</a>
            <span style={{ margin: '0 10px', color: '#ccc' }}>|</span>
            <a href="/terms" style={footerLinkStyle}>Terms of Service</a>
          </div>
          <div style={{ fontSize: '13px', color: '#999', lineHeight: '1.6' }}>
            <p style={{ margin: '5px 0' }}>Support: <a href="mailto:mythesaju@gmail.com" style={{ color: '#ff69b4', textDecoration: 'none' }}>mythesaju@gmail.com</a></p>
            <p style={{ margin: '5px 0' }}>© 2026 The Saju. All rights reserved.</p>
            <p style={{ fontSize: '11px', marginTop: '10px', opacity: 0.8 }}>This service is for entertainment purposes only.</p>
          </div>
        </footer>

      </div>
      
      <style jsx global>{`
        @keyframes pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.1); opacity: 0.7; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes popIn { 0% { transform: scale(0.9); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}

// ---------------- Helper Components ----------------

const PersonInput = ({ label, data, setData, errorState }: any) => (
  <div style={{ marginBottom: '20px' }}>
    <label style={{display:'block', fontSize:'11px', fontWeight:'bold', color:'#999', marginBottom:'8px', letterSpacing:'1px', textTransform:'uppercase'}}>{label}</label>
    
    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
      <button 
        onClick={() => setData({...data, gender: 'male'})}
        style={{
          flex: 1, padding: '12px', borderRadius: '10px', border: data.gender === 'male' ? '2px solid #ff69b4' : '1px solid #e0e0e0',
          backgroundColor: data.gender === 'male' ? '#fff0f5' : '#fcfcfc', color: data.gender === 'male' ? '#ff69b4' : '#666',
          fontSize: '14px', fontWeight: 'bold', cursor: 'pointer'
        }}
      >♂ Male</button>
      <button 
        onClick={() => setData({...data, gender: 'female'})}
        style={{
          flex: 1, padding: '12px', borderRadius: '10px', border: data.gender === 'female' ? '2px solid #ff69b4' : '1px solid #e0e0e0',
          backgroundColor: data.gender === 'female' ? '#fff0f5' : '#fcfcfc', color: data.gender === 'female' ? '#ff69b4' : '#666',
          fontSize: '14px', fontWeight: 'bold', cursor: 'pointer'
        }}
      >♀ Female</button>
    </div>
    {errorState.gender && <div style={errorTextStyle}>⚠️ Please select gender.</div>}

    <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
      <input 
        placeholder="First Name" 
        value={data.firstName} 
        onChange={(e) => setData({...data, firstName: e.target.value})} 
        style={{...inputStyle, flex: 1, minWidth: 0, borderColor: errorState.firstName ? '#ff4d4d' : '#e0e0e0'}} 
      />
      <input placeholder="Last Name" value={data.lastName} onChange={(e) => setData({...data, lastName: e.target.value})} style={{...inputStyle, flex: 1, minWidth: 0}} />
    </div>
    {errorState.firstName && <div style={errorTextStyle}>⚠️ First name is required.</div>}

    <div style={{ display: 'flex', gap: '8px', marginBottom: '6px', marginTop: '4px' }}>
      <div style={{ flex: 2, minWidth: 0, fontSize: 11, fontWeight: 900, color: '#999', letterSpacing: '0.5px' }}>Birth Date</div>
      {!data.unknownTime && <div style={{ flex: 1, minWidth: 0, fontSize: 11, fontWeight: 900, color: '#999', letterSpacing: '0.5px' }}>Birth Time</div>}
    </div>

    <div style={{ display: 'flex', gap: '8px' }}>
      <input
        type="date"
        lang="en-US"
        aria-label="Birth date"
        value={data.birthDate}
        onChange={(e) => setData({...data, birthDate: e.target.value})}
        style={{...inputStyle, flex: 2, minWidth: 0, borderColor: errorState.birthDate ? '#ff4d4d' : '#e0e0e0'}}
      />
      {!data.unknownTime && (
        <input
          type="time"
          lang="en-US"
          aria-label="Birth time"
          value={data.birthTime}
          onChange={(e) => setData({...data, birthTime: e.target.value})}
          style={{...inputStyle, flex: 1, minWidth: 0, borderColor: errorState.birthTime ? '#ff4d4d' : '#e0e0e0'}}
        />
      )}
    </div>
    {errorState.birthDate && <div style={errorTextStyle}>⚠️ Please enter birth date.</div>}
    {errorState.birthTime && !data.unknownTime && (
      <div style={errorTextStyle}>
        ⚠️ Enter time OR check "Time Unknown".
      </div>
    )}

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
    stem_han_ja: stem, stem_meaning: stemData.metaphor, stem_element: stemData.element,
    branch_han_ja: branch, branch_meaning: branchData.metaphor, branch_element: branchData.element,
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

const inputStyle = { padding: '14px', borderRadius: '10px', border: '1px solid #e0e0e0', fontSize: '16px', outline: 'none', backgroundColor:'#fcfcfc', color:'#333', transition: 'border 0.2s' };
const buttonStyle = { width: '100%', padding: '16px', backgroundColor: '#d63384', color: 'white', border: 'none', borderRadius: '15px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px', boxShadow:'0 8px 20px rgba(214, 51, 132, 0.25)', transition: 'transform 0.1s' };
const errorTextStyle = { color: '#ff4d4d', fontSize: '11px', marginTop: '4px', fontWeight: '600' as const };
const footerLinkStyle = { fontSize: '13px', color: '#666', textDecoration: 'none', fontWeight: '500' as const };