"use client";

import React, { useState } from "react";

export default function ShareButtons({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      // clipboard 막힌 환경 fallback
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const nativeShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "The Saju - Premium Report",
          text: "Check our destiny report 🔮",
          url,
        });
        return;
      }
      // share 미지원이면 복사로 대체
      await copyLink();
    } catch (e) {
      // 사용자가 공유 취소해도 에러로 떨어질 수 있어서 조용히 무시
    }
  };

  return (
    <div style={{ display: "flex", gap: 10, justifyContent: "center", alignItems: "center", flexWrap: "wrap" }}>
      <button onClick={nativeShare} style={shareButtonStyle}>
        📤 Share Result
      </button>

      <button onClick={copyLink} style={copyButtonStyle}>
        {copied ? "✅ Copied!" : "🔗 Copy Link"}
      </button>

      <div style={{ width: "100%", marginTop: 8, fontSize: 11, color: "#aaa", textAlign: "center" }}>
        Share this page with your partner ✨
      </div>
    </div>
  );
}

const shareButtonStyle: React.CSSProperties = {
  padding: "14px 18px",
  borderRadius: 14,
  border: "none",
  cursor: "pointer",
  fontWeight: 900,
  fontSize: 14,
  color: "white",
  background: "linear-gradient(45deg, #ff69b4, #ff8da1)",
  boxShadow: "0 8px 20px rgba(255,105,180,0.35)",
  minWidth: 160,
};

const copyButtonStyle: React.CSSProperties = {
  padding: "14px 18px",
  borderRadius: 14,
  border: "1px solid #ffd6e6",
  cursor: "pointer",
  fontWeight: 900,
  fontSize: 14,
  color: "#d63384",
  background: "white",
  boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
  minWidth: 160,
};
