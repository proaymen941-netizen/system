using BusinessSuite.Data;
using BusinessSuite.Data.Models;
using Microsoft.EntityFrameworkCore;

namespace BusinessSuite.Services;

public class CurrencyService
{
    private readonly IDbContextFactory<AppDbContext> _dbFactory;
    private readonly AuthService _auth;

    public CurrencyService(IDbContextFactory<AppDbContext> dbFactory, AuthService auth)
    {
        _dbFactory = dbFactory;
        _auth = auth;
    }

    public async Task<List<Currency>> GetAsync(bool? activeOnly = null)
    {
        using var db = _dbFactory.CreateDbContext();
        var query = db.Currencies.AsQueryable();
        if (activeOnly == true) query = query.Where(c => c.IsActive);
        return await query.OrderByDescending(c => c.IsBase).ThenBy(c => c.Kind).ThenBy(c => c.Name).ToListAsync();
    }

    public async Task<Currency?> GetBaseAsync()
    {
        using var db = _dbFactory.CreateDbContext();
        return await db.Currencies.FirstOrDefaultAsync(c => c.IsBase) ??
               await db.Currencies.OrderBy(c => c.Id).FirstOrDefaultAsync();
    }

    public async Task<Currency> SaveAsync(Currency model)
    {
        if (!_auth.HasRole(UserRole.Admin) && !_auth.HasRole(UserRole.Accountant))
            throw new AuthorizationException("غير مصرح بإدارة العملات");

        if (string.IsNullOrWhiteSpace(model.Name))
            throw new InvalidOperationException("اسم العملة مطلوب");

        using var db = _dbFactory.CreateDbContext();

        // ensure unique code (when provided)
        if (!string.IsNullOrWhiteSpace(model.Code))
        {
            var dup = await db.Currencies.AnyAsync(c => c.Id != model.Id && c.Code == model.Code);
            if (dup) throw new InvalidOperationException($"رمز العملة \"{model.Code}\" مستخدم بالفعل");
        }

        if (model.Id == 0)
        {
            model.CreatedAt = DateTime.Now;
            model.UpdatedAt = DateTime.Now;
            // first currency becomes base local automatically
            if (!await db.Currencies.AnyAsync())
            {
                model.IsBase = true;
                model.Kind = CurrencyKind.Local;
                model.ExchangeRate = 1m;
            }
            db.Currencies.Add(model);
        }
        else
        {
            var existing = await db.Currencies.FirstOrDefaultAsync(c => c.Id == model.Id)
                ?? throw new InvalidOperationException("العملة غير موجودة");
            existing.Code = model.Code;
            existing.Name = model.Name;
            existing.Country = model.Country;
            existing.Symbol = model.Symbol;
            existing.Kind = model.Kind;
            existing.ExchangeRate = model.ExchangeRate <= 0 ? 1m : model.ExchangeRate;
            existing.IsActive = model.IsActive;
            existing.Notes = model.Notes;
            existing.UpdatedAt = DateTime.Now;
            // base currency must remain local with rate 1
            if (existing.IsBase)
            {
                existing.Kind = CurrencyKind.Local;
                existing.ExchangeRate = 1m;
                existing.IsActive = true;
            }
        }

        await db.SaveChangesAsync();
        return model;
    }

    public async Task SetBaseAsync(int id)
    {
        if (!_auth.HasRole(UserRole.Admin))
            throw new AuthorizationException("تعيين العملة الأساسية متاح للمدير فقط");

        using var db = _dbFactory.CreateDbContext();
        var target = await db.Currencies.FirstOrDefaultAsync(c => c.Id == id)
            ?? throw new InvalidOperationException("العملة غير موجودة");

        var all = await db.Currencies.ToListAsync();
        foreach (var c in all) c.IsBase = false;
        target.IsBase = true;
        target.IsActive = true;
        target.Kind = CurrencyKind.Local;
        target.ExchangeRate = 1m;
        target.UpdatedAt = DateTime.Now;
        await db.SaveChangesAsync();
    }

    public async Task DeleteAsync(int id)
    {
        if (!_auth.HasRole(UserRole.Admin))
            throw new AuthorizationException("حذف العملة متاح للمدير فقط");

        using var db = _dbFactory.CreateDbContext();
        var c = await db.Currencies.FirstOrDefaultAsync(x => x.Id == id);
        if (c == null) return;
        if (c.IsBase) throw new InvalidOperationException("لا يمكن حذف العملة الأساسية");
        db.Currencies.Remove(c);
        await db.SaveChangesAsync();
    }

    public async Task EnsureSeedAsync(string baseCurrencyName = "ريال سعودي", string baseCurrencyCode = "SAR", string baseSymbol = "ر.س", string baseCountry = "المملكة العربية السعودية")
    {
        using var db = _dbFactory.CreateDbContext();
        if (await db.Currencies.AnyAsync()) return;
        db.Currencies.Add(new Currency
        {
            Code = baseCurrencyCode,
            Name = baseCurrencyName,
            Country = baseCountry,
            Symbol = baseSymbol,
            Kind = CurrencyKind.Local,
            ExchangeRate = 1m,
            IsActive = true,
            IsBase = true,
        });
        await db.SaveChangesAsync();
    }
}
