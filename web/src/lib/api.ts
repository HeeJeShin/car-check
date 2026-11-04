// API(car-check/api) 호출 함수와 응답 타입을 한곳에 모아 둡니다.
// 화면 컴포넌트는 fetch URL을 몰라도 되고, API가 바뀌면 이 파일만 고치면 됩니다.

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3200";

export type Severity = "LOW" | "MEDIUM" | "HIGH";
export type IssueStatus = "DRAFT" | "IN_REVIEW" | "VERIFIED" | "REJECTED";
export type Fuel = "GASOLINE" | "DIESEL" | "LPG" | "HYBRID" | "EV";
export type Transmission = "AT" | "DCT" | "CVT" | "MT" | "REDUCER";
export type BodyType = "SEDAN" | "SUV" | "LIGHT" | "VAN";

export type ModelCard = { maker: string; name: string; segment: string | null; bodyType: BodyType; aliases: string[]; generations: number };

export type CarModel = {
  id: number;
  maker: string;
  name: string;
  displayName: string;
  generation: string;
  segment: string | null;
  bodyType: BodyType;
  yearFrom: number;
  yearTo: number | null;
  aliases: string[];
  _count?: { issues: number };
};

export type Powertrain = { id: number; engine: string; fuel: Fuel; transmission: Transmission; gearbox: string | null; drive: string | null };
export type Tip = { tag: "미션" | "엔진"; text: string };

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
  /** 운영자가 답변한 제보만 (사용자 화면 GET /cars/:id) */
  reports?: PublicReport[];
  _count?: { reports: number };
};

// "틀린 내용 있어요" 체크박스. 서버(api/src/issues/dto/report.dto.ts)와 같은 키·문구.
export const REPORT_REASONS = {
  YEAR: "연식·세대가 달라요",
  ENGINE: "엔진·미션이 달라요",
  SYMPTOM: "증상 설명이 틀려요",
  CHECK: "확인 방법이 틀려요",
  SEVERITY: "심각도가 과장되거나 축소됐어요",
  FIXED: "이미 해결됐어요 (리콜·개선품)",
  OTHER: "기타",
} as const;
export type ReportReason = keyof typeof REPORT_REASONS;

export type PublicReport = { id: number; reasons: ReportReason[]; comment: string | null; answer: string; answeredAt: string; createdAt: string };

/** 관리 화면 방문 통계 (GET /stats?days=30) */
export type VisitStats = {
  days: number;
  totals: { views: number; visitors: number; reports: number };
  daily: { day: string; views: number; visitors: number }[];
  topCars: { id: number; maker: string; displayName: string; yearFrom: number; yearTo: number | null; views: number }[];
  referrers: { host: string; views: number }[];
  devices: Record<string, number>;
};

/** 관리 화면 제보함 (GET /issues/reports) */
export type AdminReport = {
  id: number;
  issueId: number;
  reasons: ReportReason[];
  comment: string | null;
  sourceUrl: string | null;
  answer: string | null;
  answeredAt: string | null;
  createdAt: string;
  issue: { id: number; title: string; carModel: { id: number; displayName: string; yearFrom: number; yearTo: number | null } };
  answeredBy: { name: string } | null;
};

/** 관리 화면용 고질병: 반려 포함 + 변경 이력 + 지금 내가 누를 수 있는 심사 버튼 (GET /issues?carModelId=) */
export type AdminIssue = CarIssue & {
  editable: boolean;
  actions: { to: IssueStatus; label: string; needs: "reason" | "sourceUrl" | null }[];
  history: {
    id: number;
    action: "CREATED" | "UPDATED" | "STATUS_CHANGED";
    fromStatus: IssueStatus | null;
    toStatus: IssueStatus | null;
    reason: string | null;
    changes: Record<string, [string | null, string | null]> | null;
    createdAt: string;
    user: { name: string; email: string };
  }[];
};

export const STATUS_LABEL: Record<IssueStatus, string> = { DRAFT: "초안", IN_REVIEW: "검토 중", VERIFIED: "검증됨", REJECTED: "반려" };

export type CarReport = CarModel & {
  powertrains: Powertrain[];
  tips: Tip[];
  issues: CarIssue[];
  generalChecks: { title: string; checkHow: string }[];
};

export type InspectionPoint = { id: number; no: number; x: number; y: number; title: string; look: string; bad: string; mine: boolean };

export type Inspection = {
  car: Pick<CarModel, "id" | "maker" | "name" | "displayName" | "yearFrom" | "yearTo">;
  powertrains: Powertrain[];
  tips: Tip[];
  /** 전기차 점검 (차 밑 배터리 팩, SOH 진단 …). 전기차 엔진이 없는 세대면 빈 배열 */
  evChecks: { title: string; how: string; bad: string }[];
  points: InspectionPoint[];
  driveSteps: { title: string; how: string; focus: boolean }[];
  transmissionGuide: { transmission: Transmission; label: string; feel: string; mine: boolean }[];
};

export type AiMode = "gemini" | "mock" | "off";

export type RecommendResult = {
  summary: string;
  cars: { name: string; yearRange: string; why: string; watchOut: string; carModels: { id: number; label: string; maker: string; name: string }[] }[];
  nextSteps: string[];
};

export const PARTS = ["엔진", "변속기", "전장", "하체", "차체", "기타"];
export const FUEL_LABEL: Record<Fuel, string> = { GASOLINE: "가솔린", DIESEL: "디젤", LPG: "LPG", HYBRID: "하이브리드", EV: "전기" };
export const BODY_LABEL: Record<BodyType, string> = { SUV: "RV/SUV", SEDAN: "세단", LIGHT: "경차", VAN: "승합" };
export const TRANSMISSION_LABEL: Record<Transmission, string> = { AT: "자동", DCT: "DCT", CVT: "CVT", MT: "수동", REDUCER: "감속기(전기차)" };

// ── 관리 화면 로그인 ──
// 로그인 토큰은 이 브라우저에만 저장하고, api()가 요청마다 붙여 보냅니다. (서버에서 도는 조회 화면은 토큰 없이 호출)
export type Role = "ADMIN" | "EDITOR";
export type AuthUser = { id: number; email: string; name: string; picture: string | null; role: Role };
export type AuthConfig = { googleClientId: string | null; devLogin: boolean };

const TOKEN_KEY = "jungu-admin-token";
export function loginToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}
export function saveLoginToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {}
}

/** API가 실패 응답을 줬을 때. status로 404(없는 차종) 같은 경우를 구분합니다. */
export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

/** fetch + 에러 처리. Nest는 에러를 { message: string | string[] } 모양으로 돌려줍니다. */
export async function api<T>(path: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  let res: Response;
  try {
    const token = loginToken();
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        ...(init?.json !== undefined && { "Content-Type": "application/json" }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: init?.json !== undefined ? JSON.stringify(init.json) : init?.body,
    });
  } catch {
    throw new Error(`API 서버(${API_URL})에 연결할 수 없습니다. pnpm dev로 API를 실행했는지 확인하세요.`);
  }
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = Array.isArray(data.message) ? data.message.join(", ") : data.message;
    throw new ApiError(message ?? `요청 실패 (${res.status})`, res.status);
  }
  return data as T;
}

export const yearText = (c: { yearFrom: number; yearTo: number | null }) => `${c.yearFrom}~${c.yearTo ?? "현재"}`;

/** 세대 선택 화면 주소. 쿼리스트링(?maker=)이 아니라 경로로 둬야 화면을 미리 만들어 둘(ISR) 수 있습니다. */
export const generationsHref = (maker: string, name: string) => `/generations/${encodeURIComponent(maker)}/${encodeURIComponent(name)}`;
