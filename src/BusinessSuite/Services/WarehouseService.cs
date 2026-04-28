using BusinessSuite.Data;
using BusinessSuite.Data.Models;
using Microsoft.EntityFrameworkCore;

namespace BusinessSuite.Services;

public class WarehouseService
{
    private readonly IDbContextFactory<AppDbContext> _dbFactory;
    private readonly AuthService _auth;

    public WarehouseService(IDbContextFactory<AppDbContext> dbFactory, AuthService auth)
    {
        _dbFactory = dbFactory;
        _auth = auth;
    }

    public async Task<List<Warehouse>> GetAsync(string? search = null, int? branchId = null, bool? activeOnly = null)
    {
        using var db = _dbFactory.CreateDbContext();
        var q = db.Warehouses.Include(w => w.Branch).AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim();
            q = q.Where(w => w.Name.Contains(s) || w.ForeignName.Contains(s) || w.Code.Contains(s) || w.City.Contains(s) || w.Manager.Contains(s));
        }
        if (branchId.HasValue) q = q.Where(w => w.BranchId == branchId.Value);
        if (activeOnly == true) q = q.Where(w => w.IsActive);
        return await q.OrderByDescending(w => w.IsMain).ThenBy(w => w.Code).ToListAsync();
    }

    public async Task<Warehouse?> GetByIdAsync(int id)
    {
        using var db = _dbFactory.CreateDbContext();
        return await db.Warehouses.Include(w => w.Branch).FirstOrDefaultAsync(w => w.Id == id);
    }

    public async Task<Warehouse> SaveAsync(Warehouse model)
    {
        if (!_auth.HasRole(UserRole.Admin, UserRole.Accountant))
            throw new AuthorizationException("إدارة المخازن متاحة للمدير والمحاسب فقط");

        if (string.IsNullOrWhiteSpace(model.Name))
            throw new InvalidOperationException("اسم المخزن مطلوب");

        using var db = _dbFactory.CreateDbContext();

        if (!string.IsNullOrWhiteSpace(model.Code))
        {
            var dup = await db.Warehouses.AnyAsync(w => w.Id != model.Id && w.Code == model.Code);
            if (dup) throw new InvalidOperationException($"رقم المخزن \"{model.Code}\" مستخدم بالفعل");
        }

        if (model.BranchId.HasValue && model.BranchId.Value > 0)
        {
            var branchExists = await db.Branches.AnyAsync(b => b.Id == model.BranchId.Value);
            if (!branchExists) throw new InvalidOperationException("الفرع المحدد غير موجود");
        }
        else { model.BranchId = null; }

        if (model.Id == 0)
        {
            model.CreatedAt = DateTime.Now;
            model.UpdatedAt = DateTime.Now;
            if (!await db.Warehouses.AnyAsync()) model.IsMain = true;
            db.Warehouses.Add(model);
        }
        else
        {
            var existing = await db.Warehouses.FirstOrDefaultAsync(w => w.Id == model.Id)
                ?? throw new InvalidOperationException("المخزن غير موجود");
            existing.Code = model.Code;
            existing.Name = model.Name;
            existing.ForeignName = model.ForeignName;
            existing.BranchId = model.BranchId;
            existing.IsActive = model.IsActive;
            existing.AllowNegativeStock = model.AllowNegativeStock;
            existing.Manager = model.Manager;
            existing.Phone = model.Phone;
            existing.Address = model.Address;
            existing.City = model.City;
            existing.Region = model.Region;
            existing.Country = model.Country;
            existing.WarehouseType = model.WarehouseType;
            existing.Notes = model.Notes;
            existing.UpdatedAt = DateTime.Now;
        }

        await db.SaveChangesAsync();
        return model;
    }

    public async Task SetMainAsync(int id)
    {
        if (!_auth.HasRole(UserRole.Admin))
            throw new AuthorizationException("تعيين المخزن الرئيسي متاح للمدير فقط");

        using var db = _dbFactory.CreateDbContext();
        var target = await db.Warehouses.FirstOrDefaultAsync(w => w.Id == id)
            ?? throw new InvalidOperationException("المخزن غير موجود");
        foreach (var w in await db.Warehouses.ToListAsync()) w.IsMain = false;
        target.IsMain = true;
        target.IsActive = true;
        target.UpdatedAt = DateTime.Now;
        await db.SaveChangesAsync();
    }

    public async Task DeleteAsync(int id)
    {
        if (!_auth.HasRole(UserRole.Admin))
            throw new AuthorizationException("حذف المخزن متاح للمدير فقط");

        using var db = _dbFactory.CreateDbContext();
        var w = await db.Warehouses.FirstOrDefaultAsync(x => x.Id == id);
        if (w == null) return;
        if (w.IsMain) throw new InvalidOperationException("لا يمكن حذف المخزن الرئيسي");
        db.Warehouses.Remove(w);
        await db.SaveChangesAsync();
    }

    public async Task EnsureMainWarehouseAsync()
    {
        using var db = _dbFactory.CreateDbContext();
        if (await db.Warehouses.AnyAsync()) return;
        var mainBranch = await db.Branches.FirstOrDefaultAsync(b => b.IsMain);
        db.Warehouses.Add(new Warehouse
        {
            Code = "01",
            Name = "المخزن الرئيسي",
            ForeignName = "Main Warehouse",
            BranchId = mainBranch?.Id,
            IsMain = true,
            IsActive = true,
            WarehouseType = "رئيسي",
            Country = "المملكة العربية السعودية",
        });
        await db.SaveChangesAsync();
    }
}
