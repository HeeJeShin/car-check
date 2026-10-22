// 본넷(엔진룸)을 위에서 본 그림 + 빨간 동그라미 점검 포인트.
// 동그라미 위치는 DB의 x, y(퍼센트). 그림 크기가 바뀌어도, 나중에 실제 사진으로 바꿔도 같은 좌표가 맞습니다.
import type { InspectionPoint } from "@/lib/api";

export function BonnetDiagram({ points, selected, onSelect }: { points: InspectionPoint[]; selected: number; onSelect: (no: number) => void }) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-[14px] border border-line bg-white px-2 pt-2.5 pb-3">
      <span className="text-xs text-muted">▲ 앞유리 쪽</span>
      {/* aspect-ratio로 그림 비율(400:240, 사진과 같은 5:3)을 고정하고, 동그라미는 퍼센트 좌표로 얹습니다. */}
      <div className="relative w-full" style={{ aspectRatio: "400 / 240" }}>
        <EngineBay />
        {points.map((p) => {
          const on = p.no === selected;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelect(p.no)}
              aria-label={`${p.no}번 ${p.title}`}
              aria-pressed={on}
              className="absolute flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center"
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
            >
              <span
                className={`flex h-[30px] w-[30px] items-center justify-center rounded-full border-[3px] border-danger text-[13px] font-bold ${
                  on ? "bg-danger text-white" : "bg-white/85 text-danger"
                } ${p.mine && !on ? "border-dashed" : ""}`}
              >
                {p.no}
              </span>
            </button>
          );
        })}
      </div>
      <span className="text-xs text-muted">▼ 차 앞쪽 (범퍼)</span>
    </div>
  );
}

/**
 * 엔진룸을 차 앞에서 본 그림(더 뉴 스포티지R 디젤 엔진룸 사진의 구도를 따라 그림).
 * 위쪽이 앞유리(와이퍼), 아래쪽이 범퍼. 장식이라 스크린리더에서는 숨깁니다.
 * 사진을 그대로 쓰지 않는 이유: 매물 사이트 사진은 저작권이 있어서.
 */
function EngineBay() {
  return (
    <svg viewBox="0 0 400 240" className="absolute inset-0 h-full w-full" aria-hidden="true">
      <defs>
        <pattern id="grille" width="4" height="4" patternUnits="userSpaceOnUse">
          <rect width="4" height="4" fill="#2A2E35" />
          <rect width="2" height="2" fill="#4A5059" />
        </pattern>
      </defs>
      {/* 엔진룸 바닥 */}
      <rect width="400" height="240" rx="14" fill="#1E2227" />

      {/* 위: 와이퍼 카울 + 카울 패널 */}
      <rect x="0" y="0" width="400" height="30" rx="14" fill="#2F343B" />
      <rect x="30" y="5" width="88" height="20" rx="3" fill="url(#grille)" />
      <rect x="130" y="11" width="80" height="12" rx="3" fill="url(#grille)" />
      <path d="M112 2 L232 14 M262 1 L344 9" stroke="#15181C" strokeWidth="4" strokeLinecap="round" />
      <circle cx="233" cy="14" r="4" fill="#15181C" />
      <rect x="10" y="30" width="380" height="24" rx="5" fill="#2A2E35" stroke="#3B4048" />
      <path d="M20 42 H380" stroke="#3B4048" strokeWidth="2" strokeDasharray="10 6" />

      {/* 왼쪽: 쇼크업소버 마운트, 냉각수 보조탱크, 워셔액, 벨트 쪽 */}
      <circle cx="58" cy="72" r="17" fill="#3A3F47" stroke="#4A5059" />
      <circle cx="58" cy="72" r="5" fill="#2A2E35" />
      <rect x="3" y="85" width="45" height="44" rx="7" fill="#E6E2D6" stroke="#B8B3A5" />
      <path d="M8 104 H44" stroke="#B8B3A5" />
      <circle cx="15" cy="89" r="6" fill="#1B1E23" />
      <rect x="20" y="148" width="22" height="26" rx="4" fill="#D9D5C9" />
      <circle cx="30" cy="149" r="9" fill="#2F6FD6" stroke="#1E4FA3" />
      <circle cx="56" cy="128" r="7" fill="#3A3F47" stroke="#6B717B" strokeWidth="2" />
      <circle cx="60" cy="146" r="5" fill="#3A3F47" stroke="#6B717B" strokeWidth="2" />
      <path d="M50 124 Q46 138 55 150 M62 124 Q66 136 64 150" stroke="#6B717B" strokeWidth="2" fill="none" />

      {/* 가운데: 엔진 커버 */}
      <path d="M72 70 Q72 64 80 64 H218 Q228 64 229 74 L232 160 Q232 172 220 172 H82 Q68 172 67 160 Z" fill="#17191D" stroke="#3D434C" strokeWidth="1.5" />
      <rect x="110" y="88" width="80" height="6" rx="3" fill="#C9CDD3" />
      <rect x="106" y="104" width="88" height="16" rx="5" fill="url(#grille)" />
      <path d="M82 132 H220" stroke="#2A2E35" strokeWidth="2" />
      <circle cx="102" cy="81" r="4" fill="none" stroke="#F2C94C" strokeWidth="2.5" />
      <circle cx="149" cy="161" r="6" fill="#2A2E35" stroke="#4A5059" />

      {/* 오른쪽: 흡기 호스, 브레이크액 통, 배터리, 에어클리너 */}
      <path d="M240 80 Q246 120 296 138" stroke="#3A3F47" strokeWidth="20" fill="none" strokeLinecap="round" />
      <path d="M240 80 Q246 120 296 138" stroke="#2A2E35" strokeWidth="20" fill="none" strokeDasharray="2 5" />
      <rect x="248" y="58" width="22" height="18" rx="4" fill="#E6E2D6" />
      <circle cx="264" cy="62" r="6" fill="#1B1E23" />
      <rect x="259" y="77" width="94" height="46" rx="5" fill="#1B1E23" stroke="#3D434C" />
      <rect x="275" y="81" width="52" height="5" rx="1" fill="#D64545" />
      <rect x="264" y="92" width="10" height="7" rx="2" fill="#6B717B" />
      <rect x="338" y="92" width="10" height="7" rx="2" fill="#6B717B" />
      <rect x="300" y="125" width="50" height="44" rx="6" fill="#2A2E35" stroke="#3B4048" />
      <rect x="352" y="94" width="36" height="62" rx="6" fill="#2A2E35" stroke="#3B4048" />
      <rect x="266" y="156" width="64" height="18" rx="3" fill="#15181C" stroke="#3B4048" />

      {/* 양옆 휀더 볼트 */}
      <circle cx="8" cy="62" r="3" fill="#6B717B" />
      <circle cx="391" cy="72" r="3" fill="#6B717B" />
      <circle cx="391" cy="150" r="3" fill="#6B717B" />

      {/* 아래: 라디에이터 서포트 패널, 라디에이터 캡, 본넷 걸쇠, 그릴 */}
      <rect x="0" y="175" width="400" height="65" fill="#262A30" />
      <rect x="0" y="175" width="400" height="10" fill="#30353D" />
      <ellipse cx="40" cy="207" rx="32" ry="18" fill="#15181C" />
      <circle cx="52" cy="212" r="8" fill="#E6E2D6" stroke="#B8B3A5" />
      <rect x="188" y="186" width="37" height="46" rx="3" fill="#15181C" />
      <rect x="193" y="210" width="27" height="8" rx="1" fill="#F2A33A" />
      <circle cx="144" cy="192" r="4" fill="#15181C" />
      <circle cx="244" cy="192" r="4" fill="#15181C" />
      <path d="M0 232 Q200 224 400 214 V240 H0 Z" fill="#9AA0A8" />
    </svg>
  );
}
