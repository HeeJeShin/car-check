// 개인정보처리방침. 저장하는 항목이나 외부 서비스가 바뀌면 이 화면도 함께 고칩니다.
import type { Metadata } from "next";
import { PageBar } from "@/components/page-bar";
import { Card } from "@/components/ui";

export const metadata: Metadata = {
  title: "개인정보처리방침 | 중구",
  description: "중구가 수집하는 개인정보 항목과 이용 목적, 보유 기간, 삭제 방법을 안내합니다.",
};

const CONTACT = "heeheehee.hj@gmail.com";

const COLLECTED = [
  { name: "회원가입·구글 로그인", items: "이메일, 이름, 프로필 사진, 가입 일시, 최근 로그인 일시, 개인정보 수집·이용 동의 일시", purpose: "본인 확인, 내 차량 제공", keep: "회원탈퇴 시 즉시 파기" },
  { name: "내 차량", items: "담은 차종(세대), 담은 일시", purpose: "내 차량 목록 제공", keep: "차량 삭제 또는 회원탈퇴 시 즉시 파기" },
  { name: "틀린 내용 제보 (로그인 없음)", items: "고른 사유, 직접 쓴 의견, 근거 링크", purpose: "정보 수정과 답변", keep: "서비스 운영 기간 동안 보관, 삭제 요청 시 파기" },
  { name: "방문 통계", items: "본 화면 주소, 들어온 사이트 도메인, 기기 종류(모바일·PC), 방문자 구분값", purpose: "많이 보는 차종과 이용 현황 파악", keep: "서비스 운영 기간 동안 보관" },
  { name: "AI 차량 추천", items: "입력한 문장", purpose: "차량 추천, 같은 질문의 답변 재사용", keep: "서버 메모리에 최대 1일 보관 후 삭제" },
];

const TRANSFERS = [
  { name: "Vercel Inc.", job: "웹 화면 제공", place: "미국 등 전 세계 서버", items: "서비스 이용 시 전송되는 접속 정보" },
  { name: "Render Services, Inc.", job: "API 서버 운영", place: "싱가포르", items: "위 표의 항목, 접속 정보" },
  { name: "Neon, Inc.", job: "데이터베이스 보관", place: "싱가포르(AWS)", items: "위 표에서 저장하는 항목" },
  { name: "Google LLC", job: "구글 로그인, AI 차량 추천(Gemini)", place: "미국 등", items: "로그인 정보, AI 추천에 입력한 문장" },
  { name: "Functional Software, Inc. (Sentry)", job: "오류 수집과 분석", place: "미국 등", items: "오류 내용, 브라우저 등 접속 환경" },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2.5">
      <h2 className="text-base font-bold">{title}</h2>
      <div className="flex flex-col gap-2.5 text-sm leading-relaxed text-body">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 text-[13px] leading-relaxed">
      <dt className="w-14 flex-none text-muted">{label}</dt>
      <dd className="min-w-0 text-body">{value}</dd>
    </div>
  );
}

export default function PrivacyPage() {
  return (
    <>
      <PageBar back="/" backLabel="처음으로" title="개인정보처리방침" />
      <article className="flex flex-col gap-7 bg-white px-5 py-7">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">개인정보처리방침</h1>
          <p className="text-sm leading-relaxed text-body">중구는 서비스 제공에 필요한 개인정보만 처리하며, 그 항목과 이용 목적, 파기 방법을 아래와 같이 안내합니다.</p>
        </header>

        <Section title="1. 처리하는 항목과 목적, 보유 기간">
          {COLLECTED.map((c) => (
            <Card key={c.name} className="p-3.5">
              <p className="mb-1.5 text-sm font-bold text-ink">{c.name}</p>
              <dl className="flex flex-col gap-1">
                <Row label="항목" value={c.items} />
                <Row label="목적" value={c.purpose} />
                <Row label="보유" value={c.keep} />
              </dl>
            </Card>
          ))}
          <p>요청이 몰리는 것을 막기 위해 IP 주소를 서버 메모리에서 잠시 사용하지만 데이터베이스에 저장하지 않습니다. 방문자 구분값은 날짜, IP 주소, 브라우저 정보를 섞은 해시값이며 날짜가 바뀌면 달라집니다. 비밀번호는 받지 않습니다.</p>
        </Section>

        <Section title="2. 제3자 제공">
          <p>이용자의 개인정보를 제3자에게 판매하거나 제공하지 않습니다. 다만 법령에 따라 요구받은 경우는 예외로 합니다.</p>
        </Section>

        <Section title="3. 처리 위탁과 국외 이전">
          <p>서비스 운영을 위해 아래 업체에 처리를 맡기며, 서비스를 이용할 때 인터넷을 통해 해당 국가로 전송됩니다. 보유 기간은 위탁 계약 종료 또는 위 1번의 기간까지입니다. 이전을 원하지 않으면 로그인과 AI 차량 추천을 사용하지 않을 수 있습니다.</p>
          {TRANSFERS.map((t) => (
            <Card key={t.name} className="p-3.5">
              <p className="mb-1.5 text-sm font-bold text-ink">{t.name}</p>
              <dl className="flex flex-col gap-1">
                <Row label="업무" value={t.job} />
                <Row label="위치" value={t.place} />
                <Row label="항목" value={t.items} />
              </dl>
            </Card>
          ))}
        </Section>

        <Section title="4. 파기 절차와 방법">
          <p>보유 기간이 끝나거나 삭제 요청을 받으면 데이터베이스에서 지체 없이 삭제합니다. 내 차량 화면에서 회원탈퇴를 하면 계정 정보와 담아 둔 차가 바로 지워집니다.</p>
        </Section>

        <Section title="5. 이용자의 권리">
          <p>이용자는 자신의 개인정보를 열람, 정정, 삭제하거나 처리 정지를 요청할 수 있습니다. 내 차량 화면에서 담은 차를 삭제하거나 회원탈퇴를 직접 할 수 있고, 그 밖의 요청은 아래 이메일로 보내 주시면 지체 없이 처리합니다.</p>
        </Section>

        <Section title="6. 브라우저 저장 정보">
          <p>중구는 쿠키를 사용하지 않습니다. 로그인 상태와 매장 체크리스트는 이용자의 브라우저 저장소(localStorage)에 저장되며 브라우저에서 직접 지울 수 있습니다. 구글 로그인 버튼은 구글의 정책을 따릅니다.</p>
        </Section>

        <Section title="7. 안전성 확보 조치">
          <p>모든 통신은 HTTPS로 암호화하며, 관리 기능은 권한이 있는 계정만 사용할 수 있습니다.</p>
        </Section>

        <Section title="8. 만 14세 미만 아동">
          <p>만 14세 미만 아동을 대상으로 하지 않으며, 만 14세 미만의 계정임을 알게 되면 해당 정보를 삭제합니다.</p>
        </Section>

        <Section title="9. 개인정보 보호책임자">
          <p>성명: 신희제<br />이메일: <a href={`mailto:${CONTACT}`} className="underline">{CONTACT}</a></p>
          <p>개인정보 침해 상담은 개인정보침해신고센터(국번 없이 118), 개인정보 분쟁조정위원회(1833-6972)에서도 받을 수 있습니다.</p>
        </Section>

        <p className="text-[13px] text-muted">시행일: 2026년 11월 10일</p>
      </article>
    </>
  );
}
