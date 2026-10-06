import type { Metadata } from "next";
import { db } from "@/lib/db";
import { CompanyRequestForm } from "./request-form";

export const metadata: Metadata = { title: "Şirkətlər üçün" };

const benefits = [
  { title: "Sabit büdcə", text: "İşçi başına aylıq sabit ödəniş. Hər ay qoşulmuş işçi sayına görə bir hesab-faktura." },
  { title: "Asan qoşulma", text: "Bir dəvət kodu — işçilər qeydiyyatda kodu yazır və dərhal endirimdən istifadə edir." },
  { title: "Tam nəzarət", text: "Şirkət panelində işçiləri idarə edin, istifadə və qənaət statistikasını izləyin." },
  { title: "Rəsmi müqavilə", text: "VÖEN əsasında müqavilə, 1–36 ay müddətinə. Limit istənilən vaxt artırıla bilər." },
];

export default async function CorporatePage() {
  const plans = await db.plan.findMany({
    where: { active: true, type: "CORPORATE" },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <>
      <section className="bg-ink text-white">
        <div className="container-page py-16">
          <span className="badge bg-white/10 text-brand-200">Korporativ müqavilə</span>
          <h1 className="mt-4 max-w-2xl text-4xl font-extrabold leading-tight">
            Komandanız üçün endirimli nahar — bir müqavilə ilə
          </h1>
          <p className="mt-4 max-w-2xl text-stone-300">
            Naharim ilə müqavilə bağlayan şirkətlərin işçiləri partnyor restoranlarda nahar saatlarında endirimdən
            istifadə edir. Siz işçi başına sabit məbləğ ödəyirsiniz, qalanını biz idarə edirik.
          </p>
        </div>
      </section>

      <section className="container-page py-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((b) => (
            <div key={b.title} className="card">
              <h3 className="font-bold">{b.title}</h3>
              <p className="mt-1 text-sm text-stone-600">{b.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {plans.map((p) => (
            <div key={p.id} className="card flex items-center justify-between gap-4">
              <div>
                <p className="font-bold">{p.name}</p>
                <p className="text-sm text-stone-500">
                  {p.discountPercent}%-ə qədər · gündə {p.dailyLimit} nahar
                </p>
              </div>
              <p className="text-right">
                <span className="text-2xl font-extrabold">{p.priceMonthly.toFixed(2)}</span>
                <span className="block text-xs text-stone-500">AZN / işçi / ay</span>
              </p>
            </div>
          ))}
        </div>
      </section>

      <section id="muraciet" className="container-page scroll-mt-24">
        <div className="grid gap-8 md:grid-cols-[1fr_1.3fr]">
          <div className="space-y-3">
            <h2 className="text-2xl font-bold">Müraciət edin</h2>
            <p className="text-stone-600">
              Formu doldurun — menecerimiz şirkətinizin ölçüsünə uyğun təklif hazırlayıb 1 iş günü ərzində sizinlə
              əlaqə saxlayacaq. Müqavilə təsdiqləndikdən sonra şirkət paneli və dəvət kodu sizə göndəriləcək.
            </p>
            <ol className="space-y-2 pt-2 text-sm text-stone-600">
              <li>1. Müraciət və təklif</li>
              <li>2. Müqavilənin imzalanması</li>
              <li>3. Şirkət panelinin aktivləşdirilməsi</li>
              <li>4. İşçilərin dəvət kodu ilə qoşulması</li>
            </ol>
          </div>
          <div className="card p-6">
            <CompanyRequestForm />
          </div>
        </div>
      </section>

      <section id="restoranlar" className="container-page scroll-mt-24 pt-12">
        <div className="card flex flex-col gap-3 bg-brand-50 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-bold">Restoranınız var?</h2>
            <p className="text-sm text-stone-600">
              Nahar saatlarında boş masaları doldurun — yüzlərlə ofis işçisi sizi tapsın. Partnyor olmaq üçün bizə yazın:{" "}
              <span className="font-semibold">partners@naharim.az</span>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
