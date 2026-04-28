using BusinessSuite.Data;
using BusinessSuite.Data.Models;
using Microsoft.EntityFrameworkCore;

namespace BusinessSuite.Services;

public class DashboardService
{
    private readonly IDbContextFactory<AppDbContext> _factory;
    public DashboardService(IDbContextFactory<AppDbContext> factory) => _factory = factory;

    public async Task<DashboardSummary> GetSummaryAsync()
    {
        await using var db = _factory.CreateDbContext();
        var today = DateTime.Today;
        var weekAgo = today.AddDays(-6);

        var sales = await db.SaleInvoices.Include(s => s.Items).ToListAsync();
        var purchases = await db.PurchaseInvoices.ToListAsync();
        var entries = await db.JournalEntries.ToListAsync();
        var products = await db.Products.ToListAsync();
        var employees = await db.Employees.CountAsync();
        var suppliers = await db.Suppliers.CountAsync();

        var todaySales = sales.Where(s => s.Date.Date == today).Sum(s => s.Total);
        var totalSales = sales.Sum(s => s.Total);
        var totalPurchases = purchases.Sum(p => p.Total);
        var profit = totalSales - totalPurchases;

        var lowStock = products.Where(p => p.Quantity <= p.MinQuantity).ToList();

        var dailySales = new List<(string Day, decimal Amount)>();
        string[] dayNames = { "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت" };
        for (int i = 6; i >= 0; i--)
        {
            var d = today.AddDays(-i);
            var amt = sales.Where(s => s.Date.Date == d).Sum(s => s.Total);
            dailySales.Add((dayNames[(int)d.DayOfWeek], amt));
        }

        var byCategory = products
            .Join(db.SaleInvoiceItems, p => p.Id, i => i.ProductId, (p, i) => new { p.Category, i.LineTotal })
            .GroupBy(x => x.Category)
            .Select(g => new CategorySlice(g.Key, g.Sum(x => (decimal)x.LineTotal)))
            .ToList();
        if (byCategory.Sum(x => x.Amount) == 0)
            byCategory = new List<CategorySlice> { new("إلكترونيات", 40), new("ملابس", 25), new("مواد غذائية", 20), new("أخرى", 15) };

        var recentSales = sales.OrderByDescending(s => s.Date).Take(4)
            .Select(s => new RecentSale(s.Date, s.InvoiceNumber, s.Total)).ToList();

        return new DashboardSummary(
            TotalSales: totalSales,
            TotalPurchases: totalPurchases,
            Profit: profit,
            LowStockCount: lowStock.Count,
            TransactionsToday: sales.Count(s => s.Date.Date == today),
            EmployeesCount: employees,
            SuppliersCount: suppliers,
            DailySales: dailySales,
            CategoryBreakdown: byCategory,
            LowStock: lowStock.Select(p => new LowStockItem(p.Name, p.Quantity, p.ImageEmoji)).ToList(),
            RecentSales: recentSales,
            TodaySales: todaySales
        );
    }
}

public record DashboardSummary(
    decimal TotalSales,
    decimal TotalPurchases,
    decimal Profit,
    int LowStockCount,
    int TransactionsToday,
    int EmployeesCount,
    int SuppliersCount,
    List<(string Day, decimal Amount)> DailySales,
    List<CategorySlice> CategoryBreakdown,
    List<LowStockItem> LowStock,
    List<RecentSale> RecentSales,
    decimal TodaySales
);

public record CategorySlice(string Category, decimal Amount);
public record LowStockItem(string Name, int Quantity, string Emoji);
public record RecentSale(DateTime Date, string Number, decimal Amount);
