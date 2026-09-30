import { neon } from "@neondatabase/serverless";
import { createGuestbook, type Sql } from "./guestbook";

let guestbook: ReturnType<typeof createGuestbook> | undefined;

export function getGuestbook() {
  if (!guestbook) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    const client = neon(url);
    const sql: Sql = (text, params) => client.query(text, params);
    guestbook = createGuestbook(sql);
  }
  return guestbook;
}
