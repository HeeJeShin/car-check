// 시드 데이터용 짧은 표기 도우미: diesel("2.0", "8단 자동") → { engine: "2.0 디젤", fuel: "DIESEL", ... }
export const diesel = (engine: string, gearbox: string, transmission: "AT" | "DCT" = "AT") =>
  ({ engine: `${engine} 디젤`, fuel: "DIESEL", transmission, gearbox }) as const;
export const gasoline = (engine: string, gearbox: string, transmission: "AT" | "DCT" | "CVT" = "AT") =>
  ({ engine: `${engine} 가솔린`, fuel: "GASOLINE", transmission, gearbox }) as const;
export const hybrid = (engine: string, gearbox: string, transmission: "AT" | "DCT" = "AT") =>
  ({ engine: `${engine} 하이브리드`, fuel: "HYBRID", transmission, gearbox }) as const;
export const lpg = (engine: string, gearbox: string) =>
  ({ engine: `${engine} LPi`, fuel: "LPG", transmission: "AT", gearbox }) as const;
// 전기차: ev("롱레인지 77.4kWh", "2WD") → 변속기 대신 1단 감속기
export const ev = (battery: string, drive?: string) =>
  ({ engine: `${battery} 전기`, fuel: "EV", transmission: "REDUCER", gearbox: "1단 감속기", ...(drive && { drive }) }) as const;
