// 공통 버튼. 모양은 variant(색)와 size(크기)로 고릅니다. 누르는 동작은 Button, 다른 화면으로 가는 링크는 LinkButton을 씁니다.
import Link from "next/link";
import type { ComponentProps } from "react";

const VARIANTS = {
  primary: "bg-primary text-white hover:bg-primary-hover",
  secondary: "border border-field bg-white text-ink hover:bg-chip",
  ink: "bg-ink text-white hover:bg-ink-hover",
  inverse: "bg-white text-primary hover:bg-primary-soft", // 빨간 배경 위
} as const;

const SIZES = {
  lg: "w-full rounded-xl p-4 text-base", // 화면의 주요 동작
  md: "w-full rounded-xl p-3.5 text-[15px]", // lg 아래의 보조 동작
  sm: "min-h-11 rounded-xl px-4 text-sm", // 폼·카드 안
  xs: "rounded-lg px-3 py-1.5 text-sm", // 관리 화면의 작은 동작
  nav: "min-h-11 rounded-full px-5 text-sm", // 헤더
  hero: "min-h-14 rounded-full px-7 text-base", // 메인 화면
} as const;

type Style = { variant?: keyof typeof VARIANTS; size?: keyof typeof SIZES; className?: string };

function buttonClass({ variant = "primary", size = "lg", className = "" }: Style) {
  const weight = variant === "secondary" && size !== "hero" ? "font-medium" : "font-bold";
  return `inline-flex items-center justify-center text-center disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${weight} ${className}`;
}

export function Button({ variant, size, className, ...props }: Style & ComponentProps<"button">) {
  return <button {...props} className={buttonClass({ variant, size, className })} />;
}

export function LinkButton({ variant, size, className, ...props }: Style & ComponentProps<typeof Link>) {
  return <Link {...props} className={buttonClass({ variant, size, className })} />;
}
