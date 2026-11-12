"use client";

import { useActionState } from "react";
import { login } from "../actions";

export default function AdminLogin() {
  const [result, submit, pending] = useActionState(login, { message: "" });
  return <section className="shell service-section lookup-section">
    <h1>관리자 로그인</h1>
    <form className="consult-fields" action={submit}>
      <label>관리자 이메일<input name="email" type="email" autoComplete="username" maxLength={254} required /></label>
      <label>비밀번호<input name="password" type="password" autoComplete="current-password" maxLength={256} required /></label>
      <button className="nav-button" disabled={pending}>로그인</button>
      {result.message && <p role="status">{result.message}</p>}
    </form>
  </section>;
}



