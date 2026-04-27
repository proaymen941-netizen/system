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

    public int? UserNumber { get; set; }

    [MaxLength(120)]
    public string Email { get; set; } = string.Empty;

    [MaxLength(20)]
    public string Phone { get; set; } = string.Empty;

    [MaxLength(250)]
    public string Address { get; set; } = string.Empty;

    [MaxLength(80)]
    public string Position { get; set; } = string.Empty;

    [MaxLength(80)]
    public string Department { get; set; } = string.Empty;

    public DateTime? DateOfBirth { get; set; }

    public int? EmployeeId { get; set; }
}

public class CashierShift
{
    public int Id { get; set; }
    public int CashierId { get; set; }

    [MaxLength(120)]
    public string CashierName { get; set; } = string.Empty;
    public DateTime OpenedAt { get; set; } = DateTime.Now;
    public DateTime? ClosedAt { get; set; }
    public decimal OpeningCash { get; set; }
    public decimal ClosingCash { get; set; }
    public decimal TotalSales { get; set; }
    public decimal TotalCash { get; set; }
    public decimal TotalCard { get; set; }
    public decimal TotalOther { get; set; }
    public int InvoiceCount { get; set; }

    [MaxLength(300)]
    public string Notes { get; set; } = string.Empty;
    public bool IsClosed { get; set; }
}
