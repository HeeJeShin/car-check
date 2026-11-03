// /sitemap.xml: 검색엔진에 "이런 화면들이 있어요"를 알려주는 주소 목록.
// 차종마다 세대 선택, 세대마다 고질병 리포트·매장 점검 가이드를 넣어 "더 뉴 그랜저 고질병" 같은 검색에 걸리게 합니다.
// 목록은 API에서 받아 1시간마다 다시 만듭니다. API가 잠깐 안 되면 고정 화면만이라도 내보냅니다.
import type { MetadataRoute } from "next";
import { api, generationsHref, type CarModel, type ModelCard } from "@/lib/api";
import { CARS_TAG, REVALIDATE } from "@/lib/cached";
import { SITE_URL } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const page = (path: string, priority: number): MetadataRoute.Sitemap[number] => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority,
  });
  const fixed = [page("/", 1), page("/cars", 0.9), page("/guide", 0.6)];

  try {
    const cache = { next: { revalidate: REVALIDATE, tags: [CARS_TAG] } };
    const [models, cars] = await Promise.all([api<ModelCard[]>("/cars/models", cache), api<CarModel[]>("/cars", cache)]);
    return [
      ...fixed,
      ...models.map((m) => page(generationsHref(m.maker, m.name), 0.7)),
      ...cars.flatMap((c) => [page(`/cars/${c.id}`, 0.8), page(`/cars/${c.id}/inspect`, 0.6)]),
    ];
  } catch {
    return fixed;
  }
}
