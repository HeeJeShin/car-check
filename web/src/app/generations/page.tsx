// 예전 주소(/generations?maker=현대&name=투싼)로 들어오면 새 주소(/generations/현대/투싼)로 보냅니다.
import { redirect } from "next/navigation";
import { generationsHref } from "@/lib/api";

export default async function OldGenerationsPage({ searchParams }: { searchParams: Promise<{ maker?: string; name?: string }> }) {
  const { maker, name } = await searchParams;
  redirect(maker && name ? generationsHref(maker, name) : "/cars");
}
