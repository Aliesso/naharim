# Naharim

Abunəçilərin partnyor restoranlarda **nahar saatlarında** endirim qazandığı platforma.
İstifadəçilər fərdi abunə ola bilər, şirkətlər isə işçiləri üçün **korporativ müqavilə** bağlayır.

## Necə işləyir

1. **Abunəlik** — istifadəçi fərdi plan seçir *və ya* şirkətin dəvət kodu ilə qoşulur (korporativ abunəlik müqavilə bitənə qədər aktiv qalır).
2. **Kupon** — restoranın nahar pəncərəsində (Bakı vaxtı, iş günləri) istifadəçi 6 simvollu kupon + QR alır, kupon 30 dəqiqə keçərlidir.
3. **Kassa** — restoran işçisi kodu və hesab məbləğini daxil edir, endirim hesablanır, kupon bağlanır.

Qaydalar ([src/lib/vouchers.ts](src/lib/vouchers.ts)):

- Tətbiq olunan endirim = `min(planın maksimum endirimi, restoranın endirimi)`
- Gündəlik limit plana görədir; vaxtı keçmiş, istifadə olunmamış kupon limitə sayılmır
- Eyni anda yalnız bir aktiv kupon; bir kod iki dəfə istifadə oluna bilməz
- Şirkət müqaviləsi dayandırılarsa, işçilərin abunəliyi də dərhal işləmir

## Rollar və panellər

| Rol | Səhifə | İmkanlar |
| --- | --- | --- |
| Abunəçi | `/dashboard` | aktiv kupon + QR, abunəlik, qənaət, tarixçə, şirkətə qoşulma |
| Şirkət admini | `/company` | müqavilə, dəvət kodu/linki, işçilər və aylıq istifadə, təxmini hesab, limit artırılması müraciəti |
| Restoran | `/partner` | kuponu təsdiqləmə, günlük/aylıq dövriyyə, nahar saatları və endirim parametrləri |
| Admin | `/admin` | statistika (MRR), korporativ müraciətləri təsdiq → şirkət + müqavilə + şirkət admini hesabı, şirkətləri dayandırma, restoran və kassir əlavə etmə |

Açıq səhifələr: `/`, `/restaurants`, `/plans`, `/corporate` (şirkət müraciət forması).

## Texnologiyalar

Next.js 16 (App Router, Server Actions) · TypeScript · Tailwind CSS 4 · Prisma 6 + PostgreSQL · JWT sessiya (jose, httpOnly cookie) · bcryptjs

## Quraşdırma

PostgreSQL bazası lazımdır (pulsuz: [Neon](https://neon.tech) və ya Vercel → Storage → Neon).

```bash
npm install
cp .env.example .env       # DATABASE_URL, SESSION_SECRET
npm run db:deploy          # miqrasiyaları tətbiq edir
npm run db:seed            # demo məlumatlar (DİQQƏT: bazadakı bütün məlumatları silir)
npm run dev                # http://localhost:3000
```

Sxemi dəyişdikdən sonra yeni miqrasiya: `npm run db:migrate`.

> Korporativ şəbəkədə Prisma binarları `self-signed certificate` xətası ilə yüklənmirsə, əmrləri
> `NODE_OPTIONS=--use-system-ca` ilə işlədin (Windows sertifikat anbarından istifadə edir).

## Vercel-ə deploy

1. Vercel → layihə → **Storage** → Neon Postgres yaradın və layihəyə bağlayın (`DATABASE_URL` avtomatik əlavə olunur).
2. **Settings → Environment Variables**: `SESSION_SECRET` əlavə edin (32+ simvol).
3. Redeploy. `vercel-build` skripti miqrasiyaları özü tətbiq edir.
4. Demo məlumat üçün bir dəfə lokalda production bazası ilə `npm run db:seed` işlədin.

> `DATABASE_URL` adi `postgresql://` (və ya `postgres://`) bağlantısı olmalıdır. Provayder `prisma+postgres://` verirsə, onun yerinə birbaşa Postgres URL-ni (adətən `POSTGRES_URL`) yazın.

### Demo hesablar (şifrə: `demo1234`)

| Rol | E-poçt |
| --- | --- |
| Fərdi abunəçi (Premium) | aysel@example.com |
| Korporativ işçi | isci1@demo-tech.az |
| Şirkət admini | hr@demo-tech.az |
| Restoran kassası | kassa@ocaq-evi.az |
| Platforma admini | admin@naharim.az |

Demo şirkətin dəvət kodu: `DEMO2026`.

## Növbəti addımlar (MVP-dən kənar)

- Real ödəniş inteqrasiyası — hazırda `subscribe` ödənişi simulyasiya edir ([src/app/actions/subscriber.ts](src/app/actions/subscriber.ts))
- Şirkətlərə aylıq hesab-faktura (e-qaimə) generasiyası və ödəniş statusu
- Restoranlara aylıq hesablaşma hesabatı (endirim kompensasiyası modelinə görə)
- E-poçt/SMS bildirişləri (müraciət təsdiqi, müvəqqəti şifrə, dəvət)
- Şifrə bərpası, restoran şəkilləri və menyu, xəritə
- Mobil tətbiq (kupon və QR üçün)
