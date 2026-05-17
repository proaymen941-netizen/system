import { useState } from "react";
import {
  useGetTodayAttendance, getGetTodayAttendanceQueryKey,
  useCheckIn, useCheckOut, useListAttendance
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { LogIn, LogOut, MapPin, Clock, CheckCircle2, Loader2, AlertCircle, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const statusConfig: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  present: { label: "حاضر", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  late: { label: "متأخر", bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  absent: { label: "غائب", bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
  half_day: { label: "نصف يوم", bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
};

export default function AttendancePage() {
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const queryClient = useQueryClient();

  const { data: todayRecord, isLoading: todayLoading } = useGetTodayAttendance();
  const { data: history, isLoading: historyLoading } = useListAttendance({});

  const checkInMutation = useCheckIn();
  const checkOutMutation = useCheckOut();

  const getLocation = (): Promise<{ latitude: number; longitude: number }> =>
    new Promise((resolve, reject) =>
      navigator.geolocation
        ? navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
            () => reject(new Error("تعذّر تحديد موقعك. تأكد من السماح بالوصول للموقع.")),
            { timeout: 10000 }
          )
        : reject(new Error("المتصفح لا يدعم تحديد الموقع"))
    );

  const handleCheckIn = async () => {
    setLocationError(""); setLocationLoading(true);
    try {
      const loc = await getLocation();
      checkInMutation.mutate({ data: loc }, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetTodayAttendanceQueryKey() }),
        onError: (e: any) => setLocationError(e?.data?.error || "حدث خطأ أثناء تسجيل الحضور"),
      });
    } catch (e: any) { setLocationError(e.message); }
    finally { setLocationLoading(false); }
  };

  const handleCheckOut = async () => {
    setLocationError(""); setLocationLoading(true);
    try {
      const loc = await getLocation();
      checkOutMutation.mutate({ data: loc }, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetTodayAttendanceQueryKey() }),
        onError: (e: any) => setLocationError(e?.data?.error || "حدث خطأ أثناء تسجيل الانصراف"),
      });
    } catch (e: any) { setLocationError(e.message); }
    finally { setLocationLoading(false); }
  };

  const rec = todayRecord as any;
  const isCheckedIn = !!rec?.checkInTime;
  const isCheckedOut = !!rec?.checkOutTime;
  const isPending = locationLoading || checkInMutation.isPending || checkOutMutation.isPending;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">تسجيل الحضور</h1>
        <p className="text-slate-500 text-sm mt-1">
          {new Date().toLocaleDateString("ar-SA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Check In/Out Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Status bar */}
        <div className={`h-1.5 ${isCheckedOut ? "bg-gradient-to-l from-sky-400 to-sky-600" : isCheckedIn ? "bg-gradient-to-l from-emerald-400 to-emerald-600" : "bg-slate-200"}`} />

        <div className="p-8 text-center">
          {todayLoading ? (
            <div className="space-y-4 flex flex-col items-center">
              <Skeleton className="w-28 h-28 rounded-full" />
              <Skeleton className="h-6 w-40 rounded-lg" />
              <Skeleton className="h-14 w-56 rounded-2xl" />
            </div>
          ) : (
            <>
              {/* Status Icon */}
              <div className={`inline-flex items-center justify-center w-28 h-28 rounded-full mb-5 ${
                isCheckedOut ? "bg-sky-50 ring-4 ring-sky-100" : isCheckedIn ? "bg-emerald-50 ring-4 ring-emerald-100" : "bg-slate-100 ring-4 ring-slate-50"
              }`}>
                {isCheckedOut ? (
                  <CheckCircle2 className="w-14 h-14 text-sky-500" />
                ) : isCheckedIn ? (
                  <Clock className="w-14 h-14 text-emerald-500" style={{ animation: "pulse 2s cubic-bezier(0.4,0,0.6,1) infinite" }} />
                ) : (
                  <LogIn className="w-14 h-14 text-slate-400" />
                )}
              </div>

              {/* Status Text */}
              <p className={`text-lg font-bold mb-1 ${isCheckedOut ? "text-sky-600" : isCheckedIn ? "text-emerald-600" : "text-slate-500"}`}>
                {isCheckedOut ? "اليوم مكتمل ✓" : isCheckedIn ? "أنت في العمل الآن" : "لم تُسجّل حضورك بعد"}
              </p>

              {/* Times Row */}
              {rec?.checkInTime && (
                <div className="flex items-center justify-center gap-5 my-5">
                  <div className="text-center">
                    <p className="text-xs text-slate-400 mb-1">وقت الدخول</p>
                    <p className="text-lg font-bold text-slate-800">
                      {new Date(rec.checkInTime).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  {rec.checkOutTime && (
                    <>
                      <div className="flex items-center gap-1">
                        <div className="w-6 h-px bg-slate-300" />
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <div className="w-6 h-px bg-slate-300" />
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-slate-400 mb-1">وقت الخروج</p>
                        <p className="text-lg font-bold text-slate-800">
                          {new Date(rec.checkOutTime).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      <div className="w-px h-10 bg-slate-200" />
                      <div className="text-center">
                        <p className="text-xs text-slate-400 mb-1">إجمالي</p>
                        <p className="text-lg font-bold text-sky-600">{rec.totalHours?.toFixed(1)}س</p>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Error */}
              {locationError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm mb-4 mx-auto max-w-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{locationError}</span>
                </div>
              )}

              {/* CTA Button */}
              {!isCheckedOut && (
                <button
                  onClick={isCheckedIn ? handleCheckOut : handleCheckIn}
                  disabled={isPending}
                  className={`inline-flex items-center gap-3 px-10 py-4 rounded-2xl text-white font-bold text-base shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 ${
                    isCheckedIn
                      ? "bg-gradient-to-l from-red-500 to-red-600 shadow-red-200"
                      : "bg-gradient-to-l from-emerald-500 to-emerald-600 shadow-emerald-200"
                  }`}
                >
                  {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : isCheckedIn ? <LogOut className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
                  {isPending ? "جاري التحقق..." : isCheckedIn ? "تسجيل الانصراف" : "تسجيل الحضور"}
                </button>
              )}

              <div className="flex items-center justify-center gap-1.5 mt-4 text-xs text-slate-400">
                <MapPin className="w-3.5 h-3.5" />
                <span>يتطلب الموافقة على تحديد الموقع</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* History */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <h2 className="font-semibold text-slate-800 text-sm">سجل الحضور الأخير</h2>
        </div>
        <div className="divide-y divide-slate-50">
          {historyLoading ? (
            <div className="p-4 space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
          ) : (history as any[])?.length > 0 ? (
            (history as any[]).slice(0, 10).map((r: any) => {
              const st = statusConfig[r.status] || statusConfig.absent;
              return (
                <div key={r.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${st.dot}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">
                      {new Date(r.date).toLocaleDateString("ar-SA", { weekday: "short", month: "short", day: "numeric" })}
                    </p>
                    <p className="text-xs text-slate-400">
                      {r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }) : "--:--"}
                      {" — "}
                      {r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }) : "--:--"}
                      {r.totalHours ? ` · ${r.totalHours.toFixed(1)} ساعة` : ""}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${st.bg} ${st.text}`}>{st.label}</span>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Calendar className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">لا يوجد سجل حضور</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
