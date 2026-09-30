import { LIMITS } from "./limits";
import { hashPassword, verifyPassword } from "./password";

export type Sql = (text: string, params?: unknown[]) => Promise<Record<string, unknown>[]>;

export type Entry = {
  id: number;
  name: string;
  message: string;
  createdAt: Date;
  updatedAt: Date | null;
};

export function createGuestbook(sql: Sql) {
  async function listEntries(): Promise<Entry[]> {
    const rows = await sql(
      "SELECT id, name, message, created_at, updated_at FROM entries ORDER BY created_at DESC, id DESC",
    );
    return rows.map(toEntry);
  }

  async function createEntry(input: { name: string; message: string; password: string }) {
    const name = input.name.trim();
    const message = normalizeMessage(input.message);
    const errors: FieldErrors = {
      name: checkLength(name, LIMITS.name, "이름"),
      message: checkLength(message, LIMITS.message, "메시지"),
      password: checkLength(input.password, LIMITS.password, "비밀번호"),
    };
    if (hasErrors(errors)) return invalid(errors);

    const { hash, salt } = await hashPassword(input.password);
    await sql(
      "INSERT INTO entries (name, message, password_hash, password_salt) VALUES ($1, $2, $3, $4)",
      [name, message, hash, salt],
    );
    return OK;
  }

  async function updateMessage(input: { id: number; password: string; message: string }) {
    const message = normalizeMessage(input.message);
    const errors: FieldErrors = { message: checkLength(message, LIMITS.message, "메시지") };
    if (hasErrors(errors)) return invalid(errors);

    const denied = await authorize(input.id, input.password);
    if (denied) return denied;

    const updated = await sql("UPDATE entries SET message = $1, updated_at = now() WHERE id = $2 RETURNING id", [
      message,
      input.id,
    ]);
    return updated.length ? OK : NOT_FOUND;
  }

  async function deleteEntry(input: { id: number; password: string }) {
    const denied = await authorize(input.id, input.password);
    if (denied) return denied;

    const deleted = await sql("DELETE FROM entries WHERE id = $1 RETURNING id", [input.id]);
    return deleted.length ? OK : NOT_FOUND;
  }

  async function authorize(id: number, password: string) {
    const [row] = await sql("SELECT password_hash, password_salt FROM entries WHERE id = $1", [id]);
    if (!row) return NOT_FOUND;
    const matches = await verifyPassword(password, String(row.password_hash), String(row.password_salt));
    return matches ? undefined : WRONG_PASSWORD;
  }

  return { listEntries, createEntry, updateMessage, deleteEntry };
}

const OK = { ok: true } as const;
const NOT_FOUND = { ok: false, reason: "not-found" } as const;
const WRONG_PASSWORD = { ok: false, reason: "wrong-password" } as const;

type Field = keyof typeof LIMITS;
export type FieldErrors = Partial<Record<Field, string>>;

/** 브라우저 폼은 textarea 줄바꿈을 \r\n으로 보내므로 \n으로 맞춘 뒤 앞뒤 공백을 지운다. */
function normalizeMessage(message: string) {
  return message.replace(/\r\n?/g, "\n").trim();
}

function checkLength(value: string, { min, max }: { min: number; max: number }, label: string) {
  const length = Array.from(value).length;
  if (length === 0) return `${label}을(를) 입력해 주세요.`;
  if (length < min) return `${label}은(는) ${min}자 이상이어야 합니다.`;
  if (length > max) return `${label}은(는) ${max}자 이하여야 합니다.`;
  return undefined;
}

function hasErrors(errors: FieldErrors) {
  return Object.values(errors).some(Boolean);
}

function invalid(errors: FieldErrors) {
  const present = Object.fromEntries(Object.entries(errors).filter(([, v]) => v)) as FieldErrors;
  return { ok: false, reason: "invalid", errors: present } as const;
}

function toEntry(row: Record<string, unknown>): Entry {
  return {
    id: Number(row.id),
    name: String(row.name),
    message: String(row.message),
    createdAt: new Date(row.created_at as string | Date),
    updatedAt: row.updated_at == null ? null : new Date(row.updated_at as string | Date),
  };
}
