// ─────────────────────────────────────────────────────────────
// 고질병 심사 흐름: 허용되는 상태 전이를 이 표 하나에만 둡니다.
// 서비스(실제로 막기)와 관리 화면(보여줄 버튼)이 모두 이 표를 봅니다. 표에 없는 전이는 전부 거절.
//
//   초안 ──검토 요청──▶ 검토 중 ──승인──▶ 검증됨
//    ▲  ◀──요청 취소──    │                │
//    │                    └──반려──▶ 반려   │
//    └──────다시 고치기──────────────┘     │
//    └──────────────검증 취소(사유 필수)────┘
// ─────────────────────────────────────────────────────────────
import type { IssueStatus, Role } from "../generated/prisma/client";

export type Transition = {
  from: IssueStatus;
  to: IssueStatus;
  label: string; // 관리 화면 버튼 이름
  roles: Role[];
  needs?: "reason" | "sourceUrl"; // 반려·검증 취소는 사유, 승인은 출처 URL
};

export const TRANSITIONS: Transition[] = [
  { from: "DRAFT", to: "IN_REVIEW", label: "검토 요청", roles: ["ADMIN", "EDITOR"] },
  { from: "IN_REVIEW", to: "DRAFT", label: "검토 요청 취소", roles: ["ADMIN", "EDITOR"] },
  { from: "IN_REVIEW", to: "VERIFIED", label: "승인 (검증됨)", roles: ["ADMIN"], needs: "sourceUrl" },
  { from: "IN_REVIEW", to: "REJECTED", label: "반려", roles: ["ADMIN"], needs: "reason" },
  { from: "REJECTED", to: "DRAFT", label: "다시 고치기", roles: ["ADMIN", "EDITOR"] },
  { from: "VERIFIED", to: "DRAFT", label: "검증 취소", roles: ["ADMIN"], needs: "reason" },
];

export const STATUS_LABEL: Record<IssueStatus, string> = { DRAFT: "초안", IN_REVIEW: "검토 중", VERIFIED: "검증됨", REJECTED: "반려" };

/** 내용(제목·설명 …)을 고칠 수 있는 상태. 검토 중·검증된 정보는 먼저 되돌린 뒤 고칩니다(심사 받은 내용이 몰래 바뀌지 않게). */
export const EDITABLE: IssueStatus[] = ["DRAFT", "REJECTED"];

export const findTransition = (from: IssueStatus, to: IssueStatus) => TRANSITIONS.find((t) => t.from === from && t.to === to);

/** 이 사람이 지금 상태에서 할 수 있는 전이 (관리 화면 버튼) */
export const availableTransitions = (from: IssueStatus, role: Role) => TRANSITIONS.filter((t) => t.from === from && t.roles.includes(role));
