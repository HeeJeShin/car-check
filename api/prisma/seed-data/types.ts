// 시드 데이터 파일들이 공유하는 모양. Prisma 입력 타입과 같은 이름·값을 씁니다.
export type SeedPowertrain = {
  engine: string;
  fuel: "GASOLINE" | "DIESEL" | "LPG" | "HYBRID" | "EV";
  transmission: "AT" | "DCT" | "CVT" | "MT" | "REDUCER";
  gearbox?: string;
  drive?: string;
};

export type SeedCarModel = {
  maker: string;
  name: string;
  displayName: string;
  generation: string;
  segment: string;
  bodyType: "SEDAN" | "SUV" | "LIGHT" | "VAN";
  yearFrom: number;
  yearTo: number | null;
  aliases: string[];
  powertrains: readonly SeedPowertrain[];
  issues?: SeedIssue[]; // 고질병 초안(선택)
};

export type SeedIssue = {
  engine?: string;
  part: string;
  title: string;
  description: string;
  checkHow: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  note?: string;
};
