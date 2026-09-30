"use server";

import { refresh } from "next/cache";
import { getGuestbook } from "@/lib/db";

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function id(formData: FormData) {
  const value = Number(text(formData, "id"));
  return Number.isSafeInteger(value) ? value : -1;
}

export async function createEntryAction(formData: FormData) {
  const result = await getGuestbook().createEntry({
    name: text(formData, "name"),
    message: text(formData, "message"),
    password: text(formData, "password"),
  });
  if (result.ok) refresh();
  return result;
}

export async function updateMessageAction(formData: FormData) {
  const result = await getGuestbook().updateMessage({
    id: id(formData),
    password: text(formData, "password"),
    message: text(formData, "message"),
  });
  if (result.ok) refresh();
  return result;
}

export async function deleteEntryAction(formData: FormData) {
  const result = await getGuestbook().deleteEntry({
    id: id(formData),
    password: text(formData, "password"),
  });
  if (result.ok) refresh();
  return result;
}
