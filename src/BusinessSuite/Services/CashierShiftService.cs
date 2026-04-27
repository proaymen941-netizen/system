using BusinessSuite.Data;
using BusinessSuite.Data.Models;
using Microsoft.EntityFrameworkCore;

namespace BusinessSuite.Services;

public class CashierShiftService
{
    private readonly IDbContextFactory<AppDbContext> _factory;
    private readonly AuthService _auth;

    public CashierShiftService(IDbContextFactory<AppDbContext> factory, AuthService auth)
    {
        _factory = factory;
        _auth = auth;
    }

    public async Task<CashierShift?> GetActiveShiftAsync()
    {
        if (_auth.CurrentUser == null) return null;
        await using var db = _factory.CreateDbContext();
        return await db.CashierShifts
            .Where(s => s.CashierId == _auth.CurrentUser.Id && !s.IsClosed)
            .OrderByDescending(s => s.OpenedAt)
            .FirstOrDefaultAsync();
    }

    public async Task<CashierShift> OpenShiftAsync(decimal openingCash)
    {
        if (!_auth.HasRole(UserRole.Admin, UserRole.Cashier, UserRole.Accountant))
            throw new AuthorizationException();
        await using var db = _factory.CreateDbContext();
        var shift = new CashierShift
        {
            CashierId = _auth.CurrentUser!.Id,
            CashierName = _auth.CurrentUser.FullName,
            OpenedAt = DateTime.Now,
            OpeningCash = openingCash,
        };
        db.CashierShifts.Add(shift);
        await db.SaveChangesAsync();
        return shift;
    }

    public async Task CloseShiftAsync(int shiftId, decimal closingCash, string notes)
    {
        await using var db = _factory.CreateDbContext();
        var shift = await db.CashierShifts.FindAsync(shiftId);
        if (shift == null || shift.IsClosed) return;

        var from = shift.OpenedAt;
        var to = DateTime.Now;
        var invoices = await db.SaleInvoices
            .Where(s => s.CashierId == shift.CashierId && s.Date >= from && s.Date <= to && !s.IsCancelled)
            .ToListAsync();

        shift.ClosedAt = to;
        shift.ClosingCash = closingCash;
        shift.Notes = notes;
        shift.IsClosed = true;
        shift.InvoiceCount = invoices.Count;
        shift.TotalSales = invoices.Sum(i => i.Total);
        shift.TotalCash = invoices.Where(i => i.PaymentMethod == "نقدي").Sum(i => i.Total);
        shift.TotalCard = invoices.Where(i => i.PaymentMethod == "بطاقة").Sum(i => i.Total);
        shift.TotalOther = invoices.Where(i => i.PaymentMethod != "نقدي" && i.PaymentMethod != "بطاقة").Sum(i => i.Total);

        await db.SaveChangesAsync();
    }

    public async Task<List<CashierShift>> GetShiftsAsync(DateTime? from = null, DateTime? to = null, int? cashierId = null)
    {
        await using var db = _factory.CreateDbContext();
        var q = db.CashierShifts.AsQueryable();
        if (from.HasValue) q = q.Where(s => s.OpenedAt >= from.Value);
        if (to.HasValue) q = q.Where(s => s.OpenedAt <= to.Value.AddDays(1));
        if (cashierId.HasValue) q = q.Where(s => s.CashierId == cashierId.Value);
        return await q.OrderByDescending(s => s.OpenedAt).ToListAsync();
    }

    public async Task<List<SaleInvoice>> GetShiftInvoicesAsync(int shiftId)
    {
        await using var db = _factory.CreateDbContext();
        var shift = await db.CashierShifts.FindAsync(shiftId);
        if (shift == null) return new();
        var from = shift.OpenedAt;
        var to = shift.ClosedAt ?? DateTime.Now;
        return await db.SaleInvoices
            .Include(s => s.Items)
            .Where(s => s.CashierId == shift.CashierId && s.Date >= from && s.Date <= to)
            .OrderBy(s => s.Date)
            .ToListAsync();
    }

    public async Task<List<SaleInvoice>> GetCashierSalesReportAsync(int cashierId, DateTime? from = null, DateTime? to = null)
    {
        await using var db = _factory.CreateDbContext();
        var q = db.SaleInvoices.Include(s => s.Items)
            .Where(s => s.CashierId == cashierId && !s.IsCancelled);
        if (from.HasValue) q = q.Where(s => s.Date >= from.Value);
        if (to.HasValue) q = q.Where(s => s.Date <= to.Value.AddDays(1));
        return await q.OrderByDescending(s => s.Date).ToListAsync();
    }
}
