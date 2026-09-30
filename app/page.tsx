import { connection } from "next/server";
import { getGuestbook } from "@/lib/db";
import { formatKst } from "@/lib/format";
import { EntryForm } from "./entry-form";
import { EntryItem } from "./entry-item";

export default async function Home() {
  await connection();
  const entries = await getGuestbook().listEntries();

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">방명록</h1>
        <p className="mt-2 text-sm text-zinc-500">개발자: 이동규 (202404265)</p>
      </header>

      <EntryForm />

      {entries.length === 0 ? (
        <p className="py-12 text-center text-zinc-500">아직 글이 없습니다.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {entries.map((entry) => (
            <EntryItem
              key={entry.id}
              id={entry.id}
              name={entry.name}
              message={entry.message}
              createdAt={formatKst(entry.createdAt)}
              updatedAt={entry.updatedAt && formatKst(entry.updatedAt)}
            />
          ))}
        </ul>
      )}
    </main>
  );
}
