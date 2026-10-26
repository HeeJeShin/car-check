"use client";
// 세대·연식 선택 화면의 움직이는 부분(연식 입력으로 좁히기). 세대 목록은 서버가 미리 받아서 넘겨줍니다.
import Link from "next/link";
import { useState } from "react";
import { ChevronRight, TopBar, fieldCls } from "@/components/ui";
import { BODY_LABEL, yearText, type CarModel } from "@/lib/api";

export function GenerationList({ maker, name, gens }: { maker: string; name: string; gens: CarModel[] }) {
  const [year, setYear] = useState("");

  // 연식을 입력하면 그 해가 판매 기간 안에 있는 세대만 남깁니다(같은 해에 두 세대가 겹칠 수 있음).
  const y = Number(year);
  const filtered = year.length === 4 ? gens.filter((g) => g.yearFrom <= y && (g.yearTo === null || g.yearTo >= y)) : gens;

  return (
    <>
      <TopBar back="/cars" backLabel="차종 다시 고르기" right="2 / 3 단계" />
      <section className="flex flex-col gap-3.5 bg-white px-5 pt-7 pb-5">
        <span className="text-[13px] font-medium text-muted">{maker} · {name}</span>
        <h1 className="text-2xl font-bold tracking-tight">몇 년식 {name}인가요?</h1>
        <p className="text-sm leading-relaxed text-body">같은 {name}라도 나온 시기(세대)마다 고질병이 달라요. 사려는 차의 이름과 연식 구간을 골라주세요.</p>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] text-muted">연식을 알면 입력하세요 (선택)</span>
          <input inputMode="numeric" maxLength={4} placeholder="예: 2017" value={year} onChange={(e) => setYear(e.target.value.replace(/\D/g, ""))} className={fieldCls} />
        </label>
      </section>

      <section className="flex flex-col gap-3 p-5">
        <p className="text-sm font-bold">{year.length === 4 ? `${year}년식에 해당하는 ${name} ${filtered.length}개` : "전체 세대"}</p>
        {filtered.map((g) => (
          <Link key={g.id} href={`/cars/${g.id}`} className="flex items-center gap-3.5 rounded-[14px] border border-line bg-white p-4 hover:border-accent">
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="text-base font-bold">
                {g.displayName} <span className="font-medium text-body">({yearText(g)})</span>
              </span>
              <span className="text-xs text-muted">{BODY_LABEL[g.bodyType]}</span>
            </span>
            <ChevronRight className="text-faint" />
          </Link>
        ))}
        {filtered.length === 0 && <p className="rounded-[14px] bg-white p-4 text-sm text-body">그 연식의 {name}는 아직 등록되지 않았어요.</p>}

        <div className="mt-2 flex flex-col gap-1.5 rounded-[14px] bg-accent-soft p-4 text-accent-dark">
          <p className="text-sm font-bold">세대를 잘 모르겠다면</p>
          <p className="text-[13px] leading-relaxed">판매 글이나 차량등록증의 &apos;최초등록일&apos;을 보고 연식을 입력하세요. 한 해에 두 세대가 겹치면 둘 다 보여드리니, 차 앞모습 사진으로 구분하면 돼요.</p>
        </div>
      </section>
    </>
  );
}
