import { BadRequestException } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import { assertVerifiable } from "../issues/issues.service";
import { sortIssues } from "./cars.service";

describe("sortIssues", () => {
  it("검증된 것 먼저, 그 안에서 심각한 것 먼저", () => {
    const issues = [
      { id: 1, status: "DRAFT", severity: "HIGH" },
      { id: 2, status: "VERIFIED", severity: "LOW" },
      { id: 3, status: "VERIFIED", severity: "HIGH" },
      { id: 4, status: "DRAFT", severity: "MEDIUM" },
    ] as const;
    expect(sortIssues([...issues]).map((i) => i.id)).toEqual([3, 2, 1, 4]);
  });
});

describe("assertVerifiable", () => {
  it("출처 없이 검증됨으로 바꿀 수 없다", () => {
    expect(() => assertVerifiable("VERIFIED", null)).toThrow(BadRequestException);
    expect(() => assertVerifiable("VERIFIED", "https://example.com")).not.toThrow();
    expect(() => assertVerifiable("DRAFT", null)).not.toThrow();
  });
});
