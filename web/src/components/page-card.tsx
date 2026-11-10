// 가운데 카드 틀: 차종·연식 고르기와 로그인 화면이 함께 씁니다. PC에서는 흰 화면 가운데 테두리 카드, 모바일에서는 카드 없이 전체 화면으로 보입니다.
// .page-card가 있으면 app/layout.tsx가 본문 틀의 회색 배경과 양옆 선을 뺍니다.
export function PageCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-card flex-1 bg-white md:py-12">
      <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-5 pt-7 pb-8 md:rounded-xl md:border md:border-line md:px-10 md:py-12">{children}</div>
    </div>
  );
}
