"use client";

import { useActionState } from "react";

export function InquiryForm({ connected, submitInquiry }: {
  connected: boolean;
  submitInquiry: (state: string, form: FormData) => Promise<string>;
}) {
  const [message, submit, pending] = useActionState(submitInquiry, "");

  return (
    <details className="mt-6" id="consultation">
      <summary className="game-button">문의하기</summary>
      {connected ? (
        <form className="consult-fields mt-4 max-w-xl" action={submit}>
          <label>답변 받을 이메일 또는 전화번호<input name="contact" maxLength={120} required /></label>
          <label>문의 내용<textarea name="message" maxLength={1000} rows={4} required /></label>
          <button className="game-button" disabled={pending}>문의 접수</button>
          {message && <p role="status">{message}</p>}
        </form>
      ) : <p className="section-copy">문의 접수는 상담 연결 설정 후 가능합니다.</p>}
    </details>
  );
}
