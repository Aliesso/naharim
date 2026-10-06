export const ROLES = {
  USER: "USER",
  COMPANY_ADMIN: "COMPANY_ADMIN",
  RESTAURANT: "RESTAURANT",
  ADMIN: "ADMIN",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS: Record<string, string> = {
  USER: "Abunəçi",
  COMPANY_ADMIN: "Şirkət admini",
  RESTAURANT: "Restoran",
  ADMIN: "Admin",
};

/** Rola görə giriş sonrası açılan səhifə */
export const ROLE_HOME: Record<string, string> = {
  USER: "/dashboard",
  COMPANY_ADMIN: "/company",
  RESTAURANT: "/partner",
  ADMIN: "/admin",
};

/** Kupon yaradıldıqdan sonra neçə dəqiqə etibarlıdır */
export const VOUCHER_TTL_MINUTES = 30;

/** Fərdi abunəliyin müddəti (gün) */
export const INDIVIDUAL_SUBSCRIPTION_DAYS = 30;

export const DAY_LABELS: Record<number, string> = {
  1: "B.e",
  2: "Ç.a",
  3: "Ç",
  4: "C.a",
  5: "C",
  6: "Ş",
  7: "B",
};

export const DISTRICTS = [
  "Səbail",
  "Nəsimi",
  "Yasamal",
  "Nərimanov",
  "Xətai",
  "Nizami",
  "Binəqədi",
  "Xəzər",
];
