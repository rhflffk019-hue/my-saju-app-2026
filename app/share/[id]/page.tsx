export const dynamic = "force-dynamic";
// ✅ [필수 추가] Vercel이 옛날 데이터(없음)를 캐시하지 못하게 막고, 항상 최신 상태를 확인하게 합니다.
export const fetchCache = "force-no-store"; 

// ✅ page.tsx에서도 metadata export 가능 (App Router)
export const metadata = {
  title: "The Saju | Love is Intuition, Saju is a Blueprint",
  description:
    "Map your Five-Element traits- with a 1,000-year-old Korean framework. Reveal your hidden dynamics.",
  openGraph: {
    title: "The Saju: Love is Intuition, Saju is a Blueprint",
    description:
      "In Korea, fortune telling isn’t guesswork. Discover your deep love compatibility report in minutes.",
    url: "https://mythesaju.com",
    siteName: "The Saju",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "The Saju - Korean Destiny & Love Chemistry",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Saju | Korean Love Compatibility",
    description: "Digitized 1,000-year-old Saju framework. Reveal your hidden dynamics.",
    images: ["/og-image.png"],
  },
};

import React from "react";
import { kv } from "@vercel/kv";
import ShareButtons from "./ShareButtons";
// ✅ [추가] 방금 만든 3초 체크 엔진을 가져옵니다.
import ResultLoading from "@/components/ResultLoading"; 

/**
 * app/share/[id]/page.tsx
 * - params: Promise<{id}>
 * - KV에서 report:${id} 조회
 * - ✅ ResultLoading 컴포넌트로 광속 폴링 적용
 */
export default async function SharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const reportKey = `report:${id}`;
  const data = await kv.get<any>(reportKey);

  // =========================================================
  // ⚡ [로딩 화면] 데이터가 없으면 'ResultLoading'이 3초마다 체크함
  // =========================================================
  if (!data) {
    return <ResultLoading />;
  }

  // =========================================================
  // ✅ [결과 화면] - 원본 로직 100% 유지
  // =========================================================
  const score = toNumberSafe(data.score, 0);
  const insta = data.insta_card || {};
  const elemental = data.elemental_analysis || {};
  const categories: any[] = Array.isArray(data.analysis_categories) ? data.analysis_categories : [];

  const personAEmoji = insta.person_a_emoji || "🔥";
  const personBEmoji = insta.person_b_emoji || "🌊";
  const personANature = insta.person_a_nature || "Fire";
  const personBNature = insta.person_b_nature || "Water";
  const instaTitle = insta.title || "The Destiny";
  const instaCaption = insta.caption || "";
  // 해시태그 변수는 존재하지만 렌더링하지 않음 (공간 절약)
  
  const balanceTitle = elemental.balance_title || "The Core Dynamic";
  const elementalContent = elemental.content || "";

  const sajuChart = data?.saju_chart || null;
  const myInfo = sajuChart?.my_info || null;
  const partnerInfo = sajuChart?.partner_info || null;

  const baseUrl = "https://www.mythesaju.com";
  const shareUrl = `${baseUrl}/share/${id}`;

  return (
    <div style={pageStyle}>
      {/* Header (높이 축소됨) */}
      <div style={headerStyle}>
        <div style={{ fontSize: 28, marginBottom: 2 }}>🔮</div>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, letterSpacing: "-0.5px" }}>
          The Saju
        </h1>
        <p style={{ margin: "4px 0 0", fontSize: 12, opacity: 0.9 }}>
          Korean Destiny & Love Chemistry
        </p>
      </div>

      <div style={containerStyle}>
        
        {/* ★★★ ULTRA COMPACT INSTA CARD (NO HASHTAGS) ★★★ */}
        <div style={cardStyle}>
          
          {/* 1. Emoji Row (패딩 축소) */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: "25px 10px 5px 10px",
            }}
          >
            <div style={{ textAlign: "center", width: "40%" }}>
              <div style={{ fontSize: 42, lineHeight: 1, marginBottom: 4 }}>{personAEmoji}</div>
              <div style={{ fontSize: 11, fontWeight: "bold", color: "#333", lineHeight: 1.2 }}>
                {personANature}
              </div>
            </div>

            <div
              style={{
                fontSize: 20,
                fontWeight: 900,
                color: "#ff69b4",
                width: "10%",
                fontStyle: "italic",
                textAlign: "center",
              }}
            >
              VS
            </div>

            <div style={{ textAlign: "center", width: "40%" }}>
              <div style={{ fontSize: 42, lineHeight: 1, marginBottom: 4 }}>{personBEmoji}</div>
              <div style={{ fontSize: 11, fontWeight: "bold", color: "#333", lineHeight: 1.2 }}>
                {personBNature}
              </div>
            </div>
          </div>

          {/* 2. Score Row (폰트 사이즈 68로 축소) */}
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <div
              style={{
                fontSize: 10,
                color: "#d63384",
                fontWeight: "bold",
                letterSpacing: "1px",
                textTransform: "uppercase",
              }}
            >
              Compatibility Score
            </div>

            <div style={scoreStyle}>
              {clamp(score, 0, 100)}
              <span style={{ fontSize: 24, marginLeft: 2 }}>%</span>
            </div>

            <div style={{ marginTop: 5, padding: "0 35px" }}>
              <ProgressBar value={clamp(score, 0, 100)} />
            </div>
          </div>

          {/* 3. Text Section (해시태그 삭제됨) */}
          <div style={{ padding: "15px 25px 20px 25px", textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#ff69b4", marginBottom: 8 }}>
              {instaTitle}
            </div>

            <p
              style={{
                color: "#444",
                lineHeight: 1.4,
                margin: 0,
                fontSize: 13,
                fontWeight: 600,
                fontStyle: "italic",
              }}
            >
              “{instaCaption}”
            </p>

            {/* ✅ [수정] 해시태그 섹션 삭제됨 (공간 확보) */}

            {/* ✅ [수정] 하단 URL 섹션 (간격 최소화) */}
            <div style={{ 
                marginTop: 15, 
                borderTop: "1px solid #ffe4ef",
                paddingTop: 10,
            }}>
                <div style={{ 
                    fontSize: 11, 
                    fontWeight: 900, 
                    color: "#d63384", 
                    letterSpacing: "-0.5px",
                    fontFamily: "monospace" 
                }}>
                    mythesaju.com
                </div>
            </div>

          </div> {/* 패딩 박스 닫기 */}
        </div>   {/* Top Summary Card 닫기 */}

        {/* 안내 문구 (카드 밖) */}
        <div style={{ 
            marginTop: -10, 
            marginBottom: 20, 
            textAlign: "center",
            fontSize: 12, 
            color: "#999", 
            fontWeight: 500 
        }}>
            📸 Screenshot this card & Share on Story
        </div>

        {/* Key Dynamic */}
        {(balanceTitle || elementalContent) && (
          <div style={{ ...panelStyle, borderLeft: "5px solid #60a5fa" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 18 }}>🔑</span>
              <h3 style={{ margin: 0, fontSize: 17, color: "#333", fontWeight: 900 }}>
                {balanceTitle}
              </h3>
            </div>
            <p
              style={{
                lineHeight: 1.7,
                color: "#555",
                fontSize: 15,
                margin: "10px 0 0 0",
                whiteSpace: "pre-wrap",
              }}
            >
              {elementalContent}
            </p>
          </div>
        )}

        {/* SAJU CHART Section */}
        {myInfo && partnerInfo && (
          <div style={{ ...panelStyle, padding: "24px", marginTop: 18 }}>
            <div
              style={{
                textAlign: "center",
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: 1,
                color: "#888",
                marginBottom: 14,
              }}
            >
              ELEMENTAL BIRTH CHARTS
            </div>

            <PillarChart info={myInfo} getElementColor={getElementColor} />
            <div style={{ height: 22 }} />
            <PillarChart info={partnerInfo} getElementColor={getElementColor} />
          </div>
        )}

        {/* Deep Dive Title */}
        <div
          style={{
            marginTop: 18,
            marginBottom: 12,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h3 style={{ margin: 0, color: "#d63384", fontSize: 18, fontWeight: 900 }}>
            📋 Premium Deep Dive
          </h3>
          <div style={{ fontSize: 12, color: "#888", fontWeight: 700 }}>
            {categories.length > 0 ? `${categories.length} sections` : "0 sections"}
          </div>
        </div>

        {/* Deep Dive List */}
        {categories.length === 0 ? (
          <div style={{ ...panelStyle, border: "1px solid #eee" }}>
            <p style={{ margin: 0, color: "#666", lineHeight: 1.6, fontSize: 14 }}>
              분석 결과가 비어있습니다.
            </p>
          </div>
        ) : (
          <div>
            {categories.map((item: any, index: number) => (
              <CategoryCard key={index} item={item} index={index} />
            ))}
          </div>
        )}

        {/* Share Buttons */}
        <div style={{ marginTop: 16, ...panelStyle, textAlign: "center", background: "#fff" }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: "#333", marginBottom: 10 }}>
            🔗 Share this result
          </div>
          <ShareButtons url={shareUrl} />
          <div style={{ marginTop: 10, fontSize: 11, color: "#999", lineHeight: 1.4 }}>
            Link: <code style={codeStyle}>{shareUrl}</code>
          </div>
        </div>

        {/* Footer CTA */}
        <div
          style={{
            marginTop: 30,
            ...panelStyle,
            textAlign: "center",
            background: "linear-gradient(135deg, #ffffff, #fff0f5)",
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 800, color: "#333" }}>
            Curious about someone else?
          </div>
          <div style={{ fontSize: 12, color: "#777", marginTop: 6 }}>
            Create another premium report in seconds.
          </div>

          <a
            href="/"
            style={{
              ...ctaButtonStyle,
              display: "inline-block",
              marginTop: 14,
              textDecoration: "none",
            }}
          >
            ❤️ Discover a New Match
          </a>

          <div style={{ marginTop: 12, fontSize: 11, color: "#aaa" }}>
            Share ID: <span style={{ fontFamily: "monospace" }}>{id}</span>
          </div>
        </div>

        <div style={{ height: 40 }} />
      </div>
    </div>
  );
}

// ---------------- UI Components ----------------

function CategoryCard({ item, index }: { item: any; index: number }) {
  const icon = item?.icon ?? "✨";
  const title = item?.title ?? `Section ${index + 1}`;
  const content = item?.content ?? "";

  return (
    <div style={categoryCardStyle}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 24, marginRight: 10 }}>{icon}</span>
        <h4 style={{ margin: 0, fontSize: 18, color: "#333", fontWeight: 900 }}>
          {title}
        </h4>
      </div>
      <p
        style={{
          margin: 0,
          color: "#444",
          lineHeight: 1.85,
          fontSize: 15,
          whiteSpace: "pre-wrap",
        }}
      >
        {content}
      </p>
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  const v = clamp(value, 0, 100);
  return (
    <div style={progressWrapStyle}>
      <div style={{ ...progressFillStyle, width: `${v}%` }} />
    </div>
  );
}

function getElementColor(element: string) {
  const el = element ? element.toLowerCase() : "";
  if (el === "wood") return "#4ade80";
  if (el === "fire") return "#f87171";
  if (el === "earth") return "#fbbf24";
  if (el === "metal") return "#9ca3af";
  if (el === "water") return "#60a5fa";
  return "#d1d5db";
}

function PillarChart({ info, getElementColor }: any) {
  const sortedPillars = info.pillars ? [...info.pillars] : [];
  return (
    <div>
      <div
        style={{
          textAlign: "center",
          fontWeight: "bold",
          color: "#333",
          marginBottom: "8px",
          fontSize: "14px",
        }}
      >
        {info.name}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "4px" }}>
        {["YEAR", "MONTH", "DAY", "HOUR"].map((label) => (
          <div
            key={label}
            style={{
              textAlign: "center",
              fontSize: "10px",
              color: "#999",
              fontWeight: "bold",
              marginBottom: "5px",
            }}
          >
            {label}
          </div>
        ))}

        {sortedPillars.map((p: any, i: number) => (
          <div key={i} style={{ textAlign: "center" }}>
            {/* 천간 (윗글자) */}
            <div
              style={{
                backgroundColor: getElementColor(p.stem_element || p.element),
                color: "white",
                padding: "8px 2px",
                borderRadius: "8px 8px 0 0",
              }}
            >
              <div style={{ fontSize: "18px", fontWeight: "bold" }}>
                {p.stem_hangul || p.stem_hanja || p.hanja}
              </div>
              <div style={{ fontSize: "9px", fontWeight: "500", marginTop: "2px" }}>
                {p.stem_meaning || p.meaning}
              </div>
            </div>

            {/* 지지 (아랫글자) */}
            <div
              style={{
                backgroundColor: getElementColor(p.branch_element || p.element),
                color: "white",
                padding: "8px 2px",
                borderRadius: "0 0 8px 8px",
                opacity: 0.9,
              }}
            >
              <div style={{ fontSize: "18px", fontWeight: "bold" }}>
                {p.branch_hangul || p.branch_hanja || p.hanja}
              </div>
              <div style={{ fontSize: "9px", fontWeight: "500", marginTop: "2px" }}>
                {p.branch_meaning || p.meaning}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------- Helpers ----------------

function toNumberSafe(v: any, fallback: number) {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(v: number, min: number, max: number) {
  if (v < min) return min;
  if (v > max) return max;
  return v;
}

// ---------------- Styles (COMPACT VERSION) ----------------

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  backgroundColor: "#fff0f5",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  paddingBottom: "40px",
  boxSizing: "border-box",
};

const headerStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, #ff69b4, #ff8da1)",
  padding: "20px 15px", // ✅ 패딩 축소
  textAlign: "center",
  color: "white",
  borderRadius: "0 0 25px 25px", // ✅ 둥글기 축소
  boxShadow: "0 4px 15px rgba(255,105,180,0.3)",
};

const containerStyle: React.CSSProperties = {
  maxWidth: "480px",
  margin: "0 auto",
  padding: "15px",
  marginTop: "10px", 
};

// ★★★ COMPACT CARD STYLE ★★★
const cardStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, #ffffff, #fff0f5)",
  borderRadius: "20px",
  overflow: "hidden",
  boxShadow: "0 8px 25px rgba(0,0,0,0.08)",
  marginBottom: "15px",
  textAlign: "center",
  border: "2px solid #ffdeeb",
};

const scoreStyle: React.CSSProperties = {
  fontSize: 68, // ✅ 80 -> 68로 축소 (한 줄 핏)
  fontWeight: 900,
  color: "#ff69b4",
  lineHeight: "1",
  textShadow: "2px 2px 0px #fff",
  marginBottom: "2px",
};

const panelStyle: React.CSSProperties = {
  background: "white",
  padding: "20px",
  borderRadius: "20px",
  marginBottom: "16px",
  boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
};

const categoryCardStyle: React.CSSProperties = {
  background: "white",
  padding: "25px",
  borderRadius: "15px",
  marginBottom: "15px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
  border: "1px solid #ffe4ef",
};

// ✅ tagStyle 삭제 (사용 안 함)

const progressWrapStyle: React.CSSProperties = {
  width: "100%",
  height: 8, // ✅ 10 -> 8로 축소
  backgroundColor: "#ffe4ef",
  borderRadius: 999,
  overflow: "hidden",
  border: "1px solid #ffd6e6",
};

const progressFillStyle: React.CSSProperties = {
  height: "100%",
  borderRadius: 999,
  background: "linear-gradient(90deg, #ff69b4, #ff8da1)",
  boxShadow: "0 8px 20px rgba(214, 51, 132, 0.25)",
};

const ctaButtonStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px", // ✅ 16 -> 14로 축소
  background: "linear-gradient(45deg, #ff69b4, #ff8da1)",
  color: "white",
  border: "none",
  borderRadius: "15px",
  fontSize: "15px",
  fontWeight: "bold",
  cursor: "pointer",
  boxShadow: "0 6px 15px rgba(255,105,180,0.4)",
};

const codeStyle: React.CSSProperties = {
  padding: "2px 6px",
  borderRadius: 6,
  backgroundColor: "#f3f4f6",
  border: "1px solid #e5e7eb",
  fontFamily: "monospace",
};