using BusinessSuite.Data;
using BusinessSuite.Data.Models;
using Microsoft.EntityFrameworkCore;

namespace BusinessSuite.Services;

public class PermissionService
{
    private readonly IDbContextFactory<AppDbContext> _factory;
    private readonly AuthService _auth;

    public PermissionService(IDbContextFactory<AppDbContext> factory, AuthService auth)
    {
        _factory = factory;
        _auth = auth;
    }

    public async Task<List<UserPermission>> GetForUserAsync(int userId)
    {
        await using var db = _factory.CreateDbContext();
        return await db.UserPermissions.Where(p => p.UserId == userId).ToListAsync();
    }

    public async Task SetForUserAsync(int userId, Dictionary<string, bool> values)
    {
        await using var db = _factory.CreateDbContext();
        var existing = await db.UserPermissions.Where(p => p.UserId == userId).ToListAsync();
        foreach (var kv in values)
        {
            var row = existing.FirstOrDefault(p => p.PermissionKey == kv.Key);
            if (row == null)
            {
                db.UserPermissions.Add(new UserPermission { UserId = userId, PermissionKey = kv.Key, IsGranted = kv.Value });
            }
            else
            {
                row.IsGranted = kv.Value;
            }
        }
        await db.SaveChangesAsync();
    }

    public async Task<bool> CheckAsync(int userId, string key)
    {
        await using var db = _factory.CreateDbContext();
        var user = await db.Users.FindAsync(userId);
        if (user == null) return false;
        if (user.Role == UserRole.Admin) return true;
        var p = await db.UserPermissions.FirstOrDefaultAsync(x => x.UserId == userId && x.PermissionKey == key);
        if (p != null) return p.IsGranted;
        return DefaultForRole(user.Role, key);
    }

    public bool Check(string key)
    {
        if (_auth.CurrentUser == null) return false;
        if (_auth.CurrentUser.Role == UserRole.Admin) return true;
        using var db = _factory.CreateDbContext();
        var p = db.UserPermissions.FirstOrDefault(x => x.UserId == _auth.CurrentUser.Id && x.PermissionKey == key);
        if (p != null) return p.IsGranted;
        return DefaultForRole(_auth.CurrentUser.Role, key);
    }

    public static bool DefaultForRole(UserRole role, string key)
    {
        if (role == UserRole.Admin) return true;
        return role switch
        {
            UserRole.Cashier => key is PermissionKeys.PosUse or PermissionKeys.CashierShifts or PermissionKeys.CashierClose
                                or PermissionKeys.CustomersView or PermissionKeys.InventoryView or PermissionKeys.SalesView,
            UserRole.Accountant => key.StartsWith("accounting.") || key.StartsWith("reports.") || key.StartsWith("sales.view")
                                || key is PermissionKeys.PurchasesView or PermissionKeys.InventoryView or PermissionKeys.CustomersView
                                or PermissionKeys.HrView or PermissionKeys.HrPayroll or PermissionKeys.HrInstallments,
            UserRole.Employee => key.EndsWith(".view"),
            _ => false
        };
    }
}
