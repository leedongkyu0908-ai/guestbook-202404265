"use client";

import { useState, useTransition, type FormEvent } from "react";
import { createEntryAction } from "./actions";
import type { FieldErrors } from "@/lib/guestbook";
import { LIMITS } from "@/lib/limits";

export function EntryForm() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await createEntryAction(formData);
      if (result.ok) {
        setName("");
        setMessage("");
        setPassword("");
        setErrors({});
      } else {
        setErrors(result.errors);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mb-10 flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Field label="이름" error={errors.name} className="flex-1">
          <input
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={LIMITS.name.max}
            className={inputClass}
          />
        </Field>
        <Field label="비밀번호" error={errors.password} className="flex-1">
          <input
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={LIMITS.password.min}
            maxLength={LIMITS.password.max}
            autoComplete="new-password"
            className={inputClass}
          />
        </Field>
      </div>
      <Field label="메시지" error={errors.message}>
        <textarea
          name="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          maxLength={LIMITS.message.max}
          rows={3}
          className={inputClass}
        />
      </Field>
      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "남기는 중…" : "남기기"}
      </button>
    </form>
  );
}

export const inputClass =
  "w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700";

const buttonBase = "self-end rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50";
export const buttonClass = `${buttonBase} bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900`;
export const dangerButtonClass = `${buttonBase} bg-red-600 text-white`;

export function Field({
  label,
  error,
  className,
  children,
}: {
  label: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`flex flex-col gap-1 text-sm ${className ?? ""}`}>
      <span className="font-medium">{label}</span>
      {children}
      {error && <span className="text-red-600">{error}</span>}
    </label>
  );
}
