// Bütün nahar saatları Bakı vaxtı ilə (UTC+4, yay vaxtı yoxdur) hesablanır,
// server hansı saat qurşağında işləsə də nəticə eyni olsun.
const BAKU_OFFSET_MINUTES = 4 * 60;

export type BakuClock = {
  /** 1 = Bazar ertəsi ... 7 = Bazar */
  weekday: number;
  /** Gün başlanğıcından keçən dəqiqələr */
  minutes: number;
  /** Bakı vaxtı ilə bu günün başlanğıcı (UTC Date kimi) */
  startOfDay: Date;
};

export function bakuClock(now: Date = new Date()): BakuClock {
  const shifted = new Date(now.getTime() + BAKU_OFFSET_MINUTES * 60_000);
  const jsDay = shifted.getUTCDay(); // 0 = Bazar
  const minutes = shifted.getUTCHours() * 60 + shifted.getUTCMinutes();
  const startOfDay = new Date(
    Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()) -
      BAKU_OFFSET_MINUTES * 60_000,
  );
  return { weekday: jsDay === 0 ? 7 : jsDay, minutes, startOfDay };
}

/** Bakı vaxtı ilə cari ayın başlanğıcı */
export function bakuStartOfMonth(now: Date = new Date()): Date {
  const shifted = new Date(now.getTime() + BAKU_OFFSET_MINUTES * 60_000);
  return new Date(
    Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), 1) - BAKU_OFFSET_MINUTES * 60_000,
  );
}

export function parseHHmm(value: string): number {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

export function isValidHHmm(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function parseWorkDays(value: string): number[] {
  return value
    .split(",")
    .map((d) => Number(d.trim()))
    .filter((d) => d >= 1 && d <= 7);
}

export type LunchWindow = { lunchStart: string; lunchEnd: string; workDays: string };

export function isLunchOpen(r: LunchWindow, now: Date = new Date()): boolean {
  const { weekday, minutes } = bakuClock(now);
  if (!parseWorkDays(r.workDays).includes(weekday)) return false;
  return minutes >= parseHHmm(r.lunchStart) && minutes < parseHHmm(r.lunchEnd);
}

const dateFmt = new Intl.DateTimeFormat("az-AZ", {
  timeZone: "Asia/Baku",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
const dateTimeFmt = new Intl.DateTimeFormat("az-AZ", {
  timeZone: "Asia/Baku",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
const timeFmt = new Intl.DateTimeFormat("az-AZ", {
  timeZone: "Asia/Baku",
  hour: "2-digit",
  minute: "2-digit",
});

export const formatDate = (d: Date) => dateFmt.format(d);
export const formatDateTime = (d: Date) => dateTimeFmt.format(d);
export const formatTime = (d: Date) => timeFmt.format(d);

export function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * 86_400_000);
}

export function addMonths(d: Date, months: number): Date {
  const r = new Date(d);
  r.setMonth(r.getMonth() + months);
  return r;
}

/** Tarixə qədər qalan tam günlər (keçibsə 0) */
export function daysUntil(d: Date, now: Date = new Date()): number {
  return Math.max(Math.ceil((d.getTime() - now.getTime()) / 86_400_000), 0);
}
