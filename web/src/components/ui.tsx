// 여러 화면에서 같이 쓰는 작은 UI 조각들.
import type { IssueStatus, Severity } from "@/lib/api";

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-white/5 ${className}`}>
      {children}
    </div>
  );
}

export function StatusBadge({ status }: { status: IssueStatus }) {
  return status === "VERIFIED" ? (
    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
      검증됨
    </span>
  ) : (
    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
      초안 · 참고용
    </span>
  );
}

const SEVERITY = {
  HIGH: { label: "위험 높음", cls: "text-red-700 dark:text-red-400" },
  MEDIUM: { label: "주의", cls: "text-orange-700 dark:text-orange-400" },
  LOW: { label: "참고", cls: "text-zinc-500" },
} as const;

export function SeverityText({ severity }: { severity: Severity }) {
  const s = SEVERITY[severity];
  return <span className={`text-xs font-semibold ${s.cls}`}>{s.label}</span>;
}

export function ErrorText({ message }: { message: string | null }) {
  if (!message) return null;
  return <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{message}</p>;
}

export const inputCls =
  "w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-white/15 dark:bg-white/5";
export const buttonCls =
  "rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50";
export const subtleButtonCls =
  "rounded-lg border border-black/15 px-3 py-1.5 text-sm hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10";
