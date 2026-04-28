using System.ComponentModel.DataAnnotations;

namespace BusinessSuite.Data.Models;

public enum PenaltyKind { Penalty = 0, Reward = 1 }

public class EmployeePenaltyReward
{
    public int Id { get; set; }
    public int EmployeeId { get; set; }
    public Employee? Employee { get; set; }

    public PenaltyKind Kind { get; set; }
    public DateTime Date { get; set; } = DateTime.Today;
    public decimal Amount { get; set; }

    public bool IsRecurring { get; set; }

    [MaxLength(300)]
    public string Reason { get; set; } = string.Empty;

    [MaxLength(120)]
    public string CreatedBy { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.Now;
}

public class MonthlyAbsence
{
    public int Id { get; set; }
    public int EmployeeId { get; set; }
    public Employee? Employee { get; set; }

    public int Year { get; set; }
    public int Month { get; set; }

    public int AbsentDays { get; set; }
    public int LateDays { get; set; }
    public int OvertimeHours { get; set; }
    public decimal DeductionAmount { get; set; }

    [MaxLength(200)]
    public string Notes { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.Now;
}

public class EmployeeInstallment
{
    public int Id { get; set; }
    public int EmployeeId { get; set; }
    public Employee? Employee { get; set; }

    public DateTime StartDate { get; set; } = DateTime.Today;

    public decimal TotalAmount { get; set; }
    public decimal MonthlyAmount { get; set; }
    public int TotalMonths { get; set; }
    public int PaidMonths { get; set; }

    public bool IsCompleted { get; set; }

    [MaxLength(300)]
    public string Description { get; set; } = string.Empty;

    [MaxLength(120)]
    public string CreatedBy { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.Now;
}
