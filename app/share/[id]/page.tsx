export const dynamic = "force-dynamic";

// ✅ page.tsx에서도 metadata export 가능 (App Router)
export const metadata = {
  title: "The Saju | Love is Intuition, Saju is a Blueprint",
  description:
    "Map your Five-Element energy with a 1,000-year-old Korean framework. Reveal your hidden dynamics.",
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
import PollingHandler from "./PollingHandler";

// =========================================================
// 🔮 기다리는 동안 무작위로 노출될 사주 팁 (지루함 방지)
// =========================================================
const SAJU_TIPS = [
  "In Saju, your 'Day Master' represents your core essence—the sun you were born under.",
  "The Four Pillars map not just your personality, but the flow of your life's seasons.",
  "Balance between the Five Elements (Wood, Fire, Earth, Metal, Water) brings true harmony.",
  "Your birth hour reveals your hidden internal world and your future potential.",
  "Saju is not a fixed fate, but a weather forecast for your journey through time.",
  "The 'Year' pillar represents your social circle and the legacy of your ancestors.",
  "The 'Month' pillar governs your career potential and the environment of your youth.",
];

/**
 * app/share/[id]/page.tsx
 * - params: Promise<{id}>
 * - KV에서 report:${id} 조회
 * - ✅ 하드 새로고침(meta/script) 제거
 * - ✅ PollingHandler로 조용한 폴링(router.refresh) 적용
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
  // ⚡ [로딩 화면] - PollingHandler로 "조용히" 갱신
  // =========================================================
  if (!data) {
    const randomTip = SAJU_TIPS[Math.floor(Math.random() * SAJU_TIPS.length)];

    return (
      <div style={pageStyle}>
        {/* ✅ 하드 리로드 제거, soft polling 적용 */}
        <PollingHandler intervalMs={7000} maxMinutes={4} />

        {/* Header - 원본 스타일 그대로 */}
        <div style={headerStyle}>
          <div style={{ fontSize: 36, marginBottom: 5 }}>🔮</div>
          <h1
            style={{
              margin: 0,
              fontSize: 32,
              fontWeight: 900,
              letterSpacing: "-0.5px",
            }}
          >
            The Saju
          </h1>
          <p
            style={{
              margin: "8px 0 0",
              fontSize: 14,
              opacity: 0.95,
              fontWeight: 500,
            }}
          >
            Korean Destiny & Love Chemistry
          </p>
        </div>

        <div style={{ ...containerStyle, textAlign: "center", marginTop: "100px" }}>
          {/* ⚡️ 로딩 애니메이션 */}
          <div style={{ fontSize: "60px", marginBottom: "20px", animation: "pulse 2s infinite" }}>
            ⚡️
          </div>
          <h2 style={{ color: "#d63384", fontSize: "24px", fontWeight: 900 }}>
            Connecting Energies...
          </h2>
          <p style={{ color: "#666", fontSize: "15px", marginBottom: "30px" }}>
            Applying 1,000-year-old formula...
          </p>

          {/* ✨ 무작위 사주 팁 */}
          <div style={{ marginBottom: "30px", padding: "0 20px" }}>
            <div
              style={{
                fontSize: "11px",
                fontWeight: "bold",
                color: "#ff69b4",
                textTransform: "uppercase",
                marginBottom: "8px",
                letterSpacing: "1px",
              }}
            >
              Master's Note
            </div>
            <p
              style={{
                fontSize: "15px",
                color: "#333",
                fontWeight: "600",
                lineHeight: "1.6",
                margin: 0,
                fontStyle: "italic",
              }}
            >
              "{randomTip}"
            </p>
          </div>

          {/* 안내 박스 */}
          <div
            style={{
              margin: "0 auto",
              maxWidth: 360,
              background: "#f0f9ff",
              border: "1px solid #bce3eb",
              borderRadius: 14,
              padding: "14px 14px",
              color: "#0369a1",
              textAlign: "left",
              lineHeight: 1.45,
              boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 6 }}>
              Important: Please stay on this page.
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
              Please don’t leave this page.
            </div>
            <div style={{ fontSize: 12, fontWeight: 700 }}>
              Your premium report is being generated automatically.
              <br />
              It may take up to 3 minutes.
            </div>
          </div>

          <div style={{ marginTop: 40, fontSize: 11, color: "#aaa", fontStyle: "italic" }}>
            The results will appear automatically once analysis is complete...
          </div>
        </div>

        {/* 애니메이션 정의 */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              @keyframes pulse { 
                0% { transform: scale(1); opacity: 1; } 
                50% { transform: scale(1.1); opacity: 0.7; } 
                100% { transform: scale(1); opacity: 1; } 
              }
              body { margin: 0; }
            `,
          }}
        />
      </div>
    );
  }

  // =========================================================
  // ✅ [결과 화면] - 원본 로직 유지
  // =========================================================
  const score = toNumberSafe(data.score, 0);
  const insta = data.insta_card || {};
  const elemental = data.elemental_analysis || {};
  const categories: any[] = Array.isArray(data.analysis_categories) ? data.analysis_categories : [];

  const personAEmoji = insta.person_a_emoji || "🌊";
  const personBEmoji = insta.person_b_emoji || "⛰️";
  const personANature = insta.person_a_nature || "Ocean";
  const personBNature = insta.person_b_nature || "Mountain";
  const instaTitle = insta.title || "The Unseen Destiny";
  const instaCaption = insta.caption || "";
  const hashtags: string[] = Array.isArray(insta.hashtags) ? insta.hashtags : [];

  const balanceTitle = elemental.balance_title || "The Core Dynamic";
  const elementalContent = elemental.content || "";

  const sajuChart = data?.saju_chart || null;
  const myInfo = sajuChart?.my_info || null;
  const partnerInfo = sajuChart?.partner_info || null;

  const baseUrl = "https://www.mythesaju.com";
  const shareUrl = `${baseUrl}/share/${id}`;

  return (
    <div style={pageStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div style={{ fontSize: 36, marginBottom: 5 }}>🔮</div>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 900, letterSpacing: "-0.5px" }}>
          The Saju
        </h1>
        <p style={{ margin: "8px 0 0", fontSize: 14, opacity: 0.95, fontWeight: 500 }}>
          Korean Destiny & Love Chemistry
        </p>
      </div>

      <div style={containerStyle}>
        {/* Top Summary Card */}
        <div style={cardStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: "25px 15px 10px 15px",
            }}
          >
            <div style={{ textAlign: "center", width: "35%" }}>
              <div style={{ fontSize: 50, lineHeight: 1 }}>{personAEmoji}</div>
              <div style={{ fontSize: 14, fontWeight: "bold", color: "#333", marginTop: 8 }}>
                {personANature}
              </div>
              <div style={{ fontSize: 10, color: "#888" }}>Energy</div>
            </div>

            <div
              style={{
                fontSize: 24,
                fontWeight: 900,
                color: "#ff69b4",
                width: "10%",
                fontStyle: "italic",
                textAlign: "center",
              }}
            >
              VS
            </div>

            <div style={{ textAlign: "center", width: "35%" }}>
              <div style={{ fontSize: 50, lineHeight: 1 }}>{personBEmoji}</div>
              <div style={{ fontSize: 14, fontWeight: "bold", color: "#333", marginTop: 8 }}>
                {personBNature}
              </div>
              <div style={{ fontSize: 10, color: "#888" }}>Energy</div>
            </div>
          </div>

          <div style={{ padding: "5px 0", textAlign: "center" }}>
            <div
              style={{
                fontSize: 12,
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
              <span style={{ fontSize: 20, marginLeft: 2 }}>%</span>
            </div>

            <div style={{ marginTop: 10, padding: "0 25px" }}>
              <ProgressBar value={clamp(score, 0, 100)} />
            </div>
          </div>

          <div style={{ padding: "15px 25px 25px 25px", textAlign: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#ff69b4", marginBottom: 6 }}>
              {instaTitle}
            </div>

            {instaCaption ? (
              <p
                style={{
                  color: "#444",
                  lineHeight: 1.4,
                  margin: 0,
                  fontSize: 15,
                  fontWeight: 600,
                  fontStyle: "italic",
                }}
              >
                “{instaCaption}”
              </p>
            ) : (
              <p style={{ color: "#666", lineHeight: 1.4, margin: 0, fontSize: 14 }}>
                Your premium destiny report is ready.
              </p>
            )}

            {hashtags.length > 0 && (
              <div
                style={{
                  marginTop: 10,
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  justifyContent: "center",
                }}
              >
                {hashtags.slice(0, 12).map((tag: string, idx: number) => (
                  <span key={`${tag}-${idx}`} style={tagStyle}>
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
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
          <div style={{ fontSize: 14, fontWeight: 800, color: "#333" }}>Curious about someone else?</div>
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
            <div
              style={{
                backgroundColor: getElementColor(p.stem_element || p.element),
                color: "white",
                padding: "8px 2px",
                borderRadius: "8px 8px 0 0",
              }}
            >
              <div style={{ fontSize: "18px", fontWeight: "bold" }}>
                {p.stem_hanja || p.hanja}
              </div>
              <div style={{ fontSize: "9px", fontWeight: "500", marginTop: "2px" }}>
                {p.stem_meaning || p.meaning}
              </div>
            </div>

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
                {p.branch_hanja || p.hanja}
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

// ---------------- Styles ----------------

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  backgroundColor: "#fff0f5",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  paddingBottom: "60px",
  boxSizing: "border-box",
};

const headerStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, #ff69b4, #ff8da1)",
  padding: "30px 20px",
  textAlign: "center",
  color: "white",
  borderRadius: "0 0 30px 30px",
  boxShadow: "0 4px 20px rgba(255,105,180,0.3)",
};

const containerStyle: React.CSSProperties = {
  maxWidth: "480px",
  margin: "0 auto",
  padding: "20px",
  marginTop: "-25px",
};

const cardStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, #ffffff, #fff0f5)",
  borderRadius: "25px",
  overflow: "hidden",
  boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
  marginBottom: "20px",
  textAlign: "center",
  border: "2px solid #ffdeeb",
};

const scoreStyle: React.CSSProperties = {
  fontSize: 80,
  fontWeight: 900,
  color: "#ff69b4",
  lineHeight: "1",
  textShadow: "3px 3px 0px #fff",
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

const tagStyle: React.CSSProperties = {
  backgroundColor: "#fff0f7",
  border: "1px solid #ffd6e6",
  color: "#d63384",
  fontWeight: 800,
  padding: "6px 10px",
  borderRadius: "999px",
  fontSize: 11,
};

const progressWrapStyle: React.CSSProperties = {
  width: "100%",
  height: 10,
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
  padding: "16px",
  background: "linear-gradient(45deg, #ff69b4, #ff8da1)",
  color: "white",
  border: "none",
  borderRadius: "15px",
  fontSize: "16px",
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
