using System.ComponentModel.DataAnnotations;

namespace BusinessSuite.Data.Models;

public class AuditLog
{
    public int Id { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.Now;

    [MaxLength(80)]
    public string User { get; set; } = "النظام";

    [MaxLength(80)]
    public string Action { get; set; } = string.Empty;

    [MaxLength(80)]
    public string Module { get; set; } = string.Empty;

    [MaxLength(300)]
    public string Details { get; set; } = string.Empty;
}

public enum UserRole { Admin, Accountant, Cashier, Employee }

public class AppUser
{
    public int Id { get; set; }

    [Required, MaxLength(60)]
    public string Username { get; set; } = string.Empty;

    [Required, MaxLength(120)]
    public string FullName { get; set; } = string.Empty;

    [MaxLength(64)]
    public string PasswordHash { get; set; } = string.Empty;

    public UserRole Role { get; set; } = UserRole.Employee;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.Now;
}
