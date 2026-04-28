using System.ComponentModel.DataAnnotations;

namespace BusinessSuite.Data.Models;

public class SalesReturn
{
    public int Id { get; set; }

    [MaxLength(30)]
    public string ReturnNumber { get; set; } = string.Empty;

    public DateTime Date { get; set; } = DateTime.Now;

    public int? OriginalInvoiceId { get; set; }

    [MaxLength(30)]
    public string OriginalInvoiceNumber { get; set; } = string.Empty;

    public int? CustomerId { get; set; }

    [MaxLength(120)]
    public string CustomerName { get; set; } = string.Empty;

    public decimal Subtotal { get; set; }
    public decimal Tax { get; set; }
    public decimal Total { get; set; }

    [MaxLength(40)]
    public string RefundMethod { get; set; } = "نقدي";

    [MaxLength(300)]
    public string Reason { get; set; } = string.Empty;

    [MaxLength(120)]
    public string CreatedBy { get; set; } = string.Empty;

    public List<SalesReturnItem> Items { get; set; } = new();
}

public class SalesReturnItem
{
    public int Id { get; set; }
    public int SalesReturnId { get; set; }
    public SalesReturn? Return { get; set; }

    public int ProductId { get; set; }

    [MaxLength(120)]
    public string ProductName { get; set; } = string.Empty;

    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal LineTotal { get; set; }
}

public enum StockIssueReason { InternalUse = 0, Transfer = 1, Damaged = 2, Sample = 3, Other = 4 }

public class StockIssueVoucher
{
    public int Id { get; set; }

    [MaxLength(30)]
    public string VoucherNumber { get; set; } = string.Empty;

    public DateTime Date { get; set; } = DateTime.Now;

    public StockIssueReason Reason { get; set; }

    [MaxLength(120)]
    public string Department { get; set; } = string.Empty;

    [MaxLength(120)]
    public string ReceivedBy { get; set; } = string.Empty;

    [MaxLength(300)]
    public string Notes { get; set; } = string.Empty;

    [MaxLength(120)]
    public string CreatedBy { get; set; } = string.Empty;

    public bool IsPosted { get; set; }

    public List<StockIssueItem> Items { get; set; } = new();
}

public class StockIssueItem
{
    public int Id { get; set; }
    public int StockIssueVoucherId { get; set; }
    public StockIssueVoucher? Voucher { get; set; }

    public int ProductId { get; set; }

    [MaxLength(120)]
    public string ProductName { get; set; } = string.Empty;

    public int Quantity { get; set; }
    public decimal UnitCost { get; set; }
    public decimal LineTotal { get; set; }
}

public enum MaintenanceStatus { New = 0, InProgress = 1, WaitingParts = 2, Completed = 3, Cancelled = 4 }

public class MaintenanceRequest
{
    public int Id { get; set; }

    [MaxLength(30)]
    public string TicketNumber { get; set; } = string.Empty;

    public DateTime Date { get; set; } = DateTime.Now;

    public int? CustomerId { get; set; }

    [MaxLength(120)]
    public string CustomerName { get; set; } = string.Empty;

    [MaxLength(20)]
    public string Phone { get; set; } = string.Empty;

    [MaxLength(120)]
    public string DeviceName { get; set; } = string.Empty;

    [MaxLength(120)]
    public string SerialNumber { get; set; } = string.Empty;

    [MaxLength(500)]
    public string ProblemDescription { get; set; } = string.Empty;

    [MaxLength(500)]
    public string Diagnosis { get; set; } = string.Empty;

    public int? TechnicianId { get; set; }

    [MaxLength(120)]
    public string TechnicianName { get; set; } = string.Empty;

    public MaintenanceStatus Status { get; set; } = MaintenanceStatus.New;

    public decimal EstimatedCost { get; set; }
    public decimal ActualCost { get; set; }

    public DateTime? CompletedAt { get; set; }

    [MaxLength(300)]
    public string Notes { get; set; } = string.Empty;
}
