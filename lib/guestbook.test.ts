import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { beforeEach, describe, expect, it } from "vitest";
import { createGuestbook, type Sql } from "./guestbook";

const schema = readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8");

let db: PGlite;
let guestbook: ReturnType<typeof createGuestbook>;

beforeEach(async () => {
  db = new PGlite();
  await db.exec(schema);
  const sql: Sql = async (text, params) => (await db.query(text, params)).rows as Record<string, unknown>[];
  guestbook = createGuestbook(sql);
});

describe("글 목록 조회", () => {
  it("글이 없으면 빈 목록을 돌려준다", async () => {
    expect(await guestbook.listEntries()).toEqual([]);
  });

  it("작성 시각 최신순으로 돌려주고 글 비밀번호 정보는 포함하지 않는다", async () => {
    await db.query(
      `INSERT INTO entries (name, message, password_hash, password_salt, created_at) VALUES
        ('가', '첫 글', 'h1', 's1', '2026-09-01T00:00:00Z'),
        ('다', '셋째 글', 'h3', 's3', '2026-09-03T00:00:00Z'),
        ('나', '둘째 글', 'h2', 's2', '2026-09-02T00:00:00Z')`,
    );

    const entries = await guestbook.listEntries();

    expect(entries.map((e) => e.message)).toEqual(["셋째 글", "둘째 글", "첫 글"]);
    expect(entries[0]).toEqual({
      id: expect.any(Number),
      name: "다",
      message: "셋째 글",
      createdAt: new Date("2026-09-03T00:00:00Z"),
      updatedAt: null,
    });
  });
});

describe("글 작성", () => {
  it("작성한 글이 목록 맨 위에 나타난다", async () => {
    await guestbook.createEntry({ name: "가", message: "먼저", password: "1234" });
    const result = await guestbook.createEntry({ name: "나", message: "나중", password: "abcd" });

    expect(result).toEqual({ ok: true });
    const entries = await guestbook.listEntries();
    expect(entries.map((e) => [e.name, e.message])).toEqual([
      ["나", "나중"],
      ["가", "먼저"],
    ]);
  });

  it("이름과 메시지의 앞뒤 공백을 정리해 저장하고, 메시지 안의 줄바꿈은 유지한다", async () => {
    await guestbook.createEntry({ name: "  이동규 ", message: "\n 안녕\n반가워 \n", password: "1234" });

    const [entry] = await guestbook.listEntries();
    expect(entry.name).toBe("이동규");
    expect(entry.message).toBe("안녕\n반가워");
  });

  it("브라우저가 보낸 \\r\\n 줄바꿈을 \\n으로 바꾸고, 줄바꿈 하나를 한 글자로 센다", async () => {
    const message = `${"가".repeat(249)}\r\n${"나".repeat(250)}`;

    expect(await guestbook.createEntry({ name: "가", message, password: "1234" })).toEqual({ ok: true });
    const [entry] = await guestbook.listEntries();
    expect(entry.message).toBe(`${"가".repeat(249)}\n${"나".repeat(250)}`);
  });

  const valid = { name: "이동규", message: "안녕", password: "1234" };

  it.each([
    ["이름이 비어 있음", { name: "" }, "name"],
    ["이름이 공백뿐", { name: "   " }, "name"],
    ["이름이 20자 초과", { name: "가".repeat(21) }, "name"],
    ["메시지가 비어 있음", { message: "" }, "message"],
    ["메시지가 공백뿐", { message: " \n " }, "message"],
    ["메시지가 500자 초과", { message: "가".repeat(501) }, "message"],
    ["비밀번호가 4자 미만", { password: "123" }, "password"],
    ["비밀번호가 64자 초과", { password: "a".repeat(65) }, "password"],
  ] as const)("%s이면 입력값 오류로 거부하고 저장하지 않는다", async (_, override, field) => {
    const result = await guestbook.createEntry({ ...valid, ...override });

    expect(result).toEqual({ ok: false, reason: "invalid", errors: { [field]: expect.any(String) } });
    expect(await guestbook.listEntries()).toEqual([]);
  });

  it("경계값(이름 20자, 메시지 500자, 비밀번호 4자·64자)은 허용한다", async () => {
    const edges = [
      { ...valid, name: "가".repeat(20) },
      { ...valid, message: "가".repeat(500) },
      { ...valid, password: "a".repeat(64) },
      { ...valid, password: "    " },
    ];
    for (const input of edges) {
      expect(await guestbook.createEntry(input)).toEqual({ ok: true });
    }
    expect(await guestbook.listEntries()).toHaveLength(edges.length);
  });
});

async function writeEntry(name: string, message: string, password: string) {
  await guestbook.createEntry({ name, message, password });
  const entry = (await guestbook.listEntries()).find((e) => e.message === message);
  if (!entry) throw new Error("entry not created");
  return entry;
}

describe("메시지 수정", () => {
  it("올바른 글 비밀번호로 수정하면 메시지와 수정 시각만 바뀐다", async () => {
    const first = await writeEntry("가", "첫 글", "pass1");
    const second = await writeEntry("나", "둘째 글", "pass2");

    const result = await guestbook.updateMessage({ id: first.id, password: "pass1", message: "  고친 글 " });

    expect(result).toEqual({ ok: true });
    const entries = await guestbook.listEntries();
    expect(entries.map((e) => e.id)).toEqual([second.id, first.id]);
    const updated = entries[1];
    expect(updated).toEqual({ ...first, message: "고친 글", updatedAt: expect.any(Date) });
    expect(updated.updatedAt!.getTime()).toBeGreaterThanOrEqual(first.createdAt.getTime());
  });

  it("수정할 메시지의 \\r\\n 줄바꿈도 \\n으로 바꿔 저장한다", async () => {
    const entry = await writeEntry("가", "원래 글", "pass1");

    await guestbook.updateMessage({ id: entry.id, password: "pass1", message: "첫 줄\r\n둘째 줄" });

    const [updated] = await guestbook.listEntries();
    expect(updated.message).toBe("첫 줄\n둘째 줄");
  });

  it("글 비밀번호가 틀리면 비밀번호 불일치로 거부하고 글은 그대로다", async () => {
    const entry = await writeEntry("가", "원래 글", "pass1");

    const result = await guestbook.updateMessage({ id: entry.id, password: "wrong", message: "몰래 고침" });

    expect(result).toEqual({ ok: false, reason: "wrong-password" });
    expect(await guestbook.listEntries()).toEqual([entry]);
  });

  it("다른 글의 비밀번호로는 수정할 수 없다", async () => {
    const mine = await writeEntry("가", "내 글", "mine");
    const other = await writeEntry("나", "남의 글", "other");

    const result = await guestbook.updateMessage({ id: other.id, password: "mine", message: "몰래 고침" });

    expect(result).toEqual({ ok: false, reason: "wrong-password" });
    expect(await guestbook.listEntries()).toEqual([other, mine]);
  });

  it("없는 글이면 글 없음으로 거부한다", async () => {
    const result = await guestbook.updateMessage({ id: 999, password: "1234", message: "고침" });

    expect(result).toEqual({ ok: false, reason: "not-found" });
  });

  it.each([
    ["비어 있음", " "],
    ["500자 초과", "가".repeat(501)],
  ])("새 메시지가 %s이면 입력값 오류로 거부하고 글은 그대로다", async (_, message) => {
    const entry = await writeEntry("가", "원래 글", "pass1");

    const result = await guestbook.updateMessage({ id: entry.id, password: "pass1", message });

    expect(result).toEqual({ ok: false, reason: "invalid", errors: { message: expect.any(String) } });
    expect(await guestbook.listEntries()).toEqual([entry]);
  });
});

describe("글 삭제", () => {
  it("올바른 글 비밀번호로 삭제하면 목록에서 사라진다", async () => {
    const keep = await writeEntry("가", "남길 글", "keep");
    const gone = await writeEntry("나", "지울 글", "gone");

    expect(await guestbook.deleteEntry({ id: gone.id, password: "gone" })).toEqual({ ok: true });
    expect(await guestbook.listEntries()).toEqual([keep]);
  });

  it("글 비밀번호가 틀리면 비밀번호 불일치로 거부하고 글은 그대로다", async () => {
    const entry = await writeEntry("가", "내 글", "pass1");

    expect(await guestbook.deleteEntry({ id: entry.id, password: "wrong" })).toEqual({
      ok: false,
      reason: "wrong-password",
    });
    expect(await guestbook.listEntries()).toEqual([entry]);
  });

  it("다른 글의 비밀번호로는 삭제할 수 없다", async () => {
    const mine = await writeEntry("가", "내 글", "mine");
    const other = await writeEntry("나", "남의 글", "other");

    expect(await guestbook.deleteEntry({ id: other.id, password: "mine" })).toEqual({
      ok: false,
      reason: "wrong-password",
    });
    expect(await guestbook.listEntries()).toEqual([other, mine]);
  });

  it("이미 삭제된 글이면 글 없음으로 거부한다", async () => {
    const entry = await writeEntry("가", "지울 글", "pass1");
    await guestbook.deleteEntry({ id: entry.id, password: "pass1" });

    expect(await guestbook.deleteEntry({ id: entry.id, password: "pass1" })).toEqual({
      ok: false,
      reason: "not-found",
    });
    expect(await guestbook.updateMessage({ id: entry.id, password: "pass1", message: "고침" })).toEqual({
      ok: false,
      reason: "not-found",
    });
  });
});
