using System.ComponentModel.DataAnnotations;

namespace BusinessSuite.Data.Models;

public class Employee
{
    public int Id { get; set; }

    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(80)]
    public string Position { get; set; } = string.Empty;

    [MaxLength(80)]
    public string Department { get; set; } = string.Empty;

    [MaxLength(20)]
    public string Phone { get; set; } = string.Empty;

    [MaxLength(120)]
    public string Email { get; set; } = string.Empty;

    public decimal Salary { get; set; }

    public DateTime HireDate { get; set; } = DateTime.Today;

    public EmployeeStatus Status { get; set; } = EmployeeStatus.Active;

    public List<Attendance> Attendances { get; set; } = new();
    public List<LeaveRequest> Leaves { get; set; } = new();
}

public enum EmployeeStatus { Active, OnLeave, Inactive }

public class Attendance
{
    public int Id { get; set; }
    public int EmployeeId { get; set; }
    public Employee? Employee { get; set; }
    public DateTime Date { get; set; } = DateTime.Today;
    public TimeSpan? CheckIn { get; set; }
    public TimeSpan? CheckOut { get; set; }
    public string Status { get; set; } = "حاضر";
}

public class LeaveRequest
{
    public int Id { get; set; }
    public int EmployeeId { get; set; }
    public Employee? Employee { get; set; }
    public DateTime From { get; set; }
    public DateTime To { get; set; }
    public string Type { get; set; } = "سنوية";
    public string Status { get; set; } = "معلقة";
    public string Notes { get; set; } = string.Empty;
}
