"use client";
// 서버가 미리 받아 둔 구글 Client ID를 로그인 패널에 넘겨 주는 통로 (app/layout.tsx에서 한 번 감쌉니다).
import { createContext, useContext } from "react";

const GoogleClientIdContext = createContext<string | null | undefined>(undefined);

export function GoogleClientIdProvider({ value, children }: { value: string | null | undefined; children: React.ReactNode }) {
  return <GoogleClientIdContext.Provider value={value}>{children}</GoogleClientIdContext.Provider>;
}

export const useGoogleClientId = () => useContext(GoogleClientIdContext);
