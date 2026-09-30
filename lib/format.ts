const formatter = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** 한국 시간 `YYYY-MM-DD HH:mm` */
export function formatKst(date: Date) {
  return formatter.format(date);
}
