import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script"; // ✅ Next.js 전용 스크립트 로더
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// ✅ 메타데이터는 준수님이 작성하신 그대로 유지됩니다.
export const metadata: Metadata = {
  title: "The Saju | Love is Intuition, Saju is a Blueprint",
  description: "Map your Five-Element energy with a 1,000-year-old Korean framework. Reveal your hidden dynamics for just $3.99.",
  openGraph: {
    title: "The Saju: Love is Intuition, Saju is a Blueprint",
    description: "In Korea, fortune telling isn’t guesswork. Discover your deep love compatibility report in minutes.",
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
    description: "Digitized 1,000-year-old Saju framework. Get your $3.99 destiny report.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* 🚀 구글 광고 태그 (gtag.js) 추가 */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-17942691969"
          strategy="afterInteractive"
        />
        <Script id="google-ads-tag" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'AW-17942691969');
          `}
        </Script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}

        {/* ✅ 검로드 오버레이 스크립트 */}
        <Script src="https://gumroad.com/js/gumroad.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}