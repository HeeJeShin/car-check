// 모바일 안쪽 화면의 상단 줄: 뒤로 가기 + 가운데 제목 + 닫기(처음으로).
// 이 줄이 있으면 모바일에서는 공통 헤더 대신 이것만 보입니다(.page-bar → SiteHeader). PC에서는 공통 헤더만 보입니다.
// PC에서 필요한 제목과 동작은 공통 헤더 아래에 줄을 만들지 않고 본문의 PcPageTitle에 둡니다.
import Link from "next/link";

type Props = {
  back: string;
  backLabel: string;
  title: string;
  /** 진행 단계 (예: 1/3). 제목 옆에 작게 붙습니다. */
  step?: string;
  /** 닫기 버튼 대신 오른쪽에 둘 내용 */
  right?: React.ReactNode;
};

const iconBtn = "flex h-11 w-11 items-center justify-center text-ink";

export function PageBar({ back, backLabel, title, step, right }: Props) {
  return (
    <div className="page-bar sticky top-0 z-30 grid h-16 grid-cols-[1fr_auto_1fr] items-center border-b border-line bg-white/90 px-2 backdrop-blur md:hidden">
      <Link href={back} aria-label={backLabel} className={`${iconBtn} justify-self-start`}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </Link>
      <span className="min-w-0 truncate text-[17px] font-bold">
        {title}
        {step && <span className="ml-1.5 text-[13px] font-medium text-muted">{step}</span>}
      </span>
      <div className="flex items-center justify-self-end pr-1 text-[13px] text-muted">
        {right ??
          (back !== "/" && (
            <Link href="/" aria-label="처음으로" className={iconBtn}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </Link>
          ))}
      </div>
    </div>
  );
}

/** PC 본문의 제목 줄. 모바일에서는 PageBar가 같은 역할을 하므로 숨깁니다. */
export function PcPageTitle({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <div className="hidden items-center justify-between md:flex">
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      {right && <div className="text-[13px] text-muted">{right}</div>}
    </div>
  );
}
