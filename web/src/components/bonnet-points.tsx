"use client";
// 점검 가이드의 "본넷 열고 볼 곳": 그림의 동그라미나 아래 목록을 누르면 그 포인트의 설명이 펼쳐집니다.
import { useState } from "react";
import { BonnetDiagram } from "@/components/bonnet-diagram";
import type { InspectionPoint } from "@/lib/api";

export function BonnetPoints({ points }: { points: InspectionPoint[] }) {
  const [selected, setSelected] = useState(1);
  return (
    <>
      <BonnetDiagram points={points} selected={selected} onSelect={setSelected} />
      <div className="flex flex-col gap-2">
        {points.map((p) => {
          const on = p.no === selected;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelected(p.no)}
              aria-expanded={on}
              className={`flex w-full flex-col rounded-[14px] bg-white px-3.5 py-3 text-left ${on ? "border-2 border-danger" : "border border-line"}`}
            >
              <span className="flex items-center gap-2.5">
                <span className={`flex h-7 w-7 flex-none items-center justify-center rounded-full text-[13px] font-bold ${on ? "bg-danger text-white" : "border-2 border-danger text-danger"}`}>{p.no}</span>
                <span className="text-[15px] font-bold">{p.title}</span>
                {p.mine && <span className="rounded-md bg-[#FEE2E2] px-1.5 py-0.5 text-[11px] font-bold text-[#B91C1C]">이 차 포인트</span>}
              </span>
              {on && (
                <span className="flex flex-col gap-1.5 pt-2.5 pl-[38px]">
                  <span className="text-sm leading-relaxed text-body"><strong className="text-ink">보는 법</strong> {p.look}</span>
                  <span className="text-sm leading-relaxed text-[#B91C1C]"><strong>이러면 주의</strong> {p.bad}</span>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}
