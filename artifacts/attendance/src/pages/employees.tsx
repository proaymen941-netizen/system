import { useState } from "react";
import {
  useListEmployees, getListEmployeesQueryKey,
  useCreateEmployee, useUpdateEmployee
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Edit2, UserX, UserCheck, Users, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const roleConfig: Record<string, { label: string; bg: string; text: string }> = {
  admin: { label: "مسؤول", bg: "bg-violet-100", text: "text-violet-700" },
  manager: { label: "مدير", bg: "bg-sky-100", text: "text-sky-700" },
  employee: { label: "موظف", bg: "bg-slate-100", text: "text-slate-600" },
};

const EMPTY_FORM = { username: "", password: "", name: "", nameAr: "", role: "employee", department: "", position: "", phone: "", email: "" };

export default function EmployeesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [showDialog, setShowDialog] = useState(false);
  const [editEmployee, setEditEmployee] = useState<any>(null);
  const [form, setForm] = useState<any>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const queryClient = useQueryClient();

  const { data: employees, isLoading } = useListEmployees({ status: statusFilter as any, search: search || undefined });
  const createMutation = useCreateEmployee();
  const updateMutation = useUpdateEmployee();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListEmployeesQueryKey() });

  const openCreate = () => { setEditEmployee(null); setForm(EMPTY_FORM); setError(""); setShowDialog(true); };
  const openEdit = (emp: any) => {
    setEditEmployee(emp);
    setForm({ username: emp.username, password: "", name: emp.name, nameAr: emp.nameAr || "", role: emp.role, department: emp.department || "", position: emp.position || "", phone: emp.phone || "", email: emp.email || "" });
    setError(""); setShowDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError("");
    const payload: any = { ...form };
    if (!payload.password) delete payload.password;
    if (!payload.nameAr) delete payload.nameAr;
    if (!payload.department) delete payload.department;
    if (!payload.position) delete payload.position;
    if (!payload.phone) delete payload.phone;
    if (!payload.email) delete payload.email;

    if (editEmployee) {
      updateMutation.mutate({ id: editEmployee.id, data: payload }, {
        onSuccess: () => { invalidate(); setShowDialog(false); setSaving(false); },
        onError: (e: any) => { setError(e?.data?.error || "حدث خطأ في الحفظ"); setSaving(false); }
      });
    } else {
      createMutation.mutate({ data: payload }, {
        onSuccess: () => { invalidate(); setShowDialog(false); setSaving(false); },
        onError: (e: any) => { setError(e?.data?.error || "حدث خطأ في الإضافة"); setSaving(false); }
      });
    }
  };

  const handleToggleStatus = (emp: any) => {
    updateMutation.mutate({ id: emp.id, data: { status: emp.status === "active" ? "inactive" : "active" } }, { onSuccess: invalidate });
  };

  const list = (employees as any[]) || [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">إدارة الموظفين</h1>
          <p className="text-slate-500 text-sm mt-1">{list.length} موظف مسجّل</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          إضافة موظف
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="البحث عن موظف..."
            className="w-full h-10 rounded-xl border border-slate-200 bg-white pr-9 pl-4 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <option value="active">نشط</option>
          <option value="inactive">معطّل</option>
        </select>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
        ) : list.length > 0 ? (
          <>
            {/* Header row */}
            <div className="hidden md:grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-4 px-5 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500">
              <div className="w-10" />
              <div>الموظف</div>
              <div>القسم</div>
              <div>الحالة</div>
              <div>إجراءات</div>
            </div>
            <div className="divide-y divide-slate-50">
              {list.map((emp: any) => {
                const role = roleConfig[emp.role] || roleConfig.employee;
                return (
                  <div key={emp.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/70 transition-colors">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <span className="text-white font-bold text-sm">{emp.name?.[0]}</span>
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-slate-800">{emp.name}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${role.bg} ${role.text}`}>{role.label}</span>
                      </div>
                      <p className="text-xs text-slate-400">{emp.username}{emp.position ? ` · ${emp.position}` : ""}</p>
                    </div>
                    {/* Department */}
                    <div className="hidden md:block text-sm text-slate-500 min-w-0">{emp.department || "—"}</div>
                    {/* Status */}
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${emp.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                      {emp.status === "active" ? "نشط" : "معطّل"}
                    </span>
                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(emp)}
                        className="p-2 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                        title="تعديل"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(emp)}
                        className={`p-2 rounded-lg transition-colors ${emp.status === "active" ? "text-slate-400 hover:text-red-500 hover:bg-red-50" : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"}`}
                        title={emp.status === "active" ? "تعطيل" : "تفعيل"}
                      >
                        {emp.status === "active" ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Users className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm font-medium">لا يوجد موظفون</p>
            <button onClick={openCreate} className="mt-3 text-sky-600 text-sm font-semibold hover:underline">إضافة موظف جديد</button>
          </div>
        )}
      </div>

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editEmployee ? "تعديل بيانات الموظف" : "إضافة موظف جديد"}</DialogTitle>
            <DialogDescription>{editEmployee ? `تعديل بيانات ${editEmployee.name}` : "أدخل بيانات الموظف الجديد"}</DialogDescription>
          </DialogHeader>
          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-3 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">الاسم *</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">الاسم بالعربي</Label>
                <Input value={form.nameAr} onChange={e => setForm({ ...form, nameAr: e.target.value })} className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">اسم المستخدم *</Label>
                <Input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required disabled={!!editEmployee} className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">{editEmployee ? "كلمة مرور جديدة" : "كلمة المرور *"}</Label>
                <Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required={!editEmployee} className="h-9 text-sm" placeholder={editEmployee ? "اتركه فارغاً إن لم تُغيّره" : ""} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">الصلاحية</Label>
                <Select value={form.role} onValueChange={v => setForm({ ...form, role: v })}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">موظف</SelectItem>
                    <SelectItem value="manager">مدير</SelectItem>
                    <SelectItem value="admin">مسؤول</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">القسم</Label>
                <Input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">المسمى الوظيفي</Label>
                <Input value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">رقم الهاتف</Label>
                <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="h-9 text-sm" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">البريد الإلكتروني</Label>
                <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="h-9 text-sm" />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <button type="button" onClick={() => setShowDialog(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                إلغاء
              </button>
              <button type="submit" disabled={saving} className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold transition-colors disabled:opacity-60">
                {saving ? "جاري الحفظ..." : editEmployee ? "حفظ التعديلات" : "إضافة الموظف"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
