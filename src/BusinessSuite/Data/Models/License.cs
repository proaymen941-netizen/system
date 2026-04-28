using System.ComponentModel.DataAnnotations;

namespace BusinessSuite.Data.Models;

public enum DeviceKind { Manager = 0, Cashier = 1, Accountant = 2 }

public class LicenseInfo
{
    public int Id { get; set; }

    [MaxLength(120)]
    public string CustomerName { get; set; } = "غير مفعل";

    [MaxLength(80)]
    public string LicenseKey { get; set; } = string.Empty;

    public int MaxManagerDevices { get; set; } = 1;
    public int MaxCashierDevices { get; set; } = 1;
    public int MaxAccountantDevices { get; set; } = 0;

    public DateTime ActivatedAt { get; set; } = DateTime.Now;
    public DateTime? ExpiresAt { get; set; }
    public bool IsActive { get; set; } = true;

    [MaxLength(300)]
    public string Notes { get; set; } = string.Empty;

    [MaxLength(120)]
    public string IssuedBy { get; set; } = "النظام";
}

public class RegisteredDevice
{
    public int Id { get; set; }

    [Required, MaxLength(80)]
    public string DeviceFingerprint { get; set; } = string.Empty;

    [MaxLength(120)]
    public string DeviceName { get; set; } = string.Empty;

    public DeviceKind Kind { get; set; } = DeviceKind.Cashier;

    [MaxLength(60)]
    public string IpAddress { get; set; } = string.Empty;

    [MaxLength(300)]
    public string UserAgent { get; set; } = string.Empty;

    public DateTime RegisteredAt { get; set; } = DateTime.Now;
    public DateTime LastSeenAt { get; set; } = DateTime.Now;
    public bool IsActive { get; set; } = true;
    public bool IsBlocked { get; set; }

    [MaxLength(200)]
    public string Notes { get; set; } = string.Empty;
}
