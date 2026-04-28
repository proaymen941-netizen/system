using BusinessSuite.Data;
using BusinessSuite.Data.Models;
using Microsoft.EntityFrameworkCore;

namespace BusinessSuite.Services;

public class StockMovementService
{
    private readonly IDbContextFactory<AppDbContext> _factory;
    private readonly AuthService _auth;

    public StockMovementService(IDbContextFactory<AppDbContext> factory, AuthService auth)
    {
        _factory = factory;
        _auth = auth;
    }

    public async Task LogAsync(AppDbContext db, int productId, MovementType type, int change, string reference, string notes = "")
    {
        var product = await db.Products.FindAsync(productId);
        if (product == null) return;
        db.StockMovements.Add(new StockMovement
        {
            ProductId = productId,
            ProductName = product.Name,
            Type = type,
            Change = change,
            BalanceAfter = product.Quantity,
            Reference = reference,
            User = _auth.CurrentUser?.FullName ?? "النظام",
            Notes = notes,
            Date = DateTime.Now,
        });
    }

    public async Task<List<StockMovement>> GetAsync(int? productId = null, DateTime? from = null, DateTime? to = null, int take = 500)
    {
        await using var db = _factory.CreateDbContext();
        var q = db.StockMovements.AsQueryable();
        if (productId.HasValue) q = q.Where(m => m.ProductId == productId.Value);
        if (from.HasValue) q = q.Where(m => m.Date >= from.Value);
        if (to.HasValue) q = q.Where(m => m.Date <= to.Value.AddDays(1));
        return await q.OrderByDescending(m => m.Date).Take(take).ToListAsync();
    }
}
