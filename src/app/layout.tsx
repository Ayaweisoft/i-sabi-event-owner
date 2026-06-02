import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/providers/QueryProvider";

// Load only the variable font we actually use — Geist Mono removed (unused in UI)
const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
    display: "swap",   // show text immediately with fallback font
    preload: true,
});

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://owner.i-sabi.com.ng";

export const viewport: Viewport = {
    themeColor: "#2d8c3e",
    colorScheme: "light",
    width: "device-width",
    initialScale: 1,
};

export const metadata: Metadata = {
    metadataBase: new URL(BASE_URL),
    title: {
        default: "i-sabi Event Owner Dashboard",
        template: "%s | i-sabi Event Owner",
    },
    description:
        "Manage your i-sabi events and Adz campaigns in real time. Track ticket sales, check-ins, votes, form submissions, campaign performance, and revenue — all in one dashboard.",
    keywords: [
        "i-sabi", "event management", "ticket sales", "event owner dashboard",
        "nigeria events", "event revenue", "check-in management", "voting contest",
        "form submissions", "event analytics", "adz campaigns", "event advertising",
    ],
    authors: [{ name: "i-sabi", url: "https://i-sabi.com.ng" }],
    creator: "i-sabi",
    publisher: "i-sabi",
    category: "Event Management",

    // Open Graph
    openGraph: {
        type: "website",
        locale: "en_NG",
        url: BASE_URL,
        siteName: "i-sabi Event Owner Dashboard",
        title: "i-sabi Event Owner Dashboard",
        description:
            "Track ticket sales, check-ins, votes, Adz campaign performance, and revenue for all your events — live, in one place.",
        images: [
            {
                url: "/og-image.png",
                width: 1200,
                height: 630,
                alt: "i-sabi Event Owner Dashboard",
            },
        ],
    },

    // Twitter / X card
    twitter: {
        card: "summary_large_image",
        title: "i-sabi Event Owner Dashboard",
        description:
            "Manage your events and Adz campaigns, track ticket sales, check-ins, votes, and revenue in real time.",
        images: ["/og-image.png"],
        creator: "@isabimobile",
        site: "@isabimobile",
    },

    // Robots — login page is public; dashboard is private (handled per-layout)
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
        },
    },

    // Canonical
    alternates: {
        canonical: BASE_URL,
    },

    // App icons
    icons: {
        icon: "/favicon.ico",
        shortcut: "/favicon.ico",
        apple: "/apple-touch-icon.png",
    },

    // Manifest
    manifest: "/site.webmanifest",

    // Verification placeholders
    verification: {
        google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ?? "",
    },
};

// JSON-LD structured data for the organisation + software product
function JsonLd() {
    const schema = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "Organization",
                "@id": `${BASE_URL}/#organization`,
                name: "i-sabi",
                url: "https://i-sabi.com.ng",
                logo: {
                    "@type": "ImageObject",
                    url: `${BASE_URL}/logo.png`,
                },
                sameAs: [
                    "https://twitter.com/isabimobile",
                    "https://www.instagram.com/isabimobile",
                ],
            },
            {
                "@type": "SoftwareApplication",
                "@id": `${BASE_URL}/#app`,
                name: "i-sabi Event Owner Dashboard",
                applicationCategory: "BusinessApplication",
                operatingSystem: "Web",
                url: BASE_URL,
                description:
                    "Manage ticket sales, check-ins, voting contests, form submissions, Adz campaigns, and revenue for events on the i-sabi platform.",
                offers: {
                    "@type": "Offer",
                    price: "0",
                    priceCurrency: "NGN",
                },
                author: { "@id": `${BASE_URL}/#organization` },
            },
        ],
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}

export default function RootLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <JsonLd />
            </head>
            <body className={`${geistSans.variable} antialiased`} suppressHydrationWarning>
                <QueryProvider>{children}</QueryProvider>
            </body>
        </html>
    );
}
