import { describe, expect, it } from "vitest";
import { driveSteps, powertrainTips } from "./powertrain-tips";

describe("스펙 → 주의점 (공통 규칙)", () => {
  it("DCT 디젤이면 미션 주의점 1개 + 디젤 주의점 2개(운행 패턴, 엔진 커버 아래)가 붙는다", () => {
    const tips = powertrainTips([{ engine: "1.7 디젤", fuel: "DIESEL", transmission: "DCT" }]);
    expect(tips.map((t) => t.tag)).toEqual(["미션", "엔진", "엔진"]);
    expect(tips[0].text).toContain("꿀렁거림");
    expect(tips[2].text).toContain("인젝터");
  });

  it("같은 미션·연료가 여러 엔진에 있어도 주의점은 한 번만", () => {
    const tips = powertrainTips([
      { engine: "1.7 디젤", fuel: "DIESEL", transmission: "DCT" },
      { engine: "2.0 디젤", fuel: "DIESEL", transmission: "AT" },
    ]);
    expect(tips.filter((t) => t.tag === "엔진")).toHaveLength(2);
    expect(tips.filter((t) => t.tag === "미션")).toHaveLength(2);
  });

  it("가솔린은 연료 주의점이 없다", () => {
    expect(powertrainTips([{ engine: "2.0", fuel: "GASOLINE", transmission: "AT" }]).map((t) => t.tag)).toEqual(["미션"]);
  });

  it("DCT 차는 시운전 '가다 서다' 단계가 강조된다", () => {
    const steps = driveSteps([{ engine: "1.7 디젤", fuel: "DIESEL", transmission: "DCT" }]);
    expect(steps.filter((s) => s.focus).map((s) => s.title)).toEqual(["천천히 가다 서다 반복"]);
  });

  it("전기차는 감속기 주의점 + 배터리 주의점 3개(SOH, 보증·리콜, 하부·충전구)가 붙고, 변속 충격 얘기는 없다", () => {
    const tips = powertrainTips([{ engine: "77.4kWh 전기", fuel: "EV", transmission: "REDUCER" }]);
    expect(tips.map((t) => t.tag)).toEqual(["미션", "엔진", "엔진", "엔진"]);
    expect(tips[0].text).toContain("감속기");
    expect(tips[1].text).toContain("SOH");
  });
});
