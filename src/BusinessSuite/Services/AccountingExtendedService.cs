using BusinessSuite.Data;
using BusinessSuite.Data.Models;
using Microsoft.EntityFrameworkCore;

namespace BusinessSuite.Services;

public record StatementRow(DateTime Date, string Reference, string Description, decimal Debit, decimal Credit, decimal Balance);

public class AccountingExtendedService
{
    private readonly IDbContextFactory<AppDbContext> _factory;
    private readonly AuthService _auth;

    public AccountingExtendedService(IDbContextFactory<AppDbContext> factory, AuthService auth)
    {
        _factory = factory;
        _auth = auth;
    }

    // ---------- Chart of Accounts ----------
    public async Task<List<ChartOfAccount>> GetAccountsAsync()
    {
        await using var db = _factory.CreateDbContext();
        var list = await db.ChartOfAccounts.OrderBy(a => a.Code).ToListAsync();
        if (list.Count == 0)
        {
            list = SeedChart();
            db.ChartOfAccounts.AddRange(list);
            await db.SaveChangesAsync();
        }
        return list;
    }

    public async Task SaveAccountAsync(ChartOfAccount account)
    {
        await using var db = _factory.CreateDbContext();
        if (account.Id == 0) db.ChartOfAccounts.Add(account);
        else db.ChartOfAccounts.Update(account);
        await db.SaveChangesAsync();
    }

    public async Task DeleteAccountAsync(int id)
    {
        await using var db = _factory.CreateDbContext();
        var a = await db.ChartOfAccounts.FindAsync(id);
        if (a != null) { db.ChartOfAccounts.Remove(a); await db.SaveChangesAsync(); }
    }

    private static List<ChartOfAccount> SeedChart() => new()
    {
        new() { Code = "1000", Name = "الأصول", Kind = AccountKind.Asset },
        new() { Code = "1100", Name = "الصندوق", Kind = AccountKind.Asset },
        new() { Code = "1200", Name = "البنوك", Kind = AccountKind.Asset },
        new() { Code = "1300", Name = "العملاء (الذمم المدينة)", Kind = AccountKind.Asset },
        new() { Code = "1400", Name = "المخزون", Kind = AccountKind.Asset },
        new() { Code = "1500", Name = "العهد", Kind = AccountKind.Asset },
        new() { Code = "2000", Name = "الالتزامات", Kind = AccountKind.Liability },
        new() { Code = "2100", Name = "الموردون (الذمم الدائنة)", Kind = AccountKind.Liability },
        new() { Code = "2200", Name = "ضريبة القيمة المضافة", Kind = AccountKind.Liability },
        new() { Code = "3000", Name = "حقوق الملكية", Kind = AccountKind.Equity },
        new() { Code = "4000", Name = "الإيرادات", Kind = AccountKind.Revenue },
        new() { Code = "4100", Name = "إيرادات المبيعات", Kind = AccountKind.Revenue },
        new() { Code = "4200", Name = "إيرادات الصيانة", Kind = AccountKind.Revenue },
        new() { Code = "5000", Name = "المصروفات", Kind = AccountKind.Expense },
        new() { Code = "5100", Name = "تكلفة المبيعات", Kind = AccountKind.Expense },
        new() { Code = "5200", Name = "الرواتب", Kind = AccountKind.Expense },
        new() { Code = "5300", Name = "الإيجار", Kind = AccountKind.Expense },
        new() { Code = "5400", Name = "الكهرباء والمياه", Kind = AccountKind.Expense },
        new() { Code = "5500", Name = "مصروفات أخرى", Kind = AccountKind.Expense },
    };

    // ---------- Vouchers (Receipt / Payment) ----------
    public async Task<List<FinancialVoucher>> GetVouchersAsync(VoucherType? type = null, DateTime? from = null, DateTime? to = null)
    {
        await using var db = _factory.CreateDbContext();
        var q = db.Vouchers.AsQueryable();
        if (type.HasValue) q = q.Where(v => v.Type == type.Value);
        if (from.HasValue) q = q.Where(v => v.Date >= from.Value);
        if (to.HasValue) q = q.Where(v => v.Date <= to.Value.AddDays(1));
        return await q.OrderByDescending(v => v.Date).ToListAsync();
    }

    public async Task<FinancialVoucher> CreateVoucherAsync(FinancialVoucher v)
    {
        await using var db = _factory.CreateDbContext();
        if (string.IsNullOrWhiteSpace(v.VoucherNumber))
        {
            var prefix = v.Type switch
            {
                VoucherType.Receipt => "REC",
                VoucherType.Payment => "PAY",
                VoucherType.Custody => "CUS",
                VoucherType.StockIssue => "STK",
                _ => "JV"
            };
            var count = await db.Vouchers.CountAsync(x => x.Type == v.Type) + 1;
            v.VoucherNumber = $"{prefix}-{DateTime.Now:yyyyMM}-{count:D4}";
        }
        v.CreatedBy = _auth.CurrentUser?.FullName ?? "النظام";
        v.CreatedAt = DateTime.Now;
        db.Vouchers.Add(v);
        await db.SaveChangesAsync();
        return v;
    }

    public async Task PostVoucherAsync(int id)
    {
        await using var db = _factory.CreateDbContext();
        var v = await db.Vouchers.FindAsync(id);
        if (v == null || v.Status == VoucherStatus.Posted) return;
        v.Status = VoucherStatus.Posted;
        v.PostedAt = DateTime.Now;
        v.PostedBy = _auth.CurrentUser?.FullName ?? "النظام";

        // Generate corresponding journal entry
        db.JournalEntries.Add(new JournalEntry
        {
            Date = v.Date,
            Type = v.Type == VoucherType.Receipt ? EntryType.Income : EntryType.Expense,
            Category = v.Type == VoucherType.Receipt ? "سند قبض" : "سند صرف",
            Description = $"{v.VoucherNumber}: {v.Description} ({v.PartyName})",
            Amount = v.Amount,
            Reference = v.VoucherNumber,
        });
        await db.SaveChangesAsync();
    }

    public async Task CancelVoucherAsync(int id)
    {
        await using var db = _factory.CreateDbContext();
        var v = await db.Vouchers.FindAsync(id);
        if (v == null) return;
        v.Status = VoucherStatus.Cancelled;
        await db.SaveChangesAsync();
    }

    // ---------- Manual Journal Entries ----------
    public async Task<List<ManualJournalEntry>> GetManualJournalsAsync(DateTime? from = null, DateTime? to = null)
    {
        await using var db = _factory.CreateDbContext();
        var q = db.ManualJournals.Include(m => m.Lines).ThenInclude(l => l.Account).AsQueryable();
        if (from.HasValue) q = q.Where(m => m.Date >= from.Value);
        if (to.HasValue) q = q.Where(m => m.Date <= to.Value.AddDays(1));
        return await q.OrderByDescending(m => m.Date).ToListAsync();
    }

    public async Task<ManualJournalEntry> SaveManualJournalAsync(ManualJournalEntry entry)
    {
        await using var db = _factory.CreateDbContext();
        if (entry.Id == 0)
        {
            if (string.IsNullOrWhiteSpace(entry.EntryNumber))
            {
                var count = await db.ManualJournals.CountAsync() + 1;
                entry.EntryNumber = $"JE-{DateTime.Now:yyyyMM}-{count:D4}";
            }
            entry.CreatedBy = _auth.CurrentUser?.FullName ?? "النظام";
            entry.CreatedAt = DateTime.Now;
            db.ManualJournals.Add(entry);
        }
        else
        {
            var existing = await db.ManualJournals.Include(m => m.Lines).FirstAsync(m => m.Id == entry.Id);
            existing.Date = entry.Date;
            existing.Description = entry.Description;
            db.ManualJournalLines.RemoveRange(existing.Lines);
            existing.Lines = entry.Lines.Select(l => new ManualJournalLine
            {
                AccountId = l.AccountId,
                Description = l.Description,
                Debit = l.Debit,
                Credit = l.Credit,
            }).ToList();
        }
        await db.SaveChangesAsync();
        return entry;
    }

    public async Task PostManualJournalAsync(int id)
    {
        await using var db = _factory.CreateDbContext();
        var m = await db.ManualJournals.Include(x => x.Lines).ThenInclude(l => l.Account).FirstOrDefaultAsync(x => x.Id == id);
        if (m == null || m.IsPosted) return;
        if (m.TotalDebit != m.TotalCredit) throw new InvalidOperationException("القيد غير متوازن: مجموع المدين لا يساوي الدائن.");

        m.IsPosted = true;
        // Create simple JournalEntry for trial balance (one entry per side using categories)
        foreach (var line in m.Lines.Where(l => l.Debit > 0 || l.Credit > 0))
        {
            var amount = line.Debit > 0 ? line.Debit : line.Credit;
            db.JournalEntries.Add(new JournalEntry
            {
                Date = m.Date,
                Type = line.Credit > 0 ? EntryType.Income : EntryType.Expense,
                Category = line.Account?.Name ?? "حساب يدوي",
                Description = $"{m.EntryNumber}: {line.Description}",
                Amount = amount,
                Reference = m.EntryNumber,
            });
        }
        await db.SaveChangesAsync();
    }

    public async Task DeleteManualJournalAsync(int id)
    {
        await using var db = _factory.CreateDbContext();
        var m = await db.ManualJournals.Include(x => x.Lines).FirstOrDefaultAsync(x => x.Id == id);
        if (m == null) return;
        db.ManualJournalLines.RemoveRange(m.Lines);
        db.ManualJournals.Remove(m);
        await db.SaveChangesAsync();
    }

    // ---------- Custodies ----------
    public async Task<List<EmployeeCustody>> GetCustodiesAsync(int? employeeId = null)
    {
        await using var db = _factory.CreateDbContext();
        var q = db.Custodies.Include(c => c.Employee).AsQueryable();
        if (employeeId.HasValue) q = q.Where(c => c.EmployeeId == employeeId.Value);
        return await q.OrderByDescending(c => c.Date).ToListAsync();
    }

    public async Task<EmployeeCustody> SaveCustodyAsync(EmployeeCustody c)
    {
        await using var db = _factory.CreateDbContext();
        if (c.Id == 0)
        {
            c.CreatedBy = _auth.CurrentUser?.FullName ?? "النظام";
            db.Custodies.Add(c);
        }
        else
        {
            db.Custodies.Update(c);
        }
        await db.SaveChangesAsync();
        return c;
    }

    public async Task SettleCustodyAsync(int id)
    {
        await using var db = _factory.CreateDbContext();
        var c = await db.Custodies.FindAsync(id);
        if (c == null) return;
        c.IsSettled = true;
        c.SettledAt = DateTime.Now;
        await db.SaveChangesAsync();
    }

    public async Task DeleteCustodyAsync(int id)
    {
        await using var db = _factory.CreateDbContext();
        var c = await db.Custodies.FindAsync(id);
        if (c != null) { db.Custodies.Remove(c); await db.SaveChangesAsync(); }
    }

    // ---------- Account Statements ----------
    public async Task<List<StatementRow>> GetCustomerStatementAsync(int customerId, DateTime? from = null, DateTime? to = null)
    {
        await using var db = _factory.CreateDbContext();
        var rows = new List<StatementRow>();

        var sales = await db.SaleInvoices.Where(s => s.CustomerId == customerId && !s.IsCancelled).ToListAsync();
        var receipts = await db.Vouchers.Where(v => v.Type == VoucherType.Receipt && v.PartyType == "عميل" && v.PartyId == customerId && v.Status == VoucherStatus.Posted).ToListAsync();

        foreach (var s in sales)
            rows.Add(new StatementRow(s.Date, s.InvoiceNumber, $"فاتورة مبيعات", s.Total, 0, 0));
        foreach (var r in receipts)
            rows.Add(new StatementRow(r.Date, r.VoucherNumber, $"سند قبض - {r.Description}", 0, r.Amount, 0));

        if (from.HasValue) rows = rows.Where(r => r.Date >= from.Value).ToList();
        if (to.HasValue) rows = rows.Where(r => r.Date <= to.Value.AddDays(1)).ToList();
        rows = rows.OrderBy(r => r.Date).ToList();

        decimal balance = 0;
        return rows.Select(r => { balance += r.Debit - r.Credit; return r with { Balance = balance }; }).ToList();
    }

    public async Task<List<StatementRow>> GetSupplierStatementAsync(int supplierId, DateTime? from = null, DateTime? to = null)
    {
        await using var db = _factory.CreateDbContext();
        var rows = new List<StatementRow>();

        var purchases = await db.PurchaseInvoices.Where(p => p.SupplierId == supplierId && !p.IsCancelled).ToListAsync();
        var payments = await db.Vouchers.Where(v => v.Type == VoucherType.Payment && v.PartyType == "مورد" && v.PartyId == supplierId && v.Status == VoucherStatus.Posted).ToListAsync();

        foreach (var p in purchases)
            rows.Add(new StatementRow(p.Date, p.InvoiceNumber, $"فاتورة مشتريات", 0, p.Total, 0));
        foreach (var pv in payments)
            rows.Add(new StatementRow(pv.Date, pv.VoucherNumber, $"سند صرف - {pv.Description}", pv.Amount, 0, 0));

        if (from.HasValue) rows = rows.Where(r => r.Date >= from.Value).ToList();
        if (to.HasValue) rows = rows.Where(r => r.Date <= to.Value.AddDays(1)).ToList();
        rows = rows.OrderBy(r => r.Date).ToList();

        decimal balance = 0;
        return rows.Select(r => { balance += r.Credit - r.Debit; return r with { Balance = balance }; }).ToList();
    }

    public async Task<List<StatementRow>> GetEmployeeStatementAsync(int employeeId, DateTime? from = null, DateTime? to = null)
    {
        await using var db = _factory.CreateDbContext();
        var rows = new List<StatementRow>();

        var emp = await db.Employees.FindAsync(employeeId);
        if (emp == null) return rows;

        var custodies = await db.Custodies.Where(c => c.EmployeeId == employeeId).ToListAsync();
        var penalties = await db.PenaltiesRewards.Where(p => p.EmployeeId == employeeId).ToListAsync();
        var installments = await db.Installments.Where(i => i.EmployeeId == employeeId).ToListAsync();

        foreach (var c in custodies)
        {
            if (c.IsDebit)
                rows.Add(new StatementRow(c.Date, c.Reference, $"عهدة - {c.Description}", c.Amount, 0, 0));
            else
                rows.Add(new StatementRow(c.Date, c.Reference, $"تسوية عهدة - {c.Description}", 0, c.Amount, 0));
        }

        foreach (var p in penalties)
        {
            if (p.Kind == PenaltyKind.Penalty)
                rows.Add(new StatementRow(p.Date, $"PEN-{p.Id}", $"خصم - {p.Reason}", 0, p.Amount, 0));
            else
                rows.Add(new StatementRow(p.Date, $"REW-{p.Id}", $"مكافأة - {p.Reason}", p.Amount, 0, 0));
        }

        foreach (var i in installments)
            rows.Add(new StatementRow(i.StartDate, $"INS-{i.Id}", $"قسط - {i.Description} ({i.PaidMonths}/{i.TotalMonths})", 0, i.MonthlyAmount * i.PaidMonths, 0));

        if (from.HasValue) rows = rows.Where(r => r.Date >= from.Value).ToList();
        if (to.HasValue) rows = rows.Where(r => r.Date <= to.Value.AddDays(1)).ToList();
        rows = rows.OrderBy(r => r.Date).ToList();

        decimal balance = 0;
        return rows.Select(r => { balance += r.Debit - r.Credit; return r with { Balance = balance }; }).ToList();
    }
}
