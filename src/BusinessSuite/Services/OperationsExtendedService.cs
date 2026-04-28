using BusinessSuite.Data;
using BusinessSuite.Data.Models;
using Microsoft.EntityFrameworkCore;

namespace BusinessSuite.Services;

public class OperationsExtendedService
{
    private readonly IDbContextFactory<AppDbContext> _factory;
    private readonly AuthService _auth;

    public OperationsExtendedService(IDbContextFactory<AppDbContext> factory, AuthService auth)
    {
        _factory = factory;
        _auth = auth;
    }

    // ---------- Sales Returns ----------
    public async Task<List<SalesReturn>> GetReturnsAsync(DateTime? from = null, DateTime? to = null)
    {
        await using var db = _factory.CreateDbContext();
        var q = db.SalesReturns.Include(r => r.Items).AsQueryable();
        if (from.HasValue) q = q.Where(r => r.Date >= from.Value);
        if (to.HasValue) q = q.Where(r => r.Date <= to.Value.AddDays(1));
        return await q.OrderByDescending(r => r.Date).ToListAsync();
    }

    public async Task<SalesReturn> CreateReturnAsync(SalesReturn r)
    {
        await using var db = _factory.CreateDbContext();
        var count = await db.SalesReturns.CountAsync() + 1;
        r.ReturnNumber = $"RET-{DateTime.Now:yyyyMM}-{count:D4}";
        r.CreatedBy = _auth.CurrentUser?.FullName ?? "النظام";
        r.Subtotal = r.Items.Sum(i => i.LineTotal);
        r.Tax = Math.Round(r.Subtotal * 0.15m, 2);
        r.Total = r.Subtotal + r.Tax;
        db.SalesReturns.Add(r);

        // Restore stock
        foreach (var it in r.Items)
        {
            var p = await db.Products.FindAsync(it.ProductId);
            if (p != null) p.Quantity += it.Quantity;
            db.StockMovements.Add(new StockMovement
            {
                ProductId = it.ProductId,
                ProductName = it.ProductName,
                Type = MovementType.Return,
                Change = it.Quantity,
                BalanceAfter = p?.Quantity ?? 0,
                Reference = r.ReturnNumber,
                User = r.CreatedBy,
                Notes = $"مرتجع: {r.Reason}",
            });
        }

        // Create reverse journal entry
        db.JournalEntries.Add(new JournalEntry
        {
            Date = r.Date,
            Type = EntryType.Expense,
            Category = "مرتجع مبيعات",
            Description = $"{r.ReturnNumber}: {r.Reason}",
            Amount = r.Total,
            Reference = r.ReturnNumber,
        });

        await db.SaveChangesAsync();
        return r;
    }

    public async Task DeleteReturnAsync(int id)
    {
        await using var db = _factory.CreateDbContext();
        var r = await db.SalesReturns.Include(x => x.Items).FirstOrDefaultAsync(x => x.Id == id);
        if (r == null) return;
        db.SalesReturnItems.RemoveRange(r.Items);
        db.SalesReturns.Remove(r);
        await db.SaveChangesAsync();
    }

    // ---------- Stock Issue Vouchers ----------
    public async Task<List<StockIssueVoucher>> GetIssuesAsync(DateTime? from = null, DateTime? to = null)
    {
        await using var db = _factory.CreateDbContext();
        var q = db.StockIssues.Include(s => s.Items).AsQueryable();
        if (from.HasValue) q = q.Where(s => s.Date >= from.Value);
        if (to.HasValue) q = q.Where(s => s.Date <= to.Value.AddDays(1));
        return await q.OrderByDescending(s => s.Date).ToListAsync();
    }

    public async Task<StockIssueVoucher> CreateIssueAsync(StockIssueVoucher v)
    {
        await using var db = _factory.CreateDbContext();
        var count = await db.StockIssues.CountAsync() + 1;
        v.VoucherNumber = $"SIV-{DateTime.Now:yyyyMM}-{count:D4}";
        v.CreatedBy = _auth.CurrentUser?.FullName ?? "النظام";
        db.StockIssues.Add(v);
        await db.SaveChangesAsync();
        return v;
    }

    public async Task PostIssueAsync(int id)
    {
        await using var db = _factory.CreateDbContext();
        var v = await db.StockIssues.Include(x => x.Items).FirstOrDefaultAsync(x => x.Id == id);
        if (v == null || v.IsPosted) return;
        v.IsPosted = true;

        foreach (var it in v.Items)
        {
            var p = await db.Products.FindAsync(it.ProductId);
            if (p != null)
            {
                p.Quantity = Math.Max(0, p.Quantity - it.Quantity);
                db.StockMovements.Add(new StockMovement
                {
                    ProductId = it.ProductId,
                    ProductName = it.ProductName,
                    Type = MovementType.Adjustment,
                    Change = -it.Quantity,
                    BalanceAfter = p.Quantity,
                    Reference = v.VoucherNumber,
                    User = v.CreatedBy,
                    Notes = $"صرف مخزني - {ReasonAr(v.Reason)} ({v.ReceivedBy})",
                });
            }
        }

        var totalCost = v.Items.Sum(i => i.LineTotal);
        if (totalCost > 0)
        {
            db.JournalEntries.Add(new JournalEntry
            {
                Date = v.Date,
                Type = EntryType.Expense,
                Category = "صرف مخزني",
                Description = $"{v.VoucherNumber}: {ReasonAr(v.Reason)} - {v.ReceivedBy}",
                Amount = totalCost,
                Reference = v.VoucherNumber,
            });
        }

        await db.SaveChangesAsync();
    }

    public async Task DeleteIssueAsync(int id)
    {
        await using var db = _factory.CreateDbContext();
        var v = await db.StockIssues.Include(x => x.Items).FirstOrDefaultAsync(x => x.Id == id);
        if (v == null) return;
        db.StockIssueItems.RemoveRange(v.Items);
        db.StockIssues.Remove(v);
        await db.SaveChangesAsync();
    }

    public static string ReasonAr(StockIssueReason r) => r switch
    {
        StockIssueReason.InternalUse => "استخدام داخلي",
        StockIssueReason.Transfer => "تحويل",
        StockIssueReason.Damaged => "تالف",
        StockIssueReason.Sample => "عينة",
        _ => "أخرى"
    };

    // ---------- Maintenance ----------
    public async Task<List<MaintenanceRequest>> GetMaintenanceAsync(MaintenanceStatus? status = null)
    {
        await using var db = _factory.CreateDbContext();
        var q = db.MaintenanceRequests.AsQueryable();
        if (status.HasValue) q = q.Where(m => m.Status == status.Value);
        return await q.OrderByDescending(m => m.Date).ToListAsync();
    }

    public async Task<MaintenanceRequest> SaveMaintenanceAsync(MaintenanceRequest m)
    {
        await using var db = _factory.CreateDbContext();
        if (m.Id == 0)
        {
            var count = await db.MaintenanceRequests.CountAsync() + 1;
            m.TicketNumber = $"MNT-{DateTime.Now:yyyyMM}-{count:D4}";
            db.MaintenanceRequests.Add(m);
        }
        else
        {
            db.MaintenanceRequests.Update(m);
        }
        await db.SaveChangesAsync();
        return m;
    }

    public async Task UpdateMaintenanceStatusAsync(int id, MaintenanceStatus status)
    {
        await using var db = _factory.CreateDbContext();
        var m = await db.MaintenanceRequests.FindAsync(id);
        if (m == null) return;
        m.Status = status;
        if (status == MaintenanceStatus.Completed) m.CompletedAt = DateTime.Now;
        await db.SaveChangesAsync();
    }

    public async Task DeleteMaintenanceAsync(int id)
    {
        await using var db = _factory.CreateDbContext();
        var m = await db.MaintenanceRequests.FindAsync(id);
        if (m != null) { db.MaintenanceRequests.Remove(m); await db.SaveChangesAsync(); }
    }

    // ---------- Department Sales Report ----------
    public record DepartmentSalesRow(string Category, int Quantity, decimal Total);

    public async Task<List<DepartmentSalesRow>> GetDepartmentSalesAsync(DateTime? from = null, DateTime? to = null)
    {
        await using var db = _factory.CreateDbContext();
        var q = db.SaleInvoiceItems
            .Include(i => i.Invoice)
            .Include(i => i.Product)
            .Where(i => i.Invoice != null && !i.Invoice.IsCancelled);
        if (from.HasValue) q = q.Where(i => i.Invoice!.Date >= from.Value);
        if (to.HasValue) q = q.Where(i => i.Invoice!.Date <= to.Value.AddDays(1));

        var data = await q.ToListAsync();
        return data.GroupBy(i => i.Product?.Category ?? "غير مصنف")
                   .Select(g => new DepartmentSalesRow(g.Key, g.Sum(x => x.Quantity), g.Sum(x => x.LineTotal)))
                   .OrderByDescending(r => r.Total)
                   .ToList();
    }
}
