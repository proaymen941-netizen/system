using BusinessSuite.Data;
using BusinessSuite.Data.Models;
using Microsoft.EntityFrameworkCore;

namespace BusinessSuite.Services;

public class InventoryService
{
    private readonly IDbContextFactory<AppDbContext> _factory;
    private readonly AuthService _auth;
    private readonly StockMovementService _stock;

    public InventoryService(IDbContextFactory<AppDbContext> factory, AuthService auth, StockMovementService stock)
    {
        _factory = factory;
        _auth = auth;
        _stock = stock;
    }

    public async Task<List<Product>> GetProductsAsync(string? search = null)
    {
        await using var db = _factory.CreateDbContext();
        var q = db.Products.AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
            q = q.Where(p => p.Name.Contains(search) || p.Sku.Contains(search) || p.Category.Contains(search));
        return await q.OrderBy(p => p.Name).ToListAsync();
    }

    public async Task<Product?> GetProductAsync(int id)
    {
        await using var db = _factory.CreateDbContext();
        return await db.Products.FindAsync(id);
    }

    public async Task<Product?> GetByBarcodeAsync(string barcode)
    {
        await using var db = _factory.CreateDbContext();
        return await db.Products.FirstOrDefaultAsync(p => p.Sku == barcode);
    }

    public async Task<Product?> GetByDisplayNumberAsync(int number)
    {
        if (number <= 0) return null;
        await using var db = _factory.CreateDbContext();
        return await db.Products.FirstOrDefaultAsync(p => p.DisplayNumber == number);
    }

    public async Task<int> GetNextDisplayNumberAsync()
    {
        await using var db = _factory.CreateDbContext();
        var max = await db.Products.MaxAsync(p => (int?)p.DisplayNumber) ?? 0;
        return max + 1;
    }

    public async Task SaveProductAsync(Product p)
    {
        if (!_auth.HasRole(UserRole.Admin, UserRole.Accountant)) throw new AuthorizationException();
        await using var db = _factory.CreateDbContext();
        if (p.Id == 0)
        {
            db.Products.Add(p);
            await db.SaveChangesAsync();
            await _stock.LogAsync(db, p.Id, MovementType.Initial, p.Quantity, "إنشاء", "كمية ابتدائية");
            await db.SaveChangesAsync();
        }
        else
        {
            var existing = await db.Products.FindAsync(p.Id);
            if (existing != null)
            {
                int oldQty = existing.Quantity;
                existing.Name = p.Name;
                existing.Sku = p.Sku;
                existing.Category = p.Category;
                existing.Price = p.Price;
                existing.Cost = p.Cost;
                existing.Quantity = p.Quantity;
                existing.MinQuantity = p.MinQuantity;
                existing.ImageEmoji = p.ImageEmoji;
                int delta = p.Quantity - oldQty;
                if (delta != 0)
                    await _stock.LogAsync(db, existing.Id, MovementType.Adjustment, delta, "تعديل يدوي", "تعديل الكمية");
                await db.SaveChangesAsync();
            }
        }
    }

    public async Task DeleteProductAsync(int id)
    {
        if (!_auth.HasRole(UserRole.Admin)) throw new AuthorizationException();
        await using var db = _factory.CreateDbContext();
        var p = await db.Products.FindAsync(id);
        if (p != null) { db.Products.Remove(p); await db.SaveChangesAsync(); }
    }

    public async Task<List<Product>> GetLowStockAsync()
    {
        await using var db = _factory.CreateDbContext();
        return await db.Products.Where(p => p.Quantity <= p.MinQuantity).ToListAsync();
    }

    public async Task ImportProductsAsync(List<Product> items)
    {
        if (!_auth.HasRole(UserRole.Admin)) throw new AuthorizationException();
        await using var db = _factory.CreateDbContext();
        foreach (var p in items)
        {
            var existing = await db.Products.FirstOrDefaultAsync(x => x.Sku == p.Sku);
            if (existing == null)
            {
                db.Products.Add(p);
            }
            else
            {
                existing.Name = p.Name;
                existing.Category = p.Category;
                existing.Price = p.Price;
                existing.Cost = p.Cost;
                existing.Quantity = p.Quantity;
                existing.MinQuantity = p.MinQuantity;
                if (!string.IsNullOrWhiteSpace(p.ImageEmoji)) existing.ImageEmoji = p.ImageEmoji;
            }
        }
        await db.SaveChangesAsync();
    }
}
