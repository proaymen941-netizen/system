import { useState } from "react";
import {
  useListAnnouncements, getListAnnouncementsQueryKey,
  useCreateAnnouncement, useDeleteAnnouncement
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { Plus, Trash2, Megaphone, AlertTriangle, Info, ChevronDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const priorityConfig: Record<string, { label: string; bg: string; text: string; border: string; iconBg: string; icon: any }> = {
  urgent: { label: "عاجل", bg: "bg-red-50", text: "text-red-700", border: "border-red-200", iconBg: "bg-red-100", icon: AlertTriangle },
  high: { label: "مهم", bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200", iconBg: "bg-sky-100", icon: Info },
  normal: { label: "عادي", bg: "bg-white", text: "text-slate-600", border: "border-slate-200", iconBg: "bg-slate-100", icon: Megaphone },
  low: { label: "منخفض", bg: "bg-white", text: "text-slate-500", border: "border-slate-200", iconBg: "bg-slate-50", icon: Megaphone },
};

export default function AnnouncementsPage() {
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", priority: "normal" });
  const queryClient = useQueryClient();
  const { employee } = useAuth();

  const { data: announcements, isLoading } = useListAnnouncements();
  const createMutation = useCreateAnnouncement();
  const deleteMutation = useDeleteAnnouncement();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListAnnouncementsQueryKey() });
  const isManagerOrAdmin = employee?.role === "admin" || employee?.role === "manager";
  const list = (announcements as any[]) || [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">الإعلانات</h1>
          <p className="text-slate-500 text-sm mt-1">{list.length} إعلان</p>
        </div>
        {isManagerOrAdmin && (
          <button
            onClick={() => setShowDialog(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            إعلان جديد
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}</div>
      ) : list.length > 0 ? (
        <div className="space-y-4">
          {list.map((ann: any) => {
            const p = priorityConfig[ann.priority] || priorityConfig.normal;
            const Icon = p.icon;
            return (
              <div key={ann.id} className={`relative rounded-2xl border shadow-sm overflow-hidden ${p.bg} ${p.border}`}>
                {ann.priority === "urgent" && (
                  <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-l from-red-400 to-red-600" />
                )}
                {ann.priority === "high" && (
                  <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-l from-sky-400 to-sky-600" />
                )}
                <div className="p-5 pt-6">
                  <div className="flex items-start gap-4">
                    <div className={`p-2.5 rounded-xl flex-shrink-0 ${p.iconBg}`}>
                      <Icon className={`w-5 h-5 ${p.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <h3 className="font-bold text-slate-800">{ann.title}</h3>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${p.bg} ${p.text} ${p.border}`}>
                          {p.label}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">{ann.content}</p>
                      <div className="flex items-center gap-2 mt-3 text-xs text-slate-400">
                        <span className="font-medium">{ann.createdByName}</span>
                        <span>·</span>
                        <span>{new Date(ann.createdAt).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" })}</span>
                      </div>
                    </div>
                    {isManagerOrAdmin && (
                      <button
                        onClick={() => { if (confirm("هل تريد حذف هذا الإعلان؟")) deleteMutation.mutate({ id: ann.id }, { onSuccess: invalidate }); }}
                        className="p-2 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center py-20 text-slate-400">
          <Megaphone className="w-14 h-14 mb-3 opacity-20" />
          <p className="text-sm font-medium">لا توجد إعلانات حالياً</p>
          {isManagerOrAdmin && (
            <button onClick={() => setShowDialog(true)} className="mt-3 text-sky-600 text-sm font-semibold hover:underline">أنشئ أول إعلان</button>
          )}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>إعلان جديد</DialogTitle>
            <DialogDescription>أنشئ إعلاناً للموظفين</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate({ data: form as any }, {
              onSuccess: () => { invalidate(); setShowDialog(false); setForm({ title: "", content: "", priority: "normal" }); }
            });
          }} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">العنوان *</Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">المحتوى *</Label>
              <Textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={4} required className="resize-none" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">الأولوية</Label>
              <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">عاجل</SelectItem>
                  <SelectItem value="high">مهم</SelectItem>
                  <SelectItem value="normal">عادي</SelectItem>
                  <SelectItem value="low">منخفض</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <button type="button" onClick={() => setShowDialog(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">إلغاء</button>
              <button type="submit" disabled={createMutation.isPending} className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold disabled:opacity-60">
                {createMutation.isPending ? "جاري النشر..." : "نشر الإعلان"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
