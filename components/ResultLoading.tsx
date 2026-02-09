"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// 무작위 팁 데이터
const SAJU_TIPS = [
  "In Saju, your 'Day Master' represents your core essence.",
  "The Four Pillars map not just your personality, but your life's seasons.",
  "Balance between the Five Elements brings true harmony.",
  "Your birth hour reveals your hidden internal world.",
  "Saju is not a fixed fate, but a weather forecast for your journey.",
];

export default function ResultLoading() {
  const router = useRouter();
  const [tip, setTip] = useState("");

  // 1. 팁은 클라이언트에서 랜덤 설정
  useEffect(() => {
    setTip(SAJU_TIPS[Math.floor(Math.random() * SAJU_TIPS.length)]);
  }, []);

  // ✅ 2. [핵심] 3초마다 새로고침 (광속 폴링)
  useEffect(() => {
    const interval = setInterval(() => {
      console.log("⚡ Checking status...");
      router.refresh(); 
    }, 3000); // 3초 간격

    return () => clearInterval(interval);
  }, [router]);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#fff0f5", paddingBottom: "60px", fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #ff69b4, #ff8da1)", padding: "30px 20px", textAlign: "center", color: "white", borderRadius: "0 0 30px 30px", boxShadow: "0 4px 20px rgba(255,105,180,0.3)" }}>
        <div style={{ fontSize: 36, marginBottom: 5 }}>🔮</div>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 900, letterSpacing: "-0.5px" }}>The Saju</h1>
        <p style={{ margin: "8px 0 0", fontSize: 14, opacity: 0.95, fontWeight: 500 }}>Korean Destiny & Love Chemistry</p>
      </div>

      <div style={{ maxWidth: "480px", margin: "0 auto", padding: "20px", marginTop: "100px", textAlign: "center" }}>
        <div style={{ fontSize: "60px", marginBottom: "20px", animation: "pulse 2s infinite" }}>⚡️</div>
        
        <h2 style={{ color: "#d63384", fontSize: "24px", fontWeight: 900 }}>Connecting Energies...</h2>
        <p style={{ color: "#666", fontSize: "15px", marginBottom: "30px" }}>Applying 1,000-year-old formula...</p>

        {tip && (
          <div style={{ marginBottom: "30px", padding: "0 20px" }}>
            <div style={{ fontSize: "11px", fontWeight: "bold", color: "#ff69b4", textTransform: "uppercase", marginBottom: "8px", letterSpacing: "1px" }}>Master's Note</div>
            <p style={{ fontSize: "15px", color: "#333", fontWeight: "600", lineHeight: "1.6", margin: 0, fontStyle: "italic" }}>"{tip}"</p>
          </div>
        )}

        {/* 안내 박스 */}
        <div style={{ margin: "0 auto", maxWidth: 360, background: "#f0f9ff", border: "1px solid #bce3eb", borderRadius: 14, padding: "14px", color: "#0369a1", textAlign: "left", lineHeight: 1.45, boxShadow: "0 6px 18px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 6 }}>Important: Please stay on this page.</div>
          <div style={{ fontSize: 12, fontWeight: 700 }}>Your premium report is being generated automatically.<br />It usually takes about 3 minute.</div>
          <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #bce3eb', fontSize: 12, fontWeight: 500, color: '#0284c7' }}>
            📧 <b>Don't worry!</b> A permanent link has also been sent to your email.
          </div>
        </div>
      </div>
      <style jsx global>{`@keyframes pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.1); opacity: 0.7; } 100% { transform: scale(1); opacity: 1; } }`}</style>
    </div>
  );
}