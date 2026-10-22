// 여러 화면에서 같이 쓰는 작은 UI 조각들. 모양은 화면 기획 캔버스를 그대로 따릅니다.
import Link from "next/link";
import type { IssueStatus, Severity } from "@/lib/api";

/** 상단 바: 뒤로 가기 + 제목 + 오른쪽 보조 문구(단계 표시 등) */
export function TopBar({ back, backLabel, title = "중구", right }: { back: string; backLabel: string; title?: string; right?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-line bg-white px-3 py-3">
      <Link href={back} aria-label={backLabel} className="flex h-11 w-11 items-center justify-center text-ink">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </Link>
      <span className="text-lg font-bold">{title}</span>
      {right && <span className="ml-auto pr-2 text-[13px] text-muted">{right}</span>}
    </header>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-[14px] border border-line bg-white ${className}`}>{children}</div>;
}

export function StatusBadge({ status }: { status: IssueStatus }) {
  return status === "VERIFIED" ? (
    <span className="rounded-md bg-[#DCFCE7] px-2 py-0.5 text-xs font-bold text-[#166534]">검증됨</span>
  ) : (
    <span className="rounded-md bg-[#FEF3C7] px-2 py-0.5 text-xs font-bold text-[#92400E]">참고</span>
  );
}

export const SEVERITY = {
  HIGH: { label: "위험 높음", text: "text-[#B91C1C]", chip: "bg-[#FEE2E2] text-[#991B1B]" },
  MEDIUM: { label: "주의", text: "text-[#C2410C]", chip: "bg-[#FFEDD5] text-[#9A3412]" },
  LOW: { label: "참고", text: "text-muted", chip: "bg-chip text-body" },
} as const;

export function SeverityText({ severity }: { severity: Severity }) {
  return <span className={`text-xs font-bold ${SEVERITY[severity].text}`}>{SEVERITY[severity].label}</span>;
}

export function ErrorText({ message }: { message: string | null }) {
  if (!message) return null;
  return <p className="rounded-xl bg-[#FEF2F2] p-3 text-sm text-[#B91C1C]">{message}</p>;
}

export function Loading() {
  return <p className="p-5 text-sm text-muted">불러오는 중…</p>;
}

export function ChevronRight({ className = "" }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

/** 알약 모양 선택 버튼 (제조사 탭, 용도 칩) */
export function Pill({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`min-h-11 rounded-full border px-4 text-sm ${on ? "border-ink bg-ink font-bold text-white" : "border-field bg-white font-medium text-ink"}`}
    >
      {children}
    </button>
  );
}

export const primaryBtn = "block w-full rounded-xl bg-accent p-4 text-center text-base font-bold text-white hover:bg-accent-dark disabled:opacity-50";
export const secondaryBtn = "block w-full rounded-xl border border-field bg-white p-3.5 text-center text-[15px] font-medium text-ink";
export const fieldCls = "h-12 w-full rounded-xl border border-field bg-white px-3.5 text-[15px] text-ink outline-none focus:border-accent";
