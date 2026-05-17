import { useState } from "react";
import {
  useListOvertime, getListOvertimeQueryKey,
  useCreateOvertime, useApproveOvertime, useRejectOvertime
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { Plus, CheckCircle2, XCircle, Clock, Timer } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const statusConfig: Record<string, { label: string; bg: string; text: string; barColor: string }> = {
  pending: { label: "معلق", bg: "bg-amber-50 border-amber-100", text: "text-amber-700", barColor: "bg-amber-400" },
  approved: { label: "موافق عليه", bg: "bg-emerald-50 border-emerald-100", text: "text-emerald-700", barColor: "bg-emerald-400" },
  rejected: { label: "مرفوض", bg: "bg-red-50 border-red-100", text: "text-red-700", barColor: "bg-red-400" },
};

export default function OvertimePage() {
  const [tab, setTab] = useState("pending");
  const [showDialog, setShowDialog] = useState(false);
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [form, setForm] = useState({ date: "", hours: "", reason: "" });
  const queryClient = useQueryClient();
  const { employee } = useAuth();

  const { data: overtimes, isLoading } = useListOvertime({ status: tab as any });
  const createMutation = useCreateOvertime();
  const approveMutation = useApproveOvertime();
  const rejectMutation = useRejectOvertime();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListOvertimeQueryKey() });
  const isManagerOrAdmin = employee?.role === "admin" || employee?.role === "manager";
  const list = (overtimes as any[]) || [];

  const tabs = [
    { id: "pending", label: "معلقة" },
    { id: "approved", label: "موافق عليها" },
    { id: "rejected", label: "مرفوضة" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">العمل الإضافي</h1>
          <p className="text-slate-500 text-sm mt-1">إدارة طلبات الوقت الإضافي</p>
        </div>
        <button
          onClick={() => setShowDialog(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          طلب وقت إضافي
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Cards Grid */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      ) : list.length > 0 ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {list.map((ot: any) => {
            const st = statusConfig[ot.status] || statusConfig.pending;
            return (
              <div key={ot.id} className={`relative bg-white rounded-2xl border shadow-sm overflow-hidden hover:shadow-md transition-shadow ${st.bg}`}>
                <div className={`absolute top-0 right-0 left-0 h-1 ${st.barColor}`} />
                <div className="p-4 pt-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {isManagerOrAdmin && <p className="text-sm font-bold text-slate-800 mb-1">{ot.employeeName}</p>}
                      <div className="flex items-center gap-2">
                        <Timer className="w-4 h-4 text-slate-400" />
                        <span className="text-2xl font-bold text-slate-800">{ot.hours}</span>
                        <span className="text-sm text-slate-500 font-medium">ساعة</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(ot.date).toLocaleDateString("ar-SA", { weekday: "short", month: "long", day: "numeric" })}
                      </p>
                      {ot.reason && <p className="text-xs text-slate-400 mt-1 line-clamp-1">{ot.reason}</p>}
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0 ${st.text} bg-white/80`}>{st.label}</span>
                  </div>
                  {isManagerOrAdmin && ot.status === "pending" && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-slate-200/60">
                      <button
                        onClick={() => approveMutation.mutate({ id: ot.id }, { onSuccess: invalidate })}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> موافقة
                      </button>
                      <button
                        onClick={() => setRejectId(ot.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-semibold transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" /> رفض
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center py-16 text-slate-400">
          <Clock className="w-10 h-10 mb-2 opacity-30" />
          <p className="text-sm">لا توجد طلبات وقت إضافي</p>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle>طلب وقت إضافي</DialogTitle>
            <DialogDescription>سجّل ساعات العمل الإضافي</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate({ data: { date: form.date, hours: parseFloat(form.hours), reason: form.reason } }, {
              onSuccess: () => { invalidate(); setShowDialog(false); setForm({ date: "", hours: "", reason: "" }); }
            });
          }} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">التاريخ</Label>
              <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">عدد الساعات</Label>
              <Input type="number" step="0.5" min="0.5" max="12" value={form.hours} onChange={e => setForm({ ...form, hours: e.target.value })} required placeholder="مثال: 2.5" className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">السبب (اختياري)</Label>
              <Textarea value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} rows={2} className="resize-none" />
            </div>
            <DialogFooter>
              <button type="button" onClick={() => setShowDialog(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">إلغاء</button>
              <button type="submit" disabled={createMutation.isPending} className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold disabled:opacity-60">
                {createMutation.isPending ? "جاري الإرسال..." : "إرسال"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectId !== null} onOpenChange={() => setRejectId(null)}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle>رفض طلب الوقت الإضافي</DialogTitle>
            <DialogDescription>سبب الرفض (اختياري)</DialogDescription>
          </DialogHeader>
          <Textarea value={rejectNote} onChange={e => setRejectNote(e.target.value)} rows={3} placeholder="أدخل سبب الرفض..." className="resize-none" />
          <DialogFooter>
            <button onClick={() => setRejectId(null)} className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600">إلغاء</button>
            <button
              onClick={() => {
                if (rejectId) rejectMutation.mutate({ id: rejectId, data: { note: rejectNote } as any }, {
                  onSuccess: () => { invalidate(); setRejectId(null); setRejectNote(""); }
                });
              }}
              className="px-5 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold"
            >رفض</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
