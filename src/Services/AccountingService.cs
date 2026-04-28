using BusinessSuite.Data;
using BusinessSuite.Data.Models;
using Microsoft.EntityFrameworkCore;

namespace BusinessSuite.Services;

public class AccountingService
{
    private readonly IDbContextFactory<AppDbContext> _factory;
    private readonly AuthService _auth;

    public AccountingService(IDbContextFactory<AppDbContext> factory, AuthService auth)
    {
        _factory = factory;
        _auth = auth;
    }

    public async Task<List<JournalEntry>> GetEntriesAsync(DateTime? from = null, DateTime? to = null)
    {
        await using var db = _factory.CreateDbContext();
        var q = db.JournalEntries.AsQueryable();
        if (from.HasValue) q = q.Where(j => j.Date >= from.Value);
        if (to.HasValue) q = q.Where(j => j.Date <= to.Value.AddDays(1));
        return await q.OrderByDescending(j => j.Date).ToListAsync();
    }

    public async Task<JournalEntry?> GetEntryAsync(int id)
    {
        await using var db = _factory.CreateDbContext();
        return await db.JournalEntries.FindAsync(id);
    }

    public async Task SaveEntryAsync(JournalEntry e)
    {
        if (!_auth.HasRole(UserRole.Admin, UserRole.Accountant)) throw new AuthorizationException();
        await using var db = _factory.CreateDbContext();
        if (e.Id == 0) db.JournalEntries.Add(e); else db.JournalEntries.Update(e);
        await db.SaveChangesAsync();
    }

    public async Task DeleteEntryAsync(int id)
    {
        if (!_auth.HasRole(UserRole.Admin, UserRole.Accountant)) throw new AuthorizationException();
        await using var db = _factory.CreateDbContext();
        var e = await db.JournalEntries.FindAsync(id);
        if (e != null) { db.JournalEntries.Remove(e); await db.SaveChangesAsync(); }
    }

    public async Task<FinancialSummary> GetSummaryAsync(DateTime? from = null, DateTime? to = null)
    {
        await using var db = _factory.CreateDbContext();
        var q = db.JournalEntries.AsQueryable();
        if (from.HasValue) q = q.Where(j => j.Date >= from.Value);
        if (to.HasValue) q = q.Where(j => j.Date <= to.Value.AddDays(1));
        var entries = await q.ToListAsync();
        var income = entries.Where(e => e.Type == EntryType.Income).Sum(e => e.Amount);
        var expense = entries.Where(e => e.Type == EntryType.Expense).Sum(e => e.Amount);
        var assets = await db.Products.SumAsync(p => (double)p.Cost * p.Quantity);
        return new FinancialSummary(income, expense, income - expense, (decimal)assets);
    }

    public async Task<List<TrialBalanceRow>> GetTrialBalanceAsync(DateTime? from = null, DateTime? to = null)
    {
        await using var db = _factory.CreateDbContext();
        var q = db.JournalEntries.AsQueryable();
        if (from.HasValue) q = q.Where(j => j.Date >= from.Value);
        if (to.HasValue) q = q.Where(j => j.Date <= to.Value.AddDays(1));
        var entries = await q.ToListAsync();
        return entries
            .GroupBy(e => new { e.Category, e.Type })
            .Select(g => new TrialBalanceRow(g.Key.Category, g.Key.Type, g.Sum(x => x.Amount), g.Count()))
            .OrderBy(r => r.Type).ThenByDescending(r => r.Total)
            .ToList();
    }
}

public record FinancialSummary(decimal Income, decimal Expense, decimal NetProfit, decimal Inventory);
public record TrialBalanceRow(string Category, EntryType Type, decimal Total, int Count);
