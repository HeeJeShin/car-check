// API(car-check/api) 호출 함수와 응답 타입을 한곳에 모아 둡니다.
// 화면 컴포넌트는 fetch URL을 몰라도 되고, API가 바뀌면 이 파일만 고치면 됩니다.

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3200";

export type Severity = "LOW" | "MEDIUM" | "HIGH";
export type IssueStatus = "DRAFT" | "VERIFIED";

export type CarModel = {
  id: number;
  maker: string;
  name: string;
  generation: string;
  yearFrom: number;
  yearTo: number | null;
  aliases: string[];
  _count?: { issues: number };
};

export type CarIssue = {
  id: number;
  carModelId: number;
  engine: string | null;
  part: string;
  title: string;
  description: string;
  checkHow: string;
  severity: Severity;
  status: IssueStatus;
  sourceUrl: string | null;
  note: string | null;
};

export type CarDetail = CarModel & { issues: CarIssue[]; generalChecks: { title: string; checkHow: string }[] };

export type AiMode = "gemini" | "mock" | "off";

export type RecommendResult = {
  summary: string;
  cars: { name: string; yearRange: string; why: string; watchOut: string; carModels: { id: number; label: string }[] }[];
  nextSteps: string[];
};

export const PARTS = ["엔진", "변속기", "전장", "하체", "차체", "기타"];

/** fetch + 에러 처리. Nest는 에러를 { message: string | string[] } 모양으로 돌려줍니다. */
export async function api<T>(path: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: init?.json !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: init?.json !== undefined ? JSON.stringify(init.json) : init?.body,
    });
  } catch {
    throw new Error(`API 서버(${API_URL})에 연결할 수 없습니다. api 폴더에서 pnpm start:dev를 실행했는지 확인하세요.`);
  }
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = Array.isArray(data.message) ? data.message.join(", ") : data.message;
    throw new Error(message ?? `요청 실패 (${res.status})`);
  }
  return data as T;
}

export const yearText = (c: Pick<CarModel, "yearFrom" | "yearTo">) => `${c.yearFrom}~${c.yearTo ?? "현재"}`;
