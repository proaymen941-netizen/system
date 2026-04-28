using BusinessSuite.Data;
using BusinessSuite.Data.Models;
using Microsoft.EntityFrameworkCore;

namespace BusinessSuite.Services;

public class CompanySettingsService
{
    private readonly IDbContextFactory<AppDbContext> _factory;
    private readonly AuthService _auth;
    private CompanySettings? _cache;

    public CompanySettingsService(IDbContextFactory<AppDbContext> factory, AuthService auth)
    {
        _factory = factory;
        _auth = auth;
    }

    public async Task<CompanySettings> GetAsync()
    {
        if (_cache != null) return _cache;
        await using var db = _factory.CreateDbContext();
        var s = await db.CompanySettings.FirstOrDefaultAsync();
        if (s == null)
        {
            s = new CompanySettings();
            db.CompanySettings.Add(s);
            await db.SaveChangesAsync();
        }
        _cache = s;
        return s;
    }

    public async Task SaveAsync(CompanySettings s)
    {
        if (!_auth.HasRole(UserRole.Admin)) throw new AuthorizationException();
        await using var db = _factory.CreateDbContext();
        var existing = await db.CompanySettings.FirstOrDefaultAsync();
        if (existing == null)
        {
            db.CompanySettings.Add(s);
        }
        else
        {
            existing.Name = s.Name;
            existing.TaxNumber = s.TaxNumber;
            existing.CommercialRegister = s.CommercialRegister;
            existing.Phone = s.Phone;
            existing.Email = s.Email;
            existing.Address = s.Address;
            existing.Currency = s.Currency;
            existing.TaxRate = s.TaxRate;
            existing.LogoEmoji = s.LogoEmoji;
            existing.ReceiptHeader = s.ReceiptHeader;
            existing.ReceiptFooter = s.ReceiptFooter;
            existing.ShowTaxOnReceipt = s.ShowTaxOnReceipt;
            existing.ShowQrOnReceipt = s.ShowQrOnReceipt;
            existing.PrintKitchenCopy = s.PrintKitchenCopy;
            existing.RestaurantMode = s.RestaurantMode;
            existing.OrderTypeLocal = s.OrderTypeLocal;
            existing.OrderTypeTakeaway = s.OrderTypeTakeaway;
            existing.OrderTypeDelivery = s.OrderTypeDelivery;
            existing.BranchCode = s.BranchCode;
            existing.ArabicName = s.ArabicName;
            existing.ForeignName = s.ForeignName;
            existing.ArabicAddress = s.ArabicAddress;
            existing.ForeignAddress = s.ForeignAddress;
            existing.FinancialYear = s.FinancialYear;
            existing.Fax = s.Fax;
            existing.PoBox = s.PoBox;
            existing.Website = s.Website;
        }
        await db.SaveChangesAsync();
        _cache = null;
    }
}
