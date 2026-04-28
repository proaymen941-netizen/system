using BusinessSuite.Data;
using BusinessSuite.Data.Models;
using Microsoft.EntityFrameworkCore;

namespace BusinessSuite.Services;

public class SessionService
{
    private readonly IDbContextFactory<AppDbContext> _dbFactory;

    public SessionService(IDbContextFactory<AppDbContext> dbFactory)
    {
        _dbFactory = dbFactory;
    }

    public async Task<int> StartAsync(AppUser user, string device, string ip, string branchCode = "01", string language = "عربي")
    {
        using var db = _dbFactory.CreateDbContext();
        var s = new UserSession
        {
            UserId = user.Id,
            Username = user.Username,
            FullName = user.FullName,
            BranchCode = branchCode,
            DeviceName = string.IsNullOrWhiteSpace(device) ? "غير معروف" : device,
            IpAddress = ip,
            Language = language,
            LoginAt = DateTime.Now,
            IsActive = true,
        };
        db.UserSessions.Add(s);
        await db.SaveChangesAsync();
        return s.Id;
    }

    public async Task EndAsync(int sessionId, string reason = "تسجيل خروج")
    {
        using var db = _dbFactory.CreateDbContext();
        var s = await db.UserSessions.FirstOrDefaultAsync(x => x.Id == sessionId);
        if (s == null) return;
        s.LogoutAt = DateTime.Now;
        s.IsActive = false;
        s.LogoutReason = reason;
        await db.SaveChangesAsync();
    }

    public async Task<List<UserSession>> GetActiveAsync()
    {
        using var db = _dbFactory.CreateDbContext();
        return await db.UserSessions.Where(s => s.IsActive)
            .OrderByDescending(s => s.LoginAt).ToListAsync();
    }

    public async Task<List<UserSession>> GetHistoryAsync(int limit = 200, int? userId = null, DateTime? from = null, DateTime? to = null)
    {
        using var db = _dbFactory.CreateDbContext();
        var q = db.UserSessions.AsQueryable();
        if (userId.HasValue) q = q.Where(s => s.UserId == userId.Value);
        if (from.HasValue) q = q.Where(s => s.LoginAt >= from.Value);
        if (to.HasValue) { var end = to.Value.AddDays(1); q = q.Where(s => s.LoginAt < end); }
        return await q.OrderByDescending(s => s.LoginAt).Take(limit).ToListAsync();
    }

    public async Task<int> GetActiveCountAsync()
    {
        using var db = _dbFactory.CreateDbContext();
        return await db.UserSessions.CountAsync(s => s.IsActive);
    }

    public async Task EndAllAsync(string reason = "إنهاء جلسات بالقوة")
    {
        using var db = _dbFactory.CreateDbContext();
        var active = await db.UserSessions.Where(s => s.IsActive).ToListAsync();
        var now = DateTime.Now;
        foreach (var s in active)
        {
            s.IsActive = false;
            s.LogoutAt = now;
            s.LogoutReason = reason;
        }
        await db.SaveChangesAsync();
    }
}
