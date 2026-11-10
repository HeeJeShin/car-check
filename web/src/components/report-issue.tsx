"use client";
// 고질병 카드의 "틀린 내용 있어요". 무엇이 틀렸는지 체크박스로 고르고, 자세한 내용·근거 링크를 남깁니다.
// 로그인 없이 보내고(서버가 IP당 1시간 5건까지), 운영자가 답변을 달면 카드 아래에 공개됩니다.
import { useState } from "react";
import { ApiError, REPORT_REASONS, type ReportReason, api } from "@/lib/api";
import { fieldCls } from "@/components/ui";
import { Button } from "@/components/button";

const REASONS = Object.entries(REPORT_REASONS) as [ReportReason, string][];

export function ReportIssue({ issueId }: { issueId: number }) {
  const [open, setOpen] = useState(false);
  const [reasons, setReasons] = useState<ReportReason[]>([]);
  const [comment, setComment] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const toggle = (r: ReportReason) => setReasons((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));
  const needsComment = reasons.includes("OTHER") && !comment.trim();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      await api(`/issues/${issueId}/reports`, {
        method: "POST",
        json: { reasons, comment: comment.trim() || undefined, sourceUrl: sourceUrl.trim() || undefined },
      });
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "보내지 못했어요. 잠시 뒤에 다시 시도해주세요.");
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return <p className="rounded-[10px] bg-chip p-3 text-sm text-body">고마워요! 확인하고 답변을 달아 드릴게요. 답변이 달리면 이 카드 아래에 보여요.</p>;
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="self-start text-xs font-medium text-muted underline underline-offset-2">
        틀린 내용 있어요
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 rounded-[10px] border border-line bg-chip p-3">
      <p className="text-sm font-bold">어떤 내용이 틀렸나요? (여러 개 골라도 돼요)</p>
      <div className="flex flex-col gap-2">
        {REASONS.map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 text-sm text-body">
            <input type="checkbox" checked={reasons.includes(key)} onChange={() => toggle(key)} className="h-4 w-4 accent-primary" />
            {label}
          </label>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={1000}
        rows={3}
        placeholder={reasons.includes("OTHER") ? "어떤 내용이 틀렸는지 적어주세요 (필수)" : "자세한 내용 (선택) 예: 2022년식부터 개선품이 들어갔어요"}
        className="w-full rounded-xl border border-field bg-white p-3 text-[15px] outline-none focus:border-primary"
      />
      <input
        value={sourceUrl}
        onChange={(e) => setSourceUrl(e.target.value)}
        type="url"
        maxLength={500}
        placeholder="근거 링크 (선택) https://"
        className={fieldCls}
      />
      {error && <p className="text-sm text-danger-text">{error}</p>}
      <div className="flex gap-2">
        <Button type="button" variant="secondary" size="sm" className="flex-1" onClick={() => setOpen(false)}>
          취소
        </Button>
        <Button type="submit" size="sm" className="flex-1" disabled={sending || reasons.length === 0 || needsComment}>
          {sending ? "보내는 중…" : "제보 보내기"}
        </Button>
      </div>
    </form>
  );
}
