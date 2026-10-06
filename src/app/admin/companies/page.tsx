import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { formatDate } from "@/lib/time";
import { setCompanyStatus } from "@/app/actions/admin";

export const metadata: Metadata = { title: "Şirkətlər · Admin" };

export default async function AdminCompaniesPage() {
  await requireUser("ADMIN");
  const companies = await db.company.findMany({
    orderBy: { createdAt: "desc" },
    include: { plan: true, _count: { select: { employees: { where: { role: "USER" } } } } },
  });
  const now = new Date();

  return (
    <section className="card overflow-x-auto p-0">
      <table className="table">
        <thead>
          <tr>
            <th>Şirkət</th>
            <th>Müqavilə</th>
            <th>Plan</th>
            <th>İşçilər</th>
            <th>Aylıq hesab</th>
            <th>Bitmə</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {companies.map((c) => {
            const expired = c.contractEnd <= now;
            return (
              <tr key={c.id}>
                <td>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-stone-500">VÖEN {c.voen} · kod {c.inviteCode}</p>
                </td>
                <td className="font-mono text-xs">{c.contractNo}</td>
                <td>{c.plan.name}</td>
                <td>
                  {c._count.employees} / {c.employeeLimit}
                </td>
                <td>{(c._count.employees * c.plan.priceMonthly).toFixed(2)} ₼</td>
                <td className={expired ? "text-red-600" : ""}>{formatDate(c.contractEnd)}</td>
                <td>
                  <span
                    className={`badge ${
                      c.status === "ACTIVE" && !expired ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-700"
                    }`}
                  >
                    {expired ? "Bitib" : c.status === "ACTIVE" ? "Aktiv" : "Dayandırılıb"}
                  </span>
                </td>
                <td className="text-right">
                  <form action={setCompanyStatus}>
                    <input type="hidden" name="companyId" value={c.id} />
                    <input type="hidden" name="status" value={c.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE"} />
                    <button className={c.status === "ACTIVE" ? "btn-danger btn-sm" : "btn-outline btn-sm"}>
                      {c.status === "ACTIVE" ? "Dayandır" : "Aktivləşdir"}
                    </button>
                  </form>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
