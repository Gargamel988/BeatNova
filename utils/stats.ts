import { toLocalDateString } from "@/services/StatisticServices";

export type StatsDateRanges = {
  today: string;
  dayOfMonth: number;
  daysInLastMonth: number;
  thisMonthStart: string;
  lastMonthStart: string;
  lastMonthSamePeriodEnd: string;
  lastMonthEnd: string;
  last7Start: string;
  prev7Start: string;
  fetchFrom: Date;
};

export function getStatsDateRanges(): StatsDateRanges {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const dayOfMonth = now.getDate();
  const daysInLastMonth = new Date(y, m, 0).getDate();
  const sevenDaysAgo = new Date(y, m, dayOfMonth - 6);
  const fourteenDaysAgo = new Date(y, m, dayOfMonth - 13);
  const startLastMonth = new Date(y, m - 1, 1);

  return {
    today: toLocalDateString(now),
    dayOfMonth,
    daysInLastMonth,
    thisMonthStart: toLocalDateString(new Date(y, m, 1)),
    lastMonthStart: toLocalDateString(startLastMonth),
    lastMonthSamePeriodEnd: toLocalDateString(
      new Date(y, m - 1, Math.min(dayOfMonth, daysInLastMonth))
    ),
    lastMonthEnd: toLocalDateString(new Date(y, m, 0)),
    last7Start: toLocalDateString(sevenDaysAgo),
    prev7Start: toLocalDateString(fourteenDaysAgo),
    fetchFrom: startLastMonth < fourteenDaysAgo ? startLastMonth : fourteenDaysAgo,
  };
}

export function calculatePercentageDelta(
  current: number,
  previous: number,
  newBadgeText = "YENİ"
): string | undefined {
  if (current === 0 && previous === 0) return undefined;
  if (previous === 0) return newBadgeText;
  const pct = Math.round(((current - previous) / previous) * 100);
  return `${pct >= 0 ? "+" : ""}${pct}%`;
}

export function formatDayLabel(isoString: string, language: string): string {
  const [yy, mm, dd] = isoString.split("-").map(Number);
  if (!yy || !mm || !dd) return "";
  return new Date(yy, mm - 1, dd).toLocaleDateString(language, { weekday: "long" });
}
