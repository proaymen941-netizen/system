using BusinessSuite.Data;
using BusinessSuite.Data.Models;
using Microsoft.EntityFrameworkCore;

namespace BusinessSuite.Services;

public class CustomerService
{
    private readonly IDbContextFactory<AppDbContext> _factory;
    private readonly AuthService _auth;

    public CustomerService(IDbContextFactory<AppDbContext> factory, AuthService auth)
    {
        _factory = factory;
        _auth = auth;
    }

    public async Task<List<Customer>> GetAsync(string? search = null)
    {
        await using var db = _factory.CreateDbContext();
        var q = db.Customers.AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
            q = q.Where(c => c.Name.Contains(search) || c.Phone.Contains(search) || c.Email.Contains(search));
        return await q.OrderBy(c => c.Name).ToListAsync();
    }

    public async Task<Customer?> GetAsync(int id)
    {
        await using var db = _factory.CreateDbContext();
        return await db.Customers.FindAsync(id);
    }

    public async Task SaveAsync(Customer c)
    {
        if (!_auth.HasRole(UserRole.Admin, UserRole.Accountant, UserRole.Cashier))
            throw new AuthorizationException();
        await using var db = _factory.CreateDbContext();
        if (c.Id == 0) db.Customers.Add(c); else db.Customers.Update(c);
        await db.SaveChangesAsync();
    }

    public async Task DeleteAsync(int id)
    {
        if (!_auth.HasRole(UserRole.Admin, UserRole.Accountant))
            throw new AuthorizationException();
        await using var db = _factory.CreateDbContext();
        var c = await db.Customers.FindAsync(id);
        if (c != null) { db.Customers.Remove(c); await db.SaveChangesAsync(); }
    }
}
