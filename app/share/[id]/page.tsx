export const dynamic = "force-dynamic";

import { kv } from "@vercel/kv";
import { notFound } from "next/navigation";

/**
 * app/share/[id]/page.tsx
 * - params가 Promise로 들어오는 현재 프로젝트 구조를 그대로 유지
 * - KV에서 report:${id} 조회
 * - Home 톤(핑크/그라데이션/카드)으로 결과 UI 렌더
 */

export default async function SharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // ★ 중요: 저장할 때 'report:'를 붙였으므로, 찾을 때도 똑같이 붙여야 합니다!
  const reportKey = `report:${id}`;
  const data = await kv.get<any>(reportKey);

  if (!data) {
    console.log("데이터를 찾지 못함:", reportKey, "id:", id);
    return notFound();
  }

  // --- 안전 처리 ---
  const score = toNumberSafe(data.score, 0);
  const insta = data.insta_card || {};
  const elemental = data.elemental_analysis || {};
  const categories: any[] = Array.isArray(data.analysis_categories)
    ? data.analysis_categories
    : [];

  const personAEmoji = insta.person_a_emoji || "🌊";
  const personBEmoji = insta.person_b_emoji || "⛰️";
  const personANature = insta.person_a_nature || "Ocean";
  const personBNature = insta.person_b_nature || "Mountain";
  const instaTitle = insta.title || "The Unseen Destiny";
  const instaCaption = insta.caption || "";
  const hashtags: string[] = Array.isArray(insta.hashtags) ? insta.hashtags : [];

  const balanceTitle = elemental.balance_title || "The Core Dynamic";
  const elementalContent = elemental.content || "";

  return (
    <div style={pageStyle}>
      {/* Header */}
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
        <p style={{ margin: "8px 0 0", fontSize: 14, opacity: 0.95, fontWeight: 500 }}>
          Korean Destiny & Love Chemistry
        </p>
      </div>

      <div style={containerStyle}>
        {/* Top Summary Card */}
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "25px 15px 10px 15px" }}>
            <div style={{ textAlign: "center", width: "35%" }}>
              <div style={{ fontSize: 50, lineHeight: 1 }}>{personAEmoji}</div>
              <div style={{ fontSize: 14, fontWeight: "bold", color: "#333", marginTop: 8 }}>{personANature}</div>
              <div style={{ fontSize: 10, color: "#888" }}>Energy</div>
            </div>

            <div style={{ fontSize: 24, fontWeight: 900, color: "#ff69b4", width: "10%", fontStyle: "italic", textAlign: "center" }}>
              VS
            </div>

            <div style={{ textAlign: "center", width: "35%" }}>
              <div style={{ fontSize: 50, lineHeight: 1 }}>{personBEmoji}</div>
              <div style={{ fontSize: 14, fontWeight: "bold", color: "#333", marginTop: 8 }}>{personBNature}</div>
              <div style={{ fontSize: 10, color: "#888" }}>Energy</div>
            </div>
          </div>

          <div style={{ padding: "5px 0", textAlign: "center" }}>
            <div style={{ fontSize: 12, color: "#d63384", fontWeight: "bold", letterSpacing: "1px", textTransform: "uppercase" }}>
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
              <p style={{ color: "#444", lineHeight: 1.4, margin: 0, fontSize: 15, fontWeight: 600, fontStyle: "italic" }}>
                “{instaCaption}”
              </p>
            ) : (
              <p style={{ color: "#666", lineHeight: 1.4, margin: 0, fontSize: 14 }}>
                Your premium destiny report is ready.
              </p>
            )}

            {hashtags.length > 0 && (
              <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
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
              <h3 style={{ margin: 0, fontSize: 17, color: "#333", fontWeight: 900 }}>{balanceTitle}</h3>
            </div>
            <p style={{ lineHeight: 1.7, color: "#555", fontSize: 15, margin: "10px 0 0 0", whiteSpace: "pre-wrap" }}>
              {elementalContent}
            </p>
          </div>
        )}

        {/* Deep Dive Title */}
        <div style={{ marginTop: 18, marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, color: "#d63384", fontSize: 18, fontWeight: 900 }}>📋 Premium Deep Dive</h3>
          <div style={{ fontSize: 12, color: "#888", fontWeight: 700 }}>
            {categories.length > 0 ? `${categories.length} sections` : "0 sections"}
          </div>
        </div>

        {/* Deep Dive List */}
        {categories.length === 0 ? (
          <div style={{ ...panelStyle, border: "1px solid #eee" }}>
            <p style={{ margin: 0, color: "#666", lineHeight: 1.6, fontSize: 14 }}>
              분석 결과가 비어있습니다. KV에 저장된 데이터 구조에서 <b>analysis_categories</b>가 있는지 확인해 주세요.
            </p>
            <div style={{ marginTop: 10, fontSize: 12, color: "#999" }}>
              Key: <code style={codeStyle}>{reportKey}</code>
            </div>
          </div>
        ) : (
          <div>
            {categories.map((item: any, index: number) => (
              <CategoryCard key={index} item={item} index={index} />
            ))}
          </div>
        )}

        {/* Footer CTA */}
        <div style={{ marginTop: 30, ...panelStyle, textAlign: "center", background: "linear-gradient(135deg, #ffffff, #fff0f5)" }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#333" }}>Curious about someone else?</div>
          <div style={{ fontSize: 12, color: "#777", marginTop: 6 }}>
            Create another premium report in seconds.
          </div>

          <a href="/" style={{ ...ctaButtonStyle, display: "inline-block", marginTop: 14, textDecoration: "none" }}>
            ❤️ Check Another Match ($1.00)
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

/* =========================
   UI Components
   ========================= */

function CategoryCard({ item, index }: { item: any; index: number }) {
  const icon = item?.icon ?? "✨";
  const title = item?.title ?? `Section ${index + 1}`;
  const content = item?.content ?? "";

  return (
    <div style={categoryCardStyle}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 24, marginRight: 10 }}>{icon}</span>
        <h4 style={{ margin: 0, fontSize: 18, color: "#333", fontWeight: 900 }}>{title}</h4>
      </div>
      <p style={{ margin: 0, color: "#444", lineHeight: 1.85, fontSize: 15, whiteSpace: "pre-wrap" }}>
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

/* =========================
   Helpers
   ========================= */

function toNumberSafe(v: any, fallback: number) {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(v: number, min: number, max: number) {
  if (v < min) return min;
  if (v > max) return max;
  return v;
}

/* =========================
   Styles
   ========================= */

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
};
