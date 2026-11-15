import { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { MotionRoot } from "../components/ui/motion";
import TopLoader from "../components/TopLoader";
import { Analytics } from "@vercel/analytics/next";

// Brand system: Space Grotesk. 300 for large headlines, 500 for UI.
const grotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-grotesk",
  display: "swap"
});

export const viewport: Viewport = {
  themeColor: "#000000",
  viewportFit: "cover"
};

const SITE_URL = "https://lockin.top";
const SITE_TITLE = "LOCKIN — Find Your People. Stop Scrolling. Start Executing.";
const SITE_DESCRIPTION =
  "The real-world campus execution network. Discover live missions, find your people on campus, meet up in real life, and lock in together or solo with verified proof of work.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s | LOCKIN"
  },
  description: SITE_DESCRIPTION,
  applicationName: "LOCKIN",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.png",
    apple: "/apple-touch-icon.png"
  },
  keywords: [
    "lockin",
    "lockin.top",
    "find your people",
    "stop scrolling start executing",
    "tinder for college builders",
    "linkedin for college life",
    "campus missions",
    "side quests",
    "college accountability",
    "study buddy app",
    "pomodoro focus timer",
    "proof of work",
    "strava for studying",
    "srm ktr"
  ],
  authors: [{ name: "LOCKIN", url: SITE_URL }],
  creator: "LOCKIN",
  publisher: "LOCKIN",
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: "LOCKIN",
    images: [
      {
        url: "/card_metallic_silver.png",
        width: 1200,
        height: 630,
        alt: "LOCKIN — The Campus Execution Network"
      }
    ],
    locale: "en_US",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/card_metallic_silver.png"],
    creator: "@lockin"
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1
    }
  },
  verification: {
    google: "56db0d2d03bb70d5"
  }
};

const jsonLdData = [
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "LOCKIN",
    "alternateName": ["LockIn", "Lock In", "lockin.top"],
    "url": SITE_URL,
    "applicationCategory": "ProductivityApplication",
    "operatingSystem": "Web, iOS (PWA), Android",
    "description": SITE_DESCRIPTION,
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "featureList": [
      "Real-world campus missions & in-person study sprints",
      "Peer-to-peer 4-digit check-in verification codes",
      "Solo and group Pomodoro focus timers with pause-duration exclusion",
      "Collectible tiered metallic recap cards (Bronze, Silver, Gold, Crimson)",
      "Motion reputation system tracking verified proof of work",
      "Four real-world pillars: Academics & Grind, Fitness & Physical, Discipline, and Campus Social Discovery"
    ]
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is LOCKIN?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "LOCKIN (lockin.top) is a real-world campus execution network for university students and ambitious builders. It connects students in real life to discover campus missions (study sprints, gym sessions, coding projects, sunrise runs), check in together with 4-digit partner codes, and turn shared ambition into verified proof of work."
        }
      },
      {
        "@type": "Question",
        "name": "How is LOCKIN different from screen blockers or timer apps?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Unlike apps that isolate users behind screen blockers or timers, LOCKIN is anchored in real-world human connection and campus culture. It enables students to find their crowd on campus, verify physical attendance with partner check-in codes, build Motion reputation, and share dark-luxury story recap receipts."
        }
      },
      {
        "@type": "Question",
        "name": "Can I lock in solo or do I need a group?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Both. LOCKIN's philosophy is: 'Lock in solo. Or find your people. Either way: execute.' You can launch a solo timestamped Pomodoro session or commit to a group mission with peers on your campus."
        }
      },
      {
        "@type": "Question",
        "name": "Why do students describe LOCKIN as 'Tinder × LinkedIn for college life'?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Because it combines the effortless, zero-awkwardness campus discovery of meeting new peers with the ambition, skills, and proof of work of a professional network. Rather than endless messaging or passive swiping, it immediately terminates in real-world physical action: launching side quests, studying together, and earning collectible proof-of-work cards."
        }
      }
    ]
  }
];

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={grotesk.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
        />
      </head>
      <body className="font-sans">
        {/* Semantic crawler shell: guarantees search and AI bots ingest the platform's vision and core loop */}
        <section className="sr-only" aria-label="LOCKIN Overview">
          <h1>LOCKIN — The Campus Execution Network</h1>
          <p>find your people. stop scrolling. start executing.</p>
          <p>
            LOCKIN (lockin.top) is a campus accountability and execution platform built for students and builders.
            Often described as &quot;Tinder &times; LinkedIn for college life&quot;, LOCKIN combines zero-awkwardness
            campus social discovery with real builder capability and proof of work.
          </p>
          <p>
            Discover live missions and side quests, meet up in real life, verify attendance with 4-digit partner
            check-in codes, and turn ideas into verified proof of work. Missions span four pillars: Grind &amp; Academics,
            Fitness &amp; Physical, Discipline &amp; Routine, and Campus Social Discovery.
          </p>
          <h2>Strava, but for your brain.</h2>
          <p>
            Lock in solo with precision Pomodoro timers or join your campus squad. Every completed session generates
            a collectible 3D metallic recap card (Bronze, Silver, Gold, Crimson) to share as story receipts.
          </p>
        </section>

        <TopLoader />
        <MotionRoot>{children}</MotionRoot>
        <Analytics />
      </body>
    </html>
  );
}
