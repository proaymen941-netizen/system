import { useGetDashboardStats, useGetLiveAttendance, useListAnnouncements } from "@workspace/api-client-react";
import { Users, UserCheck, UserX, AlertCircle, Calendar, Timer, TrendingUp, Radio, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

function StatCard({ title, value, icon: Icon, gradient, sub }: {
  title: string; value: number | string; icon: any; gradient: string; sub?: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 ${gradient} shadow-lg`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white/70 text-xs font-medium mb-1">{title}</p>
          <p className="text-white text-3xl font-bold">{value}</p>
          {sub && <p className="text-white/60 text-xs mt-1">{sub}</p>}
        </div>
        <div className="bg-white/20 rounded-xl p-2.5">
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full bg-white/10" />
      <div className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full bg-white/5" />
    </div>
  );
}

export default function DashboardPage() {
  const { data: stats, isLoading } = useGetDashboardStats();
  const { data: live, isLoading: liveLoading } = useGetLiveAttendance();
  const { data: announcements } = useListAnnouncements();

  const statCards = [
    { title: "الحاضرون اليوم", value: stats?.todayPresent ?? 0, icon: UserCheck, gradient: "bg-gradient-to-br from-emerald-400 to-emerald-600" },
    { title: "الغائبون اليوم", value: stats?.todayAbsent ?? 0, icon: UserX, gradient: "bg-gradient-to-br from-red-400 to-red-600" },
    { title: "المتأخرون", value: stats?.todayLate ?? 0, icon: AlertCircle, gradient: "bg-gradient-to-br from-amber-400 to-amber-600" },
    { title: "إجمالي الموظفين", value: stats?.totalEmployees ?? 0, icon: Users, gradient: "bg-gradient-to-br from-sky-400 to-sky-600" },
    { title: "إجازات معلقة", value: stats?.pendingLeaves ?? 0, icon: Calendar, gradient: "bg-gradient-to-br from-violet-400 to-violet-600" },
    { title: "وقت إضافي معلق", value: stats?.pendingOvertime ?? 0, icon: Timer, gradient: "bg-gradient-to-br from-orange-400 to-orange-600" },
    { title: "نسبة الحضور", value: `${stats?.monthlyAttendanceRate ?? 0}%`, icon: TrendingUp, gradient: "bg-gradient-to-br from-teal-400 to-teal-600", sub: "هذا الشهر" },
    { title: "متصلون الآن", value: live?.checkedIn ?? 0, icon: Radio, gradient: "bg-gradient-to-br from-indigo-400 to-indigo-600", sub: `من أصل ${live?.total ?? 0}` },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">لوحة التحكم</h1>
        <p className="text-slate-500 text-sm mt-1">
          {new Date().toLocaleDateString("ar-SA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <StatCard key={card.title} {...card} />
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Live Attendance */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="font-semibold text-slate-800 text-sm">الحضور الآن</h2>
            </div>
            <span className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-2.5 py-1 rounded-full border border-emerald-200">
              {live?.checkedIn ?? 0} موظف
            </span>
          </div>
          <div className="p-4">
            {liveLoading ? (
              <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
            ) : live?.records && (live.records as any[]).length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {(live.records as any[]).map((r: any) => (
                  <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-bold">{r.employeeName?.[0] ?? "م"}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{r.employeeName}</p>
                      <p className="text-xs text-emerald-600">
                        دخل: {r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }) : "-"}
                      </p>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                <Users className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm">لا يوجد موظفون حاضرون الآن</p>
              </div>
            )}
          </div>
        </div>

        {/* Announcements */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800 text-sm">آخر الإعلانات</h2>
          </div>
          <div className="p-4 space-y-3 max-h-72 overflow-y-auto">
            {announcements && (announcements as any[]).length > 0 ? (
              (announcements as any[]).slice(0, 5).map((ann: any) => {
                const colors: Record<string, string> = {
                  urgent: "bg-red-50 border-red-200 text-red-700",
                  high: "bg-sky-50 border-sky-200 text-sky-700",
                  normal: "bg-slate-50 border-slate-200 text-slate-600",
                  low: "bg-slate-50 border-slate-200 text-slate-500",
                };
                const labels: Record<string, string> = { urgent: "عاجل", high: "مهم", normal: "عادي", low: "منخفض" };
                return (
                  <div key={ann.id} className="p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium flex-shrink-0 mt-0.5 ${colors[ann.priority] || colors.normal}`}>
                        {labels[ann.priority] || "عادي"}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{ann.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{ann.content}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                <p className="text-sm">لا توجد إعلانات حديثة</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {stats?.recentActivity && (stats.recentActivity as any[]).length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800 text-sm">النشاط الأخير</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {(stats.recentActivity as any[]).map((activity: any, i: number) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${activity.type === "checkin" ? "bg-emerald-500" : "bg-sky-500"}`} />
                <div className="flex-1 text-sm">
                  <span className="font-semibold text-slate-800">{activity.employeeName}</span>
                  <span className="text-slate-500"> — {activity.description}</span>
                </div>
                <span className="text-xs text-slate-400 flex-shrink-0">
                  {activity.time ? new Date(activity.time).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }) : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
