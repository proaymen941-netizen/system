using BusinessSuite.Data;
using Microsoft.EntityFrameworkCore;

namespace BusinessSuite.Services;

public class NotificationService
{
    private readonly IDbContextFactory<AppDbContext> _factory;
    public NotificationService(IDbContextFactory<AppDbContext> factory) => _factory = factory;

    public async Task<List<Notification>> GetAsync()
    {
        await using var db = _factory.CreateDbContext();
        var list = new List<Notification>();

        var lowStock = await db.Products.Where(p => p.Quantity <= p.MinQuantity).ToListAsync();
        foreach (var p in lowStock)
            list.Add(new Notification("⚠️", "نقص في المخزون", $"المنتج \"{p.Name}\" — الكمية {p.Quantity}", NoticeKind.Warning, "/inventory"));

        var pendingPurchases = await db.PurchaseInvoices.Where(p => p.Status == "معلق").CountAsync();
        if (pendingPurchases > 0)
            list.Add(new Notification("🧾", "فواتير شراء غير مدفوعة", $"يوجد {pendingPurchases} فاتورة شراء معلقة", NoticeKind.Info, "/purchases"));

        var onLeave = await db.Employees.Where(e => e.Status == Data.Models.EmployeeStatus.OnLeave).CountAsync();
        if (onLeave > 0)
            list.Add(new Notification("🏖️", "موظفون في إجازة", $"{onLeave} موظف(ون) في إجازة حالياً", NoticeKind.Info, "/hr"));

        var lastSale = await db.SaleInvoices.OrderByDescending(s => s.Date).FirstOrDefaultAsync();
        if (lastSale != null)
            list.Add(new Notification("💵", "آخر عملية بيع", $"فاتورة {lastSale.InvoiceNumber} بقيمة {lastSale.Total:N2} ريال", NoticeKind.Success, "/sales"));

        return list;
    }
}

public enum NoticeKind { Info, Success, Warning, Danger }
public record Notification(string Emoji, string Title, string Message, NoticeKind Kind, string? Link);
