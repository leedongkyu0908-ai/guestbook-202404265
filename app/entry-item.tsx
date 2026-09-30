"use client";

import { useState, useTransition, type FormEvent } from "react";
import { deleteEntryAction, updateMessageAction } from "./actions";
import { buttonClass, dangerButtonClass, Field, inputClass } from "./entry-form";
import { LIMITS } from "@/lib/limits";

type Props = {
  id: number;
  name: string;
  message: string;
  createdAt: string;
  updatedAt: string | null;
};

type Mode = "view" | "edit" | "delete";

type Failure = { reason: "invalid"; errors: { message?: string } } | { reason: "wrong-password" | "not-found" };

const FAILURE_TEXT = {
  "wrong-password": "비밀번호가 일치하지 않습니다.",
  "not-found": "이미 삭제된 글입니다.",
} as const;

export function EntryItem({ id, name, message, createdAt, updatedAt }: Props) {
  const [mode, setMode] = useState<Mode>("view");
  const [draft, setDraft] = useState(message);
  const [password, setPassword] = useState("");
  const [failure, setFailure] = useState<Failure | null>(null);
  const [pending, startTransition] = useTransition();

  function open(next: Mode) {
    setMode(next);
    setDraft(message);
    setPassword("");
    setFailure(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const action = mode === "edit" ? updateMessageAction : deleteEntryAction;
    startTransition(async () => {
      const result = await action(formData);
      if (result.ok) open("view");
      else setFailure(result);
    });
  }

  return (
    <li className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-semibold">{name}</p>
        <p className="text-xs text-zinc-500">
          {createdAt}
          {updatedAt && <span> (수정됨 · {updatedAt})</span>}
        </p>
      </div>

      {mode !== "edit" && <p className="mt-2 whitespace-pre-wrap break-words">{message}</p>}

      {mode === "view" ? (
        <div className="mt-3 flex justify-end gap-2 text-sm">
          <button type="button" onClick={() => open("edit")} className="text-zinc-600 hover:underline dark:text-zinc-400">
            수정
          </button>
          <button type="button" onClick={() => open("delete")} className="text-red-600 hover:underline">
            삭제
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-3">
          <input type="hidden" name="id" value={id} />
          {mode === "edit" && (
            <Field label="메시지" error={failure?.reason === "invalid" ? failure.errors.message : undefined}>
              <textarea
                name="message"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                required
                maxLength={LIMITS.message.max}
                rows={3}
                className={inputClass}
              />
            </Field>
          )}
          <Field
            label="비밀번호"
            error={failure && failure.reason !== "invalid" ? FAILURE_TEXT[failure.reason] : undefined}
          >
            <input
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={LIMITS.password.min}
              maxLength={LIMITS.password.max}
              autoComplete="current-password"
              className={inputClass}
            />
          </Field>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => open("view")} className="px-3 py-2 text-sm text-zinc-600 dark:text-zinc-400">
              취소
            </button>
            <button type="submit" disabled={pending} className={mode === "delete" ? dangerButtonClass : buttonClass}>
              {pending ? "처리 중…" : mode === "edit" ? "수정하기" : "삭제하기"}
            </button>
          </div>
        </form>
      )}
    </li>
  );
}
