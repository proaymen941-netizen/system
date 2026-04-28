using System.ComponentModel.DataAnnotations;

namespace BusinessSuite.Data.Models;

public static class PermissionKeys
{
    public const string PosUse = "pos.use";
    public const string PosDiscount = "pos.discount";
    public const string PosCancelInvoice = "pos.cancel_invoice";

    public const string SalesView = "sales.view";
    public const string SalesEdit = "sales.edit";
    public const string SalesReturn = "sales.return";

    public const string PurchasesView = "purchases.view";
    public const string PurchasesEdit = "purchases.edit";

    public const string InventoryView = "inventory.view";
    public const string InventoryEdit = "inventory.edit";
    public const string InventoryIssue = "inventory.issue";

    public const string CustomersView = "customers.view";
    public const string CustomersEdit = "customers.edit";

    public const string AccountingView = "accounting.view";
    public const string AccountingEntry = "accounting.entry";
    public const string AccountingReceipt = "accounting.receipt";
    public const string AccountingPayment = "accounting.payment";
    public const string AccountingPosting = "accounting.posting";

    public const string HrView = "hr.view";
    public const string HrEdit = "hr.edit";
    public const string HrPayroll = "hr.payroll";
    public const string HrPenalties = "hr.penalties";
    public const string HrAbsence = "hr.absence";
    public const string HrInstallments = "hr.installments";

    public const string ReportsView = "reports.view";
    public const string ReportsExport = "reports.export";

    public const string CashierShifts = "cashier.shifts";
    public const string CashierClose = "cashier.close";

    public const string MaintenanceView = "maintenance.view";
    public const string MaintenanceEdit = "maintenance.edit";

    public const string SystemUsers = "system.users";
    public const string SystemPermissions = "system.permissions";
    public const string SystemLicense = "system.license";
    public const string SystemSettings = "system.settings";
    public const string SystemBackup = "system.backup";
    public const string SystemAudit = "system.audit";

    public static readonly (string Key, string Label, string Group)[] All = new[]
    {
        (PosUse, "استخدام نقطة البيع", "نقطة البيع"),
        (PosDiscount, "منح خصم في الفاتورة", "نقطة البيع"),
        (PosCancelInvoice, "إلغاء فاتورة", "نقطة البيع"),

        (SalesView, "عرض المبيعات", "المبيعات"),
        (SalesEdit, "تعديل المبيعات", "المبيعات"),
        (SalesReturn, "مرتجع المبيعات", "المبيعات"),

        (PurchasesView, "عرض المشتريات", "المشتريات"),
        (PurchasesEdit, "تعديل المشتريات", "المشتريات"),

        (InventoryView, "عرض المخزون", "المخزون"),
        (InventoryEdit, "تعديل المخزون", "المخزون"),
        (InventoryIssue, "صرف مخزني", "المخزون"),

        (CustomersView, "عرض العملاء", "العملاء"),
        (CustomersEdit, "تعديل العملاء", "العملاء"),

        (AccountingView, "عرض المحاسبة", "المحاسبة"),
        (AccountingEntry, "إدخال قيود يومية", "المحاسبة"),
        (AccountingReceipt, "سندات قبض", "المحاسبة"),
        (AccountingPayment, "سندات صرف", "المحاسبة"),
        (AccountingPosting, "ترحيل السندات", "المحاسبة"),

        (HrView, "عرض الموارد البشرية", "الموارد البشرية"),
        (HrEdit, "تعديل الموظفين", "الموارد البشرية"),
        (HrPayroll, "الرواتب", "الموارد البشرية"),
        (HrPenalties, "الجزاءات والمكافآت", "الموارد البشرية"),
        (HrAbsence, "الغياب الشهري", "الموارد البشرية"),
        (HrInstallments, "الأقساط", "الموارد البشرية"),

        (ReportsView, "عرض التقارير", "التقارير"),
        (ReportsExport, "تصدير التقارير", "التقارير"),

        (CashierShifts, "ورديات الكاشير", "الكاشير"),
        (CashierClose, "إقفال الكاشير", "الكاشير"),

        (MaintenanceView, "عرض الصيانة", "الصيانة"),
        (MaintenanceEdit, "إدارة الصيانة", "الصيانة"),

        (SystemUsers, "إدارة المستخدمين", "النظام"),
        (SystemPermissions, "إدارة الصلاحيات", "النظام"),
        (SystemLicense, "إدارة التراخيص", "النظام"),
        (SystemSettings, "إعدادات الشركة", "النظام"),
        (SystemBackup, "النسخ الاحتياطي", "النظام"),
        (SystemAudit, "سجل العمليات", "النظام"),
    };
}

public class UserPermission
{
    public int Id { get; set; }
    public int UserId { get; set; }

    [Required, MaxLength(80)]
    public string PermissionKey { get; set; } = string.Empty;

    public bool IsGranted { get; set; } = true;
}
