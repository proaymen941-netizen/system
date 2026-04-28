using BusinessSuite.Data;
using BusinessSuite.Data.Models;
using Microsoft.EntityFrameworkCore;

namespace BusinessSuite.Services;

public class BranchService
{
    private readonly IDbContextFactory<AppDbContext> _dbFactory;
    private readonly AuthService _auth;

    public BranchService(IDbContextFactory<AppDbContext> dbFactory, AuthService auth)
    {
        _dbFactory = dbFactory;
        _auth = auth;
    }

    public async Task<List<Branch>> GetAsync(string? search = null, bool? activeOnly = null)
    {
        using var db = _dbFactory.CreateDbContext();
        var q = db.Branches.AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim();
            q = q.Where(b => b.ArabicName.Contains(s) || b.ForeignName.Contains(s) || b.Code.Contains(s) || b.City.Contains(s));
        }
        if (activeOnly == true) q = q.Where(b => b.IsActive);
        return await q.OrderByDescending(b => b.IsMain).ThenBy(b => b.Code).ToListAsync();
    }

    public async Task<Branch?> GetByIdAsync(int id)
    {
        using var db = _dbFactory.CreateDbContext();
        return await db.Branches.FirstOrDefaultAsync(b => b.Id == id);
    }

    public async Task<Branch?> GetMainAsync()
    {
        using var db = _dbFactory.CreateDbContext();
        return await db.Branches.FirstOrDefaultAsync(b => b.IsMain) ??
               await db.Branches.OrderBy(b => b.Id).FirstOrDefaultAsync();
    }

    public async Task<Branch> SaveAsync(Branch model)
    {
        if (!_auth.HasRole(UserRole.Admin))
            throw new AuthorizationException("إدارة الفروع متاحة للمدير فقط");

        if (string.IsNullOrWhiteSpace(model.ArabicName))
            throw new InvalidOperationException("اسم الفرع بالعربي مطلوب");

        using var db = _dbFactory.CreateDbContext();

        if (!string.IsNullOrWhiteSpace(model.Code))
        {
            var dup = await db.Branches.AnyAsync(b => b.Id != model.Id && b.Code == model.Code);
            if (dup) throw new InvalidOperationException($"رقم الفرع \"{model.Code}\" مستخدم بالفعل");
        }

        if (model.Id == 0)
        {
            model.CreatedAt = DateTime.Now;
            model.UpdatedAt = DateTime.Now;
            if (!await db.Branches.AnyAsync()) model.IsMain = true;
            db.Branches.Add(model);
        }
        else
        {
            var existing = await db.Branches.FirstOrDefaultAsync(b => b.Id == model.Id)
                ?? throw new InvalidOperationException("الفرع غير موجود");
            existing.Code = model.Code;
            existing.ArabicName = model.ArabicName;
            existing.ForeignName = model.ForeignName;
            existing.FinancialYear = model.FinancialYear;
            existing.IsActive = model.IsActive;
            existing.ArabicAddress = model.ArabicAddress;
            existing.ForeignAddress = model.ForeignAddress;
            existing.Phone = model.Phone;
            existing.Fax = model.Fax;
            existing.PoBox = model.PoBox;
            existing.Email = model.Email;
            existing.Website = model.Website;
            existing.City = model.City;
            existing.Region = model.Region;
            existing.Country = model.Country;
            existing.Manager = model.Manager;
            existing.TaxNumber = model.TaxNumber;
            existing.CommercialRegister = model.CommercialRegister;
            existing.Notes = model.Notes;
            existing.UpdatedAt = DateTime.Now;
        }

        await db.SaveChangesAsync();
        return model;
    }

    public async Task SetMainAsync(int id)
    {
        if (!_auth.HasRole(UserRole.Admin))
            throw new AuthorizationException("تعيين الفرع الرئيسي متاح للمدير فقط");

        using var db = _dbFactory.CreateDbContext();
        var target = await db.Branches.FirstOrDefaultAsync(b => b.Id == id)
            ?? throw new InvalidOperationException("الفرع غير موجود");
        foreach (var b in await db.Branches.ToListAsync()) b.IsMain = false;
        target.IsMain = true;
        target.IsActive = true;
        target.UpdatedAt = DateTime.Now;
        await db.SaveChangesAsync();
    }

    public async Task DeleteAsync(int id)
    {
        if (!_auth.HasRole(UserRole.Admin))
            throw new AuthorizationException("حذف الفرع متاح للمدير فقط");

        using var db = _dbFactory.CreateDbContext();
        var b = await db.Branches.FirstOrDefaultAsync(x => x.Id == id);
        if (b == null) return;
        if (b.IsMain) throw new InvalidOperationException("لا يمكن حذف الفرع الرئيسي");
        db.Branches.Remove(b);
        await db.SaveChangesAsync();
    }

    public async Task EnsureMainBranchAsync(string companyName)
    {
        using var db = _dbFactory.CreateDbContext();
        if (await db.Branches.AnyAsync()) return;
        db.Branches.Add(new Branch
        {
            Code = "01",
            ArabicName = companyName,
            ForeignName = "Main Branch",
            FinancialYear = DateTime.Now.Year.ToString(),
            IsMain = true,
            IsActive = true,
            Country = "المملكة العربية السعودية",
        });
        await db.SaveChangesAsync();
    }
}
