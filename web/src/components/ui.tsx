// 여러 화면에서 같이 쓰는 작은 UI 조각들. 모양은 화면 기획 캔버스를 그대로 따릅니다.
import type { IssueStatus, Severity } from "@/lib/api";

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-[14px] border border-line bg-white ${className}`}>{children}</div>;
}

/** 사용자 화면용: 출처 있음 / 그 밖(초안·검토 중)은 "참고". 관리 화면은 상태를 그대로 보여줍니다(ReviewBadge). */
export function StatusBadge({ status }: { status: IssueStatus }) {
  return status === "VERIFIED" ? (
    <span className="rounded-md bg-success-soft px-2 py-0.5 text-xs font-bold text-success">출처 있음</span>
  ) : (
    <span className="rounded-md bg-warning-soft px-2 py-0.5 text-xs font-bold text-warning">참고</span>
  );
}

export const SEVERITY = {
  HIGH: { label: "위험 높음", text: "text-danger-text", chip: "bg-danger-soft text-danger-strong" },
  MEDIUM: { label: "주의", text: "text-caution", chip: "bg-caution-soft text-caution-strong" },
  LOW: { label: "참고", text: "text-muted", chip: "bg-chip text-body" },
} as const;

export function SeverityText({ severity }: { severity: Severity }) {
  return <span className={`text-xs font-bold ${SEVERITY[severity].text}`}>{SEVERITY[severity].label}</span>;
}

export function ErrorText({ message }: { message: string | null }) {
  if (!message) return null;
  return <p className="rounded-xl bg-danger-tint p-3 text-sm text-danger-text">{message}</p>;
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
export function Pill({ on, onClick, disabled, children }: { on: boolean; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      disabled={disabled}
      className={`min-h-11 rounded-full border px-4 text-sm disabled:opacity-50 ${on ? "border-ink bg-ink font-bold text-white" : "border-field bg-white font-medium text-ink"}`}
    >
      {children}
    </button>
  );
}

export const fieldCls = "h-12 w-full rounded-xl border border-field bg-white px-3.5 text-[15px] text-ink outline-none focus:border-primary";
