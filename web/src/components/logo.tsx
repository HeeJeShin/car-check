// 중구 로고: 빨간 글자에 검은 그림자. 그림자가 글자 크기에 비례하므로 className으로 크기만 정하면 됩니다.
// 그림자가 보여야 하니 밝은 배경 위에서 쓰세요.
export function Logo({ className = "text-2xl" }: { className?: string }) {
  return <span className={`font-bold tracking-tight text-primary text-shadow-logo ${className}`}>중구</span>;
}
