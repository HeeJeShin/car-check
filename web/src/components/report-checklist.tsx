"use client";
// 리포트 화면의 "매장에서 체크하기". 체크 상태는 이 브라우저에만 저장합니다(매장에서 새로고침해도 유지).
import { useSyncExternalStore } from "react";
import { Card } from "@/components/ui";

// localStorage를 React 상태처럼 읽습니다. 서버에서 만든 화면에는 체크가 비어 있고, 브라우저에 뜨면 저장된 체크로 바뀝니다.
// 저장이 막힌 환경(사생활 보호 모드 등)이면 그냥 넘어갑니다.
const storageKey = (id: number) => `jungu-checks-${id}`;
const listeners = new Set<() => void>();
function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener); // 다른 탭에서 바꾼 것도 반영
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}
function readRaw(id: number) {
  try {
    return localStorage.getItem(storageKey(id));
  } catch {
    return null;
  }
}
function saveChecks(id: number, checks: Record<string, boolean>) {
  try {
    localStorage.setItem(storageKey(id), JSON.stringify(checks));
  } catch {}
  listeners.forEach((l) => l());
}
function parse(raw: string | null): Record<string, boolean> {
  try {
    return JSON.parse(raw ?? "{}");
  } catch {
    return {};
  }
}

export function ReportChecklist({ carId, items }: { carId: number; items: string[] }) {
  // 문자열 그대로 비교해야 매번 새 객체로 인식되지 않습니다 → 원본 문자열을 읽고 여기서 풀어 씀
  const raw = useSyncExternalStore(subscribe, () => readRaw(carId), () => null);
  const checks = parse(raw);

  const done = items.filter((c) => checks[c]).length;
  const toggle = (label: string) => {
    saveChecks(carId, { ...checks, [label]: !checks[label] });
  };

  return (
    <section id="checklist" className="flex scroll-mt-20 flex-col gap-3 px-5 pt-2 pb-5">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-bold">매장에서 체크하기</h2>
        <span className="text-sm font-bold text-accent">{done} / {items.length}</span>
      </div>
      <Card className="flex flex-col px-4 py-1">
        {items.map((label) => (
          <label key={label} className="flex min-h-[52px] cursor-pointer items-center gap-3 border-b border-chip last:border-b-0">
            <input type="checkbox" checked={!!checks[label]} onChange={() => toggle(label)} className="h-5 w-5 flex-none accent-accent" />
            <span className={`text-[15px] ${checks[label] ? "text-faint line-through" : "text-ink"}`}>{label}</span>
          </label>
        ))}
      </Card>
    </section>
  );
}
