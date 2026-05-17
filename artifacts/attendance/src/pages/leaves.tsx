import { useState } from "react";
import {
  useListLeaves, getListLeavesQueryKey,
  useCreateLeave, useApproveLeave, useRejectLeave
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { Plus, CheckCircle2, XCircle, Clock, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const statusConfig: Record<string, { label: string; bg: string; text: string; icon: any; iconColor: string }> = {
  pending: { label: "معلق", bg: "bg-amber-50", text: "text-amber-700", icon: Clock, iconColor: "text-amber-500" },
  approved: { label: "موافق عليه", bg: "bg-emerald-50", text: "text-emerald-700", icon: CheckCircle2, iconColor: "text-emerald-500" },
  rejected: { label: "مرفوض", bg: "bg-red-50", text: "text-red-700", icon: XCircle, iconColor: "text-red-500" },
};

const leaveTypes: Record<string, string> = {
  annual: "إجازة سنوية", sick: "إجازة مرضية", emergency: "إجازة طارئة", unpaid: "بدون راتب", other: "أخرى"
};

export default function LeavesPage() {
  const [tab, setTab] = useState("pending");
  const [showDialog, setShowDialog] = useState(false);
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [form, setForm] = useState({ leaveType: "annual", startDate: "", endDate: "", reason: "" });
  const queryClient = useQueryClient();
  const { employee } = useAuth();

  const { data: leaves, isLoading } = useListLeaves({ status: tab as any });
  const createMutation = useCreateLeave();
  const approveMutation = useApproveLeave();
  const rejectMutation = useRejectLeave();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListLeavesQueryKey() });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ data: form as any }, {
      onSuccess: () => { invalidate(); setShowDialog(false); setForm({ leaveType: "annual", startDate: "", endDate: "", reason: "" }); }
    });
  };

  const isManagerOrAdmin = employee?.role === "admin" || employee?.role === "manager";
  const list = (leaves as any[]) || [];

  const tabs = [
    { id: "pending", label: "معلقة" },
    { id: "approved", label: "موافق عليها" },
    { id: "rejected", label: "مرفوضة" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">الإجازات</h1>
          <p className="text-slate-500 text-sm mt-1">إدارة طلبات الإجازات</p>
        </div>
        <button
          onClick={() => setShowDialog(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          طلب إجازة
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

      {/* List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
        ) : list.length > 0 ? (
          <div className="divide-y divide-slate-50">
            {list.map((leave: any) => {
              const st = statusConfig[leave.status] || statusConfig.pending;
              const Icon = st.icon;
              return (
                <div key={leave.id} className="flex items-start gap-4 px-5 py-4 hover:bg-slate-50/70 transition-colors">
                  <div className={`p-2 rounded-xl flex-shrink-0 ${st.bg}`}>
                    <Icon className={`w-5 h-5 ${st.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {isManagerOrAdmin && <span className="text-sm font-bold text-slate-800">{leave.employeeName}</span>}
                      {isManagerOrAdmin && <span className="text-slate-300">·</span>}
                      <span className="text-sm font-semibold text-slate-800">{leaveTypes[leave.leaveType] || leave.leaveType}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.bg} ${st.text}`}>{st.label}</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {new Date(leave.startDate).toLocaleDateString("ar-SA")} — {new Date(leave.endDate).toLocaleDateString("ar-SA")}
                      <span className="font-semibold text-slate-700"> ({leave.days} يوم)</span>
                    </p>
                    {leave.reason && <p className="text-xs text-slate-400 mt-1">{leave.reason}</p>}
                    {leave.reviewNote && <p className="text-xs text-red-500 mt-1">ملاحظة: {leave.reviewNote}</p>}
                  </div>
                  {isManagerOrAdmin && leave.status === "pending" && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => approveMutation.mutate({ id: leave.id }, { onSuccess: invalidate })}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> قبول
                      </button>
                      <button
                        onClick={() => setRejectId(leave.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" /> رفض
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Calendar className="w-10 h-10 mb-2 opacity-30" />
            <p className="text-sm">لا توجد طلبات إجازة</p>
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>طلب إجازة جديد</DialogTitle>
            <DialogDescription>أدخل تفاصيل طلب الإجازة</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">نوع الإجازة</Label>
              <Select value={form.leaveType} onValueChange={v => setForm({ ...form, leaveType: v })}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(leaveTypes).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">من تاريخ</Label>
                <Input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} required className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">إلى تاريخ</Label>
                <Input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} required className="h-10" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">السبب (اختياري)</Label>
              <Textarea value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} rows={3} className="resize-none" />
            </div>
            <DialogFooter>
              <button type="button" onClick={() => setShowDialog(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">إلغاء</button>
              <button type="submit" disabled={createMutation.isPending} className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold disabled:opacity-60">
                {createMutation.isPending ? "جاري الإرسال..." : "إرسال الطلب"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectId !== null} onOpenChange={() => setRejectId(null)}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle>رفض طلب الإجازة</DialogTitle>
            <DialogDescription>أدخل سبب الرفض للموظف</DialogDescription>
          </DialogHeader>
          <Textarea value={rejectNote} onChange={e => setRejectNote(e.target.value)} rows={3} placeholder="سبب الرفض (اختياري)..." className="resize-none" />
          <DialogFooter>
            <button onClick={() => setRejectId(null)} className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">إلغاء</button>
            <button
              onClick={() => {
                if (rejectId) rejectMutation.mutate({ id: rejectId, data: { note: rejectNote } as any }, {
                  onSuccess: () => { invalidate(); setRejectId(null); setRejectNote(""); }
                });
              }}
              disabled={rejectMutation.isPending}
              className="px-5 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold disabled:opacity-60"
            >
              تأكيد الرفض
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
