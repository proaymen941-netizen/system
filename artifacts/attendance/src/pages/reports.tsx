import { useState } from "react";
import { useGetDashboardStats, useGetDailyReport, useGetMonthlyReport, getGetDailyReportQueryKey, getGetMonthlyReportQueryKey } from "@workspace/api-client-react";
import { BarChart3, TrendingUp, Calendar, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const statusConfig: Record<string, { label: string; text: string }> = {
  present: { label: "حاضر", text: "text-emerald-600" },
  late: { label: "متأخر", text: "text-amber-600" },
  absent: { label: "غائب", text: "text-red-500" },
  half_day: { label: "نصف يوم", text: "text-blue-500" },
};

export default function ReportsPage() {
  const today = new Date().toISOString().split("T")[0];
  const [activeTab, setActiveTab] = useState<"daily" | "monthly">("daily");
  const [dailyDate, setDailyDate] = useState(today);
  const [monthlyYear, setMonthlyYear] = useState(new Date().getFullYear());
  const [monthlyMonth, setMonthlyMonth] = useState(new Date().getMonth() + 1);

  const { data: stats } = useGetDashboardStats();
  const { data: dailyReport, isLoading: dailyLoading } = useGetDailyReport(
    { date: dailyDate },
    { query: { enabled: activeTab === "daily", queryKey: getGetDailyReportQueryKey({ date: dailyDate }) } }
  );
  const { data: monthlyReport, isLoading: monthlyLoading } = useGetMonthlyReport(
    { year: monthlyYear, month: monthlyMonth },
    { query: { enabled: activeTab === "monthly", queryKey: getGetMonthlyReportQueryKey({ year: monthlyYear, month: monthlyMonth }) } }
  );

  const prevMonth = () => { if (monthlyMonth === 1) { setMonthlyMonth(12); setMonthlyYear(y => y - 1); } else setMonthlyMonth(m => m - 1); };
  const nextMonth = () => { if (monthlyMonth === 12) { setMonthlyMonth(1); setMonthlyYear(y => y + 1); } else setMonthlyMonth(m => m + 1); };

  const monthName = new Date(monthlyYear, monthlyMonth - 1).toLocaleDateString("ar-SA", { month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">التقارير</h1>
        <p className="text-slate-500 text-sm mt-1">تقارير الحضور والانصراف</p>
      </div>

      {/* Quick Stats Row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "الحاضرون اليوم", value: stats.todayPresent, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "الغائبون اليوم", value: stats.todayAbsent, color: "text-red-500", bg: "bg-red-50" },
            { label: "نسبة الحضور", value: `${stats.monthlyAttendanceRate}%`, color: "text-sky-600", bg: "bg-sky-50" },
            { label: "إجمالي الموظفين", value: stats.totalEmployees, color: "text-slate-700", bg: "bg-slate-50" },
          ].map(s => (
            <div key={s.label} className={`rounded-2xl p-4 ${s.bg} border border-white`}>
              <p className="text-xs text-slate-500 mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        <button onClick={() => setActiveTab("daily")} className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "daily" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
          تقرير يومي
        </button>
        <button onClick={() => setActiveTab("monthly")} className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "monthly" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
          تقرير شهري
        </button>
      </div>

      {/* Daily Report */}
      {activeTab === "daily" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="font-semibold text-slate-800 text-sm">تقرير يوم</span>
            </div>
            <input
              type="date"
              value={dailyDate}
              onChange={e => setDailyDate(e.target.value)}
              className="h-9 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 mr-auto"
            />
          </div>

          {dailyLoading ? (
            <div className="p-4 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
          ) : dailyReport ? (
            <>
              <div className="grid grid-cols-3 gap-4 p-5 border-b border-slate-100">
                {[
                  { label: "حاضر", value: (dailyReport as any).present, color: "text-emerald-600", bg: "bg-emerald-50" },
                  { label: "متأخر", value: (dailyReport as any).late, color: "text-amber-600", bg: "bg-amber-50" },
                  { label: "غائب", value: (dailyReport as any).absent, color: "text-red-500", bg: "bg-red-50" },
                ].map(s => (
                  <div key={s.label} className={`text-center py-3 rounded-xl ${s.bg}`}>
                    <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-slate-500 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="divide-y divide-slate-50">
                {((dailyReport as any).records as any[]).length > 0 ? (
                  ((dailyReport as any).records as any[]).map((r: any) => {
                    const st = statusConfig[r.status] || { label: r.status, text: "text-slate-600" };
                    return (
                      <div key={r.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center flex-shrink-0">
                          <span className="text-slate-600 text-sm font-bold">{r.employeeName?.[0]}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800">{r.employeeName}</p>
                          <p className="text-xs text-slate-400">
                            {r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }) : "--:--"}
                            {" — "}
                            {r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }) : "--:--"}
                          </p>
                        </div>
                        <div className="text-left">
                          <p className={`text-sm font-semibold ${st.text}`}>{st.label}</p>
                          {r.totalHours && <p className="text-xs text-slate-400">{r.totalHours.toFixed(1)} ساعة</p>}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                    <p className="text-sm">لا توجد سجلات لهذا اليوم</p>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* Monthly Report */}
      {activeTab === "monthly" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
            <BarChart3 className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-slate-800 text-sm flex-1">تقرير شهري</span>
            <div className="flex items-center gap-2">
              <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>
              <span className="text-sm font-semibold text-slate-700 min-w-28 text-center">{monthName}</span>
              <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                <ChevronLeft className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>

          {monthlyLoading ? (
            <div className="p-4 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
          ) : monthlyReport ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {["الموظف", "حضور", "غياب", "تأخر", "ساعات العمل", "إجازات", "وقت إضافي"].map(h => (
                      <th key={h} className="text-right px-4 py-3 text-xs font-bold text-slate-500 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {((monthlyReport as any).employeeSummaries as any[]).map((s: any) => (
                    <tr key={s.employeeId} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs font-bold">{s.employeeName?.[0]}</span>
                          </div>
                          <span className="font-semibold text-slate-800">{s.employeeName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-bold text-emerald-600">{s.presentDays}</td>
                      <td className="px-4 py-3 font-bold text-red-500">{s.absentDays}</td>
                      <td className="px-4 py-3 font-bold text-amber-600">{s.lateDays}</td>
                      <td className="px-4 py-3 text-slate-700">{Number(s.totalHours).toFixed(1)}</td>
                      <td className="px-4 py-3 text-blue-500">{s.leavedays}</td>
                      <td className="px-4 py-3 text-violet-600">{s.overtimeHours}</td>
                    </tr>
                  ))}
                  {(monthlyReport as any).employeeSummaries.length === 0 && (
                    <tr><td colSpan={7} className="text-center py-12 text-slate-400 text-sm">لا توجد بيانات لهذا الشهر</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
