import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    const base = process.env.NEXT_PUBLIC_SITE_URL || "https://owner.i-sabi.com.ng";
    return {
        rules: [
            {
                userAgent: "*",
                allow: ["/"],           // login/landing page — public
                disallow: ["/dashboard/"], // all dashboard routes — private
            },
        ],
        sitemap: `${base}/sitemap.xml`,
    };
}
