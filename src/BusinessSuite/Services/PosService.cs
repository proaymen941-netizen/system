using BusinessSuite.Data;
using BusinessSuite.Data.Models;
using Microsoft.EntityFrameworkCore;

namespace BusinessSuite.Services;

public class PosService
{
    private readonly IDbContextFactory<AppDbContext> _factory;
    private readonly AuthService _auth;
    private readonly StockMovementService _stock;
    private readonly CompanySettingsService _settings;

    public PosService(IDbContextFactory<AppDbContext> factory, AuthService auth, StockMovementService stock, CompanySettingsService settings)
    {
        _factory = factory;
        _auth = auth;
        _stock = stock;
        _settings = settings;
    }

    public async Task<List<SaleInvoice>> GetRecentSalesAsync(int take = 50, DateTime? from = null, DateTime? to = null, string? status = null, string? search = null)
    {
        await using var db = _factory.CreateDbContext();
        var q = db.SaleInvoices.Include(s => s.Items).AsQueryable();
        if (from.HasValue) q = q.Where(s => s.Date >= from.Value);
        if (to.HasValue) q = q.Where(s => s.Date <= to.Value.AddDays(1));
        if (!string.IsNullOrWhiteSpace(status))
        {
            if (status == "cancelled") q = q.Where(s => s.IsCancelled);
            else if (status == "active") q = q.Where(s => !s.IsCancelled);
            else if (Enum.TryParse<InvoicePaymentStatus>(status, out var ps)) q = q.Where(s => s.PaymentStatus == ps);
        }
        if (!string.IsNullOrWhiteSpace(search))
            q = q.Where(s => s.InvoiceNumber.Contains(search) || s.CustomerName.Contains(search));
        return await q.OrderByDescending(s => s.Date).Take(take).ToListAsync();
    }

    public async Task<SaleInvoice?> GetSaleAsync(int id)
    {
        await using var db = _factory.CreateDbContext();
        return await db.SaleInvoices.Include(s => s.Items).FirstOrDefaultAsync(s => s.Id == id);
    }

    public async Task<int> CompleteSaleAsync(SaleInvoice invoice)
    {
        if (!_auth.HasRole(UserRole.Admin, UserRole.Cashier, UserRole.Accountant))
            throw new AuthorizationException();

        var settings = await _settings.GetAsync();
        await using var db = _factory.CreateDbContext();
        var maxId = await db.SaleInvoices.CountAsync();
        invoice.InvoiceNumber = $"#10{20 + maxId + 1}";
        invoice.Date = DateTime.Now;
        invoice.Subtotal = invoice.Items.Sum(i => i.LineTotal);
        invoice.Tax = Math.Round(invoice.Subtotal * (settings.TaxRate / 100m), 2);
        invoice.Total = invoice.Subtotal + invoice.Tax;
        if (invoice.PaymentStatus == InvoicePaymentStatus.Paid) { /* default */ }
        db.SaleInvoices.Add(invoice);

        foreach (var item in invoice.Items)
        {
            var product = await db.Products.FindAsync(item.ProductId);
            if (product != null)
            {
                product.Quantity = Math.Max(0, product.Quantity - item.Quantity);
                await _stock.LogAsync(db, product.Id, MovementType.Sale, -item.Quantity, invoice.InvoiceNumber, $"بيع - {invoice.CustomerName}");
            }
        }

        if (invoice.PaymentStatus == InvoicePaymentStatus.Paid)
        {
            db.JournalEntries.Add(new JournalEntry
            {
                Date = invoice.Date,
                Type = EntryType.Income,
                Category = "مبيعات",
                Description = $"فاتورة بيع {invoice.InvoiceNumber}",
                Amount = invoice.Total,
                Reference = invoice.InvoiceNumber,
            });
        }

        await db.SaveChangesAsync();
        return invoice.Id;
    }

    public async Task CancelSaleAsync(int id, string reason)
    {
        if (!_auth.HasRole(UserRole.Admin, UserRole.Accountant))
            throw new AuthorizationException();

        await using var db = _factory.CreateDbContext();
        var invoice = await db.SaleInvoices.Include(s => s.Items).FirstOrDefaultAsync(s => s.Id == id);
        if (invoice == null || invoice.IsCancelled) return;

        invoice.IsCancelled = true;
        invoice.PaymentStatus = InvoicePaymentStatus.Refunded;
        invoice.CancelledAt = DateTime.Now;
        invoice.CancellationReason = reason;

        foreach (var item in invoice.Items)
        {
            var product = await db.Products.FindAsync(item.ProductId);
            if (product != null)
            {
                product.Quantity += item.Quantity;
                await _stock.LogAsync(db, product.Id, MovementType.Cancellation, item.Quantity, invoice.InvoiceNumber, $"إلغاء/إرجاع - {reason}");
            }
        }

        db.JournalEntries.Add(new JournalEntry
        {
            Date = DateTime.Now,
            Type = EntryType.Expense,
            Category = "إلغاء فاتورة",
            Description = $"إلغاء فاتورة {invoice.InvoiceNumber} - {reason}",
            Amount = invoice.Total,
            Reference = invoice.InvoiceNumber,
        });

        await db.SaveChangesAsync();
    }

    public async Task SetPaymentStatusAsync(int id, InvoicePaymentStatus status)
    {
        if (!_auth.HasRole(UserRole.Admin, UserRole.Accountant))
            throw new AuthorizationException();

        await using var db = _factory.CreateDbContext();
        var invoice = await db.SaleInvoices.FindAsync(id);
        if (invoice == null || invoice.IsCancelled) return;
        var was = invoice.PaymentStatus;
        invoice.PaymentStatus = status;

        if (was != InvoicePaymentStatus.Paid && status == InvoicePaymentStatus.Paid)
        {
            db.JournalEntries.Add(new JournalEntry
            {
                Date = DateTime.Now,
                Type = EntryType.Income,
                Category = "مبيعات",
                Description = $"تحصيل فاتورة {invoice.InvoiceNumber}",
                Amount = invoice.Total,
                Reference = invoice.InvoiceNumber,
            });
        }
        await db.SaveChangesAsync();
    }
}
