using BusinessSuite.Data;
using BusinessSuite.Data.Models;
using Microsoft.EntityFrameworkCore;

namespace BusinessSuite.Services;

public class PurchasingService
{
    private readonly IDbContextFactory<AppDbContext> _factory;
    private readonly AuthService _auth;
    private readonly StockMovementService _stock;

    public PurchasingService(IDbContextFactory<AppDbContext> factory, AuthService auth, StockMovementService stock)
    {
        _factory = factory;
        _auth = auth;
        _stock = stock;
    }

    public async Task<List<Supplier>> GetSuppliersAsync()
    {
        await using var db = _factory.CreateDbContext();
        return await db.Suppliers.OrderBy(s => s.Name).ToListAsync();
    }

    public async Task SaveSupplierAsync(Supplier s)
    {
        if (!_auth.HasRole(UserRole.Admin, UserRole.Accountant)) throw new AuthorizationException();
        await using var db = _factory.CreateDbContext();
        if (s.Id == 0) db.Suppliers.Add(s); else db.Suppliers.Update(s);
        await db.SaveChangesAsync();
    }

    public async Task DeleteSupplierAsync(int id)
    {
        if (!_auth.HasRole(UserRole.Admin)) throw new AuthorizationException();
        await using var db = _factory.CreateDbContext();
        var s = await db.Suppliers.FindAsync(id);
        if (s != null) { db.Suppliers.Remove(s); await db.SaveChangesAsync(); }
    }

    public async Task<List<PurchaseInvoice>> GetPurchasesAsync(DateTime? from = null, DateTime? to = null)
    {
        await using var db = _factory.CreateDbContext();
        var q = db.PurchaseInvoices.Include(p => p.Supplier).Include(p => p.Items).AsQueryable();
        if (from.HasValue) q = q.Where(p => p.Date >= from.Value);
        if (to.HasValue) q = q.Where(p => p.Date <= to.Value.AddDays(1));
        return await q.OrderByDescending(p => p.Date).ToListAsync();
    }

    public async Task<PurchaseInvoice?> GetPurchaseAsync(int id)
    {
        await using var db = _factory.CreateDbContext();
        return await db.PurchaseInvoices.Include(p => p.Supplier).Include(p => p.Items).FirstOrDefaultAsync(p => p.Id == id);
    }

    public async Task<int> CreatePurchaseAsync(PurchaseInvoice invoice)
    {
        if (!_auth.HasRole(UserRole.Admin, UserRole.Accountant)) throw new AuthorizationException();
        await using var db = _factory.CreateDbContext();
        var c = await db.PurchaseInvoices.CountAsync();
        invoice.InvoiceNumber = $"PUR-{DateTime.Now.Year}-{100 + c + 1}";
        invoice.Date = DateTime.Now;
        invoice.Total = invoice.Items.Sum(i => i.LineTotal);
        if (invoice.Status == "مدفوع") invoice.PaymentStatus = InvoicePaymentStatus.Paid;
        else invoice.PaymentStatus = InvoicePaymentStatus.Unpaid;
        db.PurchaseInvoices.Add(invoice);

        foreach (var item in invoice.Items)
        {
            var product = await db.Products.FindAsync(item.ProductId);
            if (product != null)
            {
                product.Quantity += item.Quantity;
                await _stock.LogAsync(db, product.Id, MovementType.Purchase, item.Quantity, invoice.InvoiceNumber, $"شراء من {invoice.Supplier?.Name ?? "مورد"}");
            }
        }

        if (invoice.PaymentStatus == InvoicePaymentStatus.Paid)
        {
            db.JournalEntries.Add(new JournalEntry
            {
                Date = invoice.Date,
                Type = EntryType.Expense,
                Category = "مشتريات",
                Description = $"فاتورة شراء {invoice.InvoiceNumber}",
                Amount = invoice.Total,
                Reference = invoice.InvoiceNumber,
            });
        }

        await db.SaveChangesAsync();
        return invoice.Id;
    }

    public async Task SetPaymentStatusAsync(int id, InvoicePaymentStatus status)
    {
        if (!_auth.HasRole(UserRole.Admin, UserRole.Accountant)) throw new AuthorizationException();
        await using var db = _factory.CreateDbContext();
        var invoice = await db.PurchaseInvoices.FindAsync(id);
        if (invoice == null) return;
        var was = invoice.PaymentStatus;
        invoice.PaymentStatus = status;
        invoice.Status = status == InvoicePaymentStatus.Paid ? "مدفوع" : "معلق";

        if (was != InvoicePaymentStatus.Paid && status == InvoicePaymentStatus.Paid)
        {
            db.JournalEntries.Add(new JournalEntry
            {
                Date = DateTime.Now,
                Type = EntryType.Expense,
                Category = "مشتريات",
                Description = $"سداد فاتورة شراء {invoice.InvoiceNumber}",
                Amount = invoice.Total,
                Reference = invoice.InvoiceNumber,
            });
        }
        await db.SaveChangesAsync();
    }
}
