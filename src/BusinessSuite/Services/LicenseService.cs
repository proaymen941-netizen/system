using BusinessSuite.Data;
using BusinessSuite.Data.Models;
using Microsoft.EntityFrameworkCore;

namespace BusinessSuite.Services;

public class LicenseService
{
    private readonly IDbContextFactory<AppDbContext> _factory;
    public LicenseService(IDbContextFactory<AppDbContext> factory) => _factory = factory;

    public async Task<LicenseInfo> GetOrCreateAsync()
    {
        await using var db = _factory.CreateDbContext();
        var lic = await db.Licenses.FirstOrDefaultAsync();
        if (lic == null)
        {
            lic = new LicenseInfo
            {
                CustomerName = "ترخيص افتراضي",
                LicenseKey = Guid.NewGuid().ToString("N").Substring(0, 16).ToUpperInvariant(),
                MaxManagerDevices = 1,
                MaxCashierDevices = 1,
                MaxAccountantDevices = 0,
                ActivatedAt = DateTime.Now,
                IsActive = true,
                IssuedBy = "النظام (تجريبي)",
                Notes = "ترخيص تجريبي تم إنشاؤه تلقائياً. يمكن للمدير تعديله أو إدخال مفتاح جديد.",
            };
            db.Licenses.Add(lic);
            await db.SaveChangesAsync();
        }
        return lic;
    }

    public async Task UpdateAsync(LicenseInfo updated)
    {
        await using var db = _factory.CreateDbContext();
        var lic = await db.Licenses.FirstOrDefaultAsync();
        if (lic == null)
        {
            db.Licenses.Add(updated);
        }
        else
        {
            lic.CustomerName = updated.CustomerName;
            lic.LicenseKey = updated.LicenseKey;
            lic.MaxManagerDevices = updated.MaxManagerDevices;
            lic.MaxCashierDevices = updated.MaxCashierDevices;
            lic.MaxAccountantDevices = updated.MaxAccountantDevices;
            lic.ExpiresAt = updated.ExpiresAt;
            lic.IsActive = updated.IsActive;
            lic.Notes = updated.Notes;
            lic.IssuedBy = updated.IssuedBy;
        }
        await db.SaveChangesAsync();
    }

    public bool IsExpired(LicenseInfo lic) =>
        lic.ExpiresAt.HasValue && lic.ExpiresAt.Value.Date < DateTime.Today;

    public async Task<List<RegisteredDevice>> GetDevicesAsync()
    {
        await using var db = _factory.CreateDbContext();
        return await db.Devices.OrderByDescending(d => d.LastSeenAt).ToListAsync();
    }

    public async Task<RegisteredDevice?> FindByFingerprintAsync(string fingerprint)
    {
        await using var db = _factory.CreateDbContext();
        return await db.Devices.FirstOrDefaultAsync(d => d.DeviceFingerprint == fingerprint);
    }

    public enum RegistrationResult { Allowed, NewlyRegistered, LimitReached, Blocked, LicenseInactive, LicenseExpired }

    public async Task<(RegistrationResult Status, RegisteredDevice? Device, string Message)> RegisterOrCheckAsync(
        string fingerprint, DeviceKind kind, string ip, string userAgent, string deviceName)
    {
        await using var db = _factory.CreateDbContext();
        var lic = await db.Licenses.FirstOrDefaultAsync();
        if (lic == null || !lic.IsActive)
            return (RegistrationResult.LicenseInactive, null, "الترخيص غير مفعل. يرجى مراجعة المدير.");

        if (lic.ExpiresAt.HasValue && lic.ExpiresAt.Value.Date < DateTime.Today)
            return (RegistrationResult.LicenseExpired, null, $"انتهت صلاحية الترخيص بتاريخ {lic.ExpiresAt:yyyy-MM-dd}. يرجى تجديده.");

        var device = await db.Devices.FirstOrDefaultAsync(d => d.DeviceFingerprint == fingerprint);
        if (device != null)
        {
            if (device.IsBlocked) return (RegistrationResult.Blocked, device, "تم حظر هذا الجهاز من قبل المدير.");
            if (!device.IsActive) return (RegistrationResult.Blocked, device, "هذا الجهاز معطل من قبل المدير.");
            device.LastSeenAt = DateTime.Now;
            device.IpAddress = ip;
            device.UserAgent = userAgent;
            if (device.Kind != kind) device.Kind = kind;
            await db.SaveChangesAsync();
            return (RegistrationResult.Allowed, device, "");
        }

        var activeCount = await db.Devices.CountAsync(d => d.Kind == kind && d.IsActive && !d.IsBlocked);
        var max = kind switch
        {
            DeviceKind.Manager => lic.MaxManagerDevices,
            DeviceKind.Cashier => lic.MaxCashierDevices,
            DeviceKind.Accountant => lic.MaxAccountantDevices,
            _ => 0
        };

        if (activeCount >= max)
        {
            var kindArabic = kind switch
            {
                DeviceKind.Manager => "إدارة",
                DeviceKind.Cashier => "كاشير",
                DeviceKind.Accountant => "محاسبة",
                _ => "غير معروف"
            };
            return (RegistrationResult.LimitReached, null,
                $"تم بلوغ الحد الأقصى لأجهزة {kindArabic} المسموحة بالترخيص ({activeCount}/{max}). يرجى مراجعة المدير لتجديد الترخيص أو إلغاء جهاز قديم.");
        }

        var newDevice = new RegisteredDevice
        {
            DeviceFingerprint = fingerprint,
            DeviceName = string.IsNullOrWhiteSpace(deviceName) ? $"جهاز {kind} #{Guid.NewGuid().ToString("N")[..6].ToUpperInvariant()}" : deviceName,
            Kind = kind,
            IpAddress = ip,
            UserAgent = userAgent,
            RegisteredAt = DateTime.Now,
            LastSeenAt = DateTime.Now,
            IsActive = true,
        };
        db.Devices.Add(newDevice);
        await db.SaveChangesAsync();
        return (RegistrationResult.NewlyRegistered, newDevice, "تم تسجيل الجهاز بنجاح.");
    }

    public async Task SetDeviceStateAsync(int id, bool isActive, bool isBlocked, string? newName = null, DeviceKind? newKind = null)
    {
        await using var db = _factory.CreateDbContext();
        var d = await db.Devices.FindAsync(id);
        if (d == null) return;
        d.IsActive = isActive;
        d.IsBlocked = isBlocked;
        if (!string.IsNullOrWhiteSpace(newName)) d.DeviceName = newName;
        if (newKind.HasValue) d.Kind = newKind.Value;
        await db.SaveChangesAsync();
    }

    public async Task DeleteDeviceAsync(int id)
    {
        await using var db = _factory.CreateDbContext();
        var d = await db.Devices.FindAsync(id);
        if (d != null) { db.Devices.Remove(d); await db.SaveChangesAsync(); }
    }

    public async Task<(int Mgr, int MgrMax, int Csh, int CshMax, int Acc, int AccMax)> GetUsageAsync()
    {
        await using var db = _factory.CreateDbContext();
        var lic = await db.Licenses.FirstOrDefaultAsync();
        var mgrMax = lic?.MaxManagerDevices ?? 0;
        var cshMax = lic?.MaxCashierDevices ?? 0;
        var accMax = lic?.MaxAccountantDevices ?? 0;
        var mgr = await db.Devices.CountAsync(d => d.Kind == DeviceKind.Manager && d.IsActive && !d.IsBlocked);
        var csh = await db.Devices.CountAsync(d => d.Kind == DeviceKind.Cashier && d.IsActive && !d.IsBlocked);
        var acc = await db.Devices.CountAsync(d => d.Kind == DeviceKind.Accountant && d.IsActive && !d.IsBlocked);
        return (mgr, mgrMax, csh, cshMax, acc, accMax);
    }
}
