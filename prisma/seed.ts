import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();
const DAY = 86_400_000;

async function main() {
  await db.voucher.deleteMany();
  await db.subscription.deleteMany();
  await db.user.deleteMany();
  await db.company.deleteMany();
  await db.companyRequest.deleteMany();
  await db.restaurant.deleteMany();
  await db.plan.deleteMany();

  const password = await bcrypt.hash("demo1234", 10);

  const [, premium, business] = await Promise.all([
    db.plan.create({
      data: {
        slug: "standart", name: "Standart", type: "INDIVIDUAL", sortOrder: 1,
        description: "Gündə 1 endirimli nahar, bütün partnyor restoranlarda",
        priceMonthly: 9.9, discountPercent: 15, dailyLimit: 1,
      },
    }),
    db.plan.create({
      data: {
        slug: "premium", name: "Premium", type: "INDIVIDUAL", sortOrder: 2,
        description: "Gündə 2 endirimli nahar və daha yüksək endirim",
        priceMonthly: 17.9, discountPercent: 25, dailyLimit: 2,
      },
    }),
    db.plan.create({
      data: {
        slug: "biznes", name: "Biznes", type: "CORPORATE", sortOrder: 3,
        description: "Şirkətlər üçün — işçi başına aylıq ödəniş, gündə 1 nahar",
        priceMonthly: 7.5, discountPercent: 20, dailyLimit: 1,
      },
    }),
    db.plan.create({
      data: {
        slug: "biznes-plus", name: "Biznes+", type: "CORPORATE", sortOrder: 4,
        description: "Maksimum endirim, gündə 2 nahar, prioritet dəstək",
        priceMonthly: 12.5, discountPercent: 30, dailyLimit: 2,
      },
    }),
  ]);

  const restaurantsData = [
    { slug: "ocaq-evi", name: "Ocaq Evi", cuisine: "Azərbaycan", district: "Səbail", address: "Nizami küç. 12", discountPercent: 20, lunchStart: "12:00", lunchEnd: "15:00", description: "Ev yeməkləri: dolma, düşbərə, piti. Hər gün təzə biznes-lanç menyusu." },
    { slug: "lavas-kabab", name: "Lavaş & Kabab", cuisine: "Kabab", district: "Nəsimi", address: "Rəşid Behbudov küç. 45", discountPercent: 15, lunchStart: "12:00", lunchEnd: "16:00", description: "Manqal, lülə və tikə kabab, təndir çörəyi ilə." },
    { slug: "green-bowl", name: "Green Bowl", cuisine: "Sağlam qida", district: "Yasamal", address: "Şərifzadə küç. 8", discountPercent: 25, lunchStart: "11:30", lunchEnd: "15:00", description: "Salat və bowl-lar, kalori göstəriciləri ilə. Vegan seçimlər var." },
    { slug: "pasta-fabrika", name: "Pasta Fabrika", cuisine: "İtalyan", district: "Nərimanov", address: "Ataturk pr. 21", discountPercent: 20, lunchStart: "12:30", lunchEnd: "15:30", description: "Evdə hazırlanan pasta və odun sobasında pizza." },
    { slug: "sushi-point", name: "Sushi Point", cuisine: "Yapon", district: "Xətai", address: "Xocalı pr. 33", discountPercent: 30, lunchStart: "12:00", lunchEnd: "15:00", description: "Lanç setləri: sushi, ramen və poke." },
    { slug: "qutab-bar", name: "Qutab Bar", cuisine: "Azərbaycan", district: "Nizami", address: "Qara Qarayev pr. 70", discountPercent: 15, lunchStart: "11:00", lunchEnd: "14:30", description: "Göyərti, ət və balqabaq qutabları, ayran ilə." },
    { slug: "burger-lab", name: "Burger Lab", cuisine: "Fast food", district: "Nəsimi", address: "28 May küç. 5", discountPercent: 20, lunchStart: "12:00", lunchEnd: "16:00", workDays: "1,2,3,4,5,6", description: "Kraft burgerlər, kartof fri və limonad." },
    { slug: "dolma-house", name: "Dolma House", cuisine: "Azərbaycan", district: "Binəqədi", address: "Azadlıq pr. 150", discountPercent: 25, lunchStart: "12:00", lunchEnd: "15:00", description: "Yarpaq, kələm və badımcan dolması — gündəlik menyu." },
  ];

  const restaurants = [];
  for (const r of restaurantsData) {
    restaurants.push(await db.restaurant.create({ data: { phone: "+994 12 000 00 00", ...r } }));
  }

  await db.user.create({
    data: { name: "Platforma Admini", email: "admin@naharim.az", passwordHash: password, role: "ADMIN" },
  });

  for (const r of restaurants.slice(0, 3)) {
    await db.user.create({
      data: {
        name: `${r.name} kassa`, email: `kassa@${r.slug}.az`, passwordHash: password,
        role: "RESTAURANT", restaurantId: r.id,
      },
    });
  }

  const now = new Date();
  const company = await db.company.create({
    data: {
      name: "Demo Texnologiya MMC", voen: "1234567891",
      contactName: "Leyla Məmmədova", contactEmail: "hr@demo-tech.az", contactPhone: "+994 50 000 00 00",
      employeeLimit: 50, inviteCode: "DEMO2026", planId: business.id,
      contractNo: "NHR-2026-001", contractStart: new Date(now.getTime() - 60 * DAY),
      contractEnd: new Date(now.getTime() + 305 * DAY),
    },
  });

  await db.user.create({
    data: {
      name: "Leyla Məmmədova", email: "hr@demo-tech.az", passwordHash: password,
      role: "COMPANY_ADMIN", companyId: company.id,
    },
  });

  const employeeNames = ["Rəşad Əliyev", "Nigar Həsənova", "Tural Quliyev", "Günay İsmayılova", "Elvin Babayev"];
  const employees = [];
  for (let i = 0; i < employeeNames.length; i++) {
    const u = await db.user.create({
      data: {
        name: employeeNames[i], email: `isci${i + 1}@demo-tech.az`, passwordHash: password,
        companyId: company.id,
      },
    });
    await db.subscription.create({
      data: {
        userId: u.id, planId: business.id, companyId: company.id, source: "COMPANY",
        startsAt: company.contractStart, endsAt: company.contractEnd,
      },
    });
    employees.push(u);
  }

  const individual = await db.user.create({
    data: { name: "Aysel Kərimova", email: "aysel@example.com", passwordHash: password },
  });
  await db.subscription.create({
    data: {
      userId: individual.id, planId: premium.id, source: "INDIVIDUAL",
      startsAt: new Date(now.getTime() - 10 * DAY), endsAt: new Date(now.getTime() + 20 * DAY),
    },
  });

  // Statistikalar boş görünməsin deyə son 20 günün istifadə tarixçəsi
  const subscribers = [...employees, individual];
  let n = 0;
  for (let day = 1; day <= 20; day++) {
    for (const u of subscribers) {
      if ((day + n++) % 3 === 0) continue;
      const r = restaurants[(day + n) % restaurants.length];
      const percent = Math.min(u.id === individual.id ? premium.discountPercent : business.discountPercent, r.discountPercent);
      const bill = 8 + ((day * 7 + n * 3) % 18);
      const created = new Date(now.getTime() - day * DAY);
      await db.voucher.create({
        data: {
          code: `S${day.toString().padStart(2, "0")}${n.toString(36).toUpperCase().padStart(3, "0")}`,
          userId: u.id, restaurantId: r.id, discountPercent: percent, status: "USED",
          createdAt: created, expiresAt: new Date(created.getTime() + 30 * 60_000),
          usedAt: new Date(created.getTime() + 10 * 60_000),
          billAmount: bill, discountAmount: Math.round(bill * percent) / 100,
        },
      });
    }
  }

  await db.companyRequest.create({
    data: {
      companyName: "Nümunə Logistika ASC", voen: "9876543210", contactName: "Orxan Səfərov",
      contactEmail: "orxan@numune-logistika.az", contactPhone: "+994 55 000 00 00",
      employeeCount: 120, message: "Ofisimiz Nərimanovdadır, 120 işçi üçün təklif istəyirik.",
    },
  });

  console.log("Seed tamamlandı. Bütün demo hesabların şifrəsi: demo1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
