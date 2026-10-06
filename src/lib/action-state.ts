export type ActionState = {
  error?: string;
  message?: string;
  /** Bir dəfə göstərilməli məlumat (məs. yeni yaradılmış şifrə) */
  secret?: string;
} | null;

export function str(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === "string" ? v.trim() : "";
}

export function num(form: FormData, key: string): number {
  return Number(str(form, key).replace(",", "."));
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
