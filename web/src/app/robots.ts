// /robots.txt: 검색엔진(구글·네이버 …)이 모든 화면을 읽어 가게 하고, 관리 화면만 막습니다.
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: "/admin" }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
