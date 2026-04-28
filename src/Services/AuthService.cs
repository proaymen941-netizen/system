using System.Security.Cryptography;
using System.Text;
using BusinessSuite.Data;
using BusinessSuite.Data.Models;
using Microsoft.EntityFrameworkCore;

namespace BusinessSuite.Services;

public class AuthService
{
    private readonly IDbContextFactory<AppDbContext> _factory;
    public AuthService(IDbContextFactory<AppDbContext> factory) => _factory = factory;

    public AppUser? CurrentUser { get; private set; }
    public bool IsAuthenticated => CurrentUser != null;

    public event Action? OnChange;

      public async Task<bool> IsFirstRunAsync()
    {
        await using var db = _factory.CreateDbContext();
        return !await db.Users.AnyAsync();
    }

    public async Task<bool> CreateFirstAdminAsync(string username, string fullName, string password)
    {
        await using var db = _factory.CreateDbContext();
        if (await db.Users.AnyAsync()) return false;
        var user = new AppUser
        {
            Username = username.Trim(),
            FullName = fullName.Trim(),
            PasswordHash = Hash(password),
            Role = UserRole.Admin,
            IsActive = true,
            UserNumber = 100,
            CreatedAt = DateTime.Now
        };
        db.Users.Add(user);
        db.AuditLogs.Add(new AuditLog { User = fullName, Action = "إنشاء النظام", Module = "النظام", Details = "تم إنشاء حساب المدير الأول وبدء تشغيل النظام" });
        await db.SaveChangesAsync();
        CurrentUser = user;
        OnChange?.Invoke();
        return true;
    }

    public async Task<bool> LoginAsync(string username, string password)
    {
        await using var db = _factory.CreateDbContext();
        var hash = Hash(password);
        var user = await db.Users.FirstOrDefaultAsync(u => u.Username == username && u.PasswordHash == hash && u.IsActive);
        if (user == null) return false;
        await PopulateEmployeeInfo(db, user);
        CurrentUser = user;
        db.AuditLogs.Add(new AuditLog { User = user.FullName, Action = "تسجيل دخول", Module = "النظام", Details = $"تسجيل دخول المستخدم {user.Username}" });
        await db.SaveChangesAsync();
        OnChange?.Invoke();
        return true;
    }

     public async Task<bool> LoginByNumberAsync(int userNumber, string password)
    {
        await using var db = _factory.CreateDbContext();
        var hash = Hash(password);
        var user = await db.Users.FirstOrDefaultAsync(u => u.UserNumber == userNumber && u.PasswordHash == hash && u.IsActive);
        if (user == null) return false;
        await PopulateEmployeeInfo(db, user);
        CurrentUser = user;
        db.AuditLogs.Add(new AuditLog { User = user.FullName, Action = "تسجيل دخول", Module = "النظام", Details = $"تسجيل دخول برقم المستخدم {userNumber}" });
        await db.SaveChangesAsync();
        OnChange?.Invoke();
        return true;
    }

     public void Logout()
    {
        CurrentUser = null;
        OnChange?.Invoke();
    }

     public async Task<bool> LoginDirectForAdmin(int userId)
    {
        await using var db = _factory.CreateDbContext();
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId && u.IsActive);
        if (user == null) return false;
        await PopulateEmployeeInfo(db, user);
        CurrentUser = user;
        db.AuditLogs.Add(new AuditLog { User = user.FullName, Action = "تسجيل دخول مباشر", Module = "النظام", Details = $"الدخول المباشر للمستخدم {user.Username} بواسطة المسؤول" });
        await db.SaveChangesAsync();
        OnChange?.Invoke();
        return true;
    }

    private async Task PopulateEmployeeInfo(AppDbContext db, AppUser user)
    {
        var employee = await db.Employees.FirstOrDefaultAsync(e => e.Id == user.EmployeeId);
        if (employee != null)
        {
            user.Email = employee.Email;
            user.Phone = employee.Phone;
            user.Position = employee.Position;
            user.Department = employee.Department;
        }
    }

    public bool HasRole(params UserRole[] roles)
        => CurrentUser != null && roles.Contains(CurrentUser.Role);

    public static string Hash(string input)
    {
        using var sha = SHA256.Create();
        var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(input));
        return Convert.ToHexString(bytes);
    }

    public async Task<List<AppUser>> GetUsersAsync()
    {
        await using var db = _factory.CreateDbContext();
        return await db.Users.OrderBy(u => u.Username).ToListAsync();
    }

    public async Task SaveUserAsync(AppUser user, string? newPassword = null)
    {
        await using var db = _factory.CreateDbContext();
        if (user.Id == 0)
        {
            user.PasswordHash = Hash(newPassword ?? "12345");
            db.Users.Add(user);
        }
        else
        {
            if (!string.IsNullOrEmpty(newPassword))
                user.PasswordHash = Hash(newPassword);
            db.Users.Update(user);
        }
        await db.SaveChangesAsync();
    }

    public async Task DeleteUserAsync(int id)
    {
        await using var db = _factory.CreateDbContext();
        var u = await db.Users.FindAsync(id);
        if (u != null) { db.Users.Remove(u); await db.SaveChangesAsync(); }
    }
}
