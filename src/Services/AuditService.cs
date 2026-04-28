using BusinessSuite.Data;
using BusinessSuite.Data.Models;
using Microsoft.EntityFrameworkCore;

namespace BusinessSuite.Services;

public class AuditService
{
    private readonly IDbContextFactory<AppDbContext> _factory;
    private readonly AuthService _auth;

    public AuditService(IDbContextFactory<AppDbContext> factory, AuthService auth)
    {
        _factory = factory;
        _auth = auth;
    }

    public async Task LogAsync(string action, string module, string details = "")
    {
        await using var db = _factory.CreateDbContext();
        db.AuditLogs.Add(new AuditLog
        {
            User = _auth.CurrentUser?.FullName ?? "النظام",
            Action = action,
            Module = module,
            Details = details,
        });
        await db.SaveChangesAsync();
    }

    public async Task<List<AuditLog>> GetLogsAsync(int take = 200)
    {
        await using var db = _factory.CreateDbContext();
        return await db.AuditLogs.OrderByDescending(l => l.Timestamp).Take(take).ToListAsync();
    }
}
